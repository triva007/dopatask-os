import { NextResponse } from "next/server";
import { googleFetch } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

const KEEP_API = "https://keep.googleapis.com/v1";

export async function GET() {
  try {
    const res = await googleFetch(`${KEEP_API}/notes?pageSize=100`);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "keep_failed", detail: text }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ notes: data.notes || [] });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/keep GET]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await googleFetch(`${KEEP_API}/notes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "create_failed", detail: text }, { status: res.status });
    }
    const created = await res.json();
    return NextResponse.json(created);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/keep POST]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");
    if (!noteId) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const res = await googleFetch(`${KEEP_API}/${noteId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "delete_failed", detail: text }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/keep DELETE]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
