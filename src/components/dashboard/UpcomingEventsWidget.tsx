"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Clock } from "lucide-react";

interface GEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?:   { dateTime?: string; date?: string };
}

function formatRelative(d: Date): string {
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 0) return "en cours";
  if (diffMin < 60) return "dans " + diffMin + " min";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayOnly = new Date(d); dayOnly.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dayOnly.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "aujourd'hui " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "demain " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function UpcomingEventsWidget() {
  const [events, setEvents] = useState<GEvent[] | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchEvents = async () => {
      try {
        const r = await fetch("/api/google/calendar/events?timeMin=" + encodeURIComponent(new Date().toISOString()), { cache: "no-store" });
        if (cancelled) return;
        if (r.status === 401) { setConnected(false); return; }
        if (!r.ok) { setConnected(false); return; }
        const d = (await r.json()) as { events: GEvent[] };
        const upcoming = (d.events || [])
          .filter((e) => {
            const sum = e.summary || "";
            if (/\b(domicile|dormir|sommeil|nuit|sleep|emails|admin|déjeuner|dejeuner|recompense|récompense)\b/i.test(sum)) return false;
            const iso = e.start?.dateTime || e.start?.date;
            if (!iso) return false;
            return new Date(e.start?.dateTime ? iso : iso + "T00:00:00") >= new Date(Date.now() - 60 * 60 * 1000);
          })
          .slice(0, 5);
        setEvents(upcoming);
        setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    };
    fetchEvents();
    const id = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Si pas connecte ou aucun event, on n'affiche pas le widget
  if (connected === false || (events !== null && events.length === 0)) return null;

  return (
    <div className="rounded-xl bg-surface border border-b-primary p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-accent-blue" />
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--text-secondary)]">
            Prochains evenements
          </p>
        </div>
        <Link
          href="/calendrier"
          className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-accent-blue transition-all"
        >
          Calendrier
          <ArrowRight size={11} />
        </Link>
      </div>

      {events === null ? (
        <div className="text-[12px] text-[var(--text-secondary)]">Chargement...</div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const iso = e.start?.dateTime || e.start?.date;
            if (!iso) return null;
            const start = new Date(e.start?.dateTime ? iso : iso + "T00:00:00");
            const isAllDay = !e.start?.dateTime;
            return (
              <Link
                key={e.id}
                href="/calendrier"
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-empty-bg hover:bg-[var(--surface-2)] transition-all group"
              >
                <div className="shrink-0 mt-0.5">
                  <Clock size={12} className="text-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                    {e.summary || "(sans titre)"}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {isAllDay ? "Toute la journee - " + start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : formatRelative(start)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
