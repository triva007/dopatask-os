import { NextResponse } from "next/server";
import { googleFetch } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

const CAL_API = "https://www.googleapis.com/calendar/v3";

interface GoogleCalendarListEntry {
  id: string;
  summary?: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  primary?: boolean;
  accessRole?: string;
}

// GET : list all calendars for the authenticated user
export async function GET() {
  try {
    const res = await googleFetch(`${CAL_API}/users/me/calendarList`);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "list_failed", detail: text }, { status: res.status });
    }
    const data = (await res.json()) as { items?: GoogleCalendarListEntry[] };
    const calendars = (data.items || []).map((c) => ({
      id: c.id,
      summary: c.summary || "(sans nom)",
      backgroundColor: c.backgroundColor || "#4285f4",
      foregroundColor: c.foregroundColor || "#ffffff",
      selected: c.selected !== false,
      primary: c.primary || false,
      accessRole: c.accessRole || "reader",
    }));
    return NextResponse.json({ calendars });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    console.error("[google/calendar/calendars GET]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
