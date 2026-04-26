import { NextResponse } from "next/server";
import { googleFetch } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

const CAL_API = "https://www.googleapis.com/calendar/v3";

// ─── GET : liste les events (supporte multi-calendriers) ────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarIds = searchParams.get("calendarIds")?.split(",").filter(Boolean) || ["primary"];
    const timeMin = searchParams.get("timeMin") || new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
    const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString();

    const allEvents: Array<Record<string, unknown>> = [];

    for (const calId of calendarIds) {
      const url = `${CAL_API}/calendars/${encodeURIComponent(calId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=2500`;
      const res = await googleFetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as { items?: Record<string, unknown>[] };
      for (const ev of data.items || []) {
        allEvents.push({ ...ev, calendarId: calId });
      }
    }

    return NextResponse.json({ events: allEvents });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/calendar GET]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ─── POST : crée un event ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { calendarId = "primary", summary, description, location, start, end, colorId } = body as {
      calendarId?: string;
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime?: string; date?: string; timeZone?: string };
      end:   { dateTime?: string; date?: string; timeZone?: string };
      colorId?: string;
    };
    const payload: Record<string, unknown> = { summary, start, end };
    if (description) payload.description = description;
    if (location) payload.location = location;
    if (colorId) payload.colorId = colorId;

    const res = await googleFetch(
      `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      { method: "POST", body: JSON.stringify(payload) }
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "create_failed", detail: text }, { status: res.status });
    }
    const created = await res.json();
    return NextResponse.json({ event: { ...created, calendarId } });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/calendar POST]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ─── PATCH : modifie un event ───────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { calendarId = "primary", eventId, updates } = body as {
      calendarId?: string;
      eventId: string;
      updates: Record<string, unknown>;
    };
    if (!eventId) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }
    const res = await googleFetch(
      `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: "PATCH", body: JSON.stringify(updates) }
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "update_failed", detail: text }, { status: res.status });
    }
    const updated = await res.json();
    return NextResponse.json({ event: { ...updated, calendarId } });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/calendar PATCH]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ─── DELETE : supprime un event ─────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }
    const res = await googleFetch(
      `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: "DELETE" }
    );
    if (!res.ok && res.status !== 204 && res.status !== 410) {
      const text = await res.text();
      return NextResponse.json({ error: "delete_failed", detail: text }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/calendar DELETE]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
