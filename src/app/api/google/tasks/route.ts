import { NextResponse } from "next/server";
import { googleFetch } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

const TASKS_API = "https://tasks.googleapis.com/tasks/v1";

interface GoogleTask {
  id: string;
  title?: string;
  notes?: string;
  status?: "needsAction" | "completed";
  due?: string;
  completed?: string;
  updated?: string;
  parent?: string;
}

interface GoogleTaskList {
  id: string;
  title?: string;
}

// ─── GET : liste toutes les tâches Google (toutes listes confondues) ────────
export async function GET() {
  try {
    // 1) Récupérer toutes les listes
    const listsRes = await googleFetch(`${TASKS_API}/users/@me/lists`);
    if (!listsRes.ok) {
      const text = await listsRes.text();
      return NextResponse.json({ error: "lists_failed", detail: text }, { status: listsRes.status });
    }
    const listsData = (await listsRes.json()) as { items?: GoogleTaskList[] };
    const lists = listsData.items || [];

    // 2) Pour chaque liste, récupérer les tâches
    const all: Array<GoogleTask & { listId: string; listTitle: string }> = [];
    for (const list of lists) {
      const tasksRes = await googleFetch(
        `${TASKS_API}/lists/${list.id}/tasks?showCompleted=true&showHidden=true&maxResults=100`
      );
      if (!tasksRes.ok) continue;
      const data = (await tasksRes.json()) as { items?: GoogleTask[] };
      for (const t of data.items || []) {
        all.push({ ...t, listId: list.id, listTitle: list.title || "" });
      }
    }

    return NextResponse.json({ lists, tasks: all });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/tasks GET]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ─── POST : crée une tâche dans la liste par défaut (ou listId fourni) ───────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listId, taskListId, title, notes, due, status } = body as {
      listId?: string;
      taskListId?: string;
      title: string;
      notes?: string;
      due?: string;
      status?: "needsAction" | "completed";
    };

    let targetListId = listId || taskListId;
    if (!targetListId) {
      const listsRes = await googleFetch(`${TASKS_API}/users/@me/lists`);
      const listsData = (await listsRes.json()) as { items?: GoogleTaskList[] };
      targetListId = listsData.items?.[0]?.id;
      if (!targetListId) {
        return NextResponse.json({ error: "no_list" }, { status: 400 });
      }
    }

    const payload: Record<string, unknown> = { title };
    if (notes) payload.notes = notes;
    if (due) payload.due = due;
    if (status) payload.status = status;

    const res = await googleFetch(`${TASKS_API}/lists/${targetListId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "create_failed", detail: text }, { status: res.status });
    }
    const created = await res.json();
    return NextResponse.json({ task: created, listId: targetListId });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/tasks POST]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ─── PATCH : modifie une tâche ───────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { listId, taskListId, taskId, updates } = body as {
      listId?: string;
      taskListId?: string;
      taskId: string;
      updates: Partial<GoogleTask>;
    };
    const targetListId = listId || taskListId;
    if (!targetListId || !taskId) {
      return NextResponse.json({ error: "missing_ids" }, { status: 400 });
    }
    const res = await googleFetch(`${TASKS_API}/lists/${targetListId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "update_failed", detail: text }, { status: res.status });
    }
    const updated = await res.json();
    return NextResponse.json({ task: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/tasks PATCH]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ─── DELETE : supprime une tâche ─────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId") || searchParams.get("taskListId");
    const taskId = searchParams.get("taskId");
    if (!listId || !taskId) {
      return NextResponse.json({ error: "missing_ids" }, { status: 400 });
    }
    const res = await googleFetch(`${TASKS_API}/lists/${listId}/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      return NextResponse.json({ error: "delete_failed", detail: text }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/tasks DELETE]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
