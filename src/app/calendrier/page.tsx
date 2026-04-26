"use client";

import { useEffect, useState } from "react";
import { Calendar, AlertCircle, Loader2, ExternalLink } from "lucide-react";

type ViewMode = "WEEK" | "MONTH" | "AGENDA";

export default function CalendrierPage() {
  const [email, setEmail]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<ViewMode>("WEEK");

  useEffect(() => {
    fetch("/api/google/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { connected: boolean; email: string | null }) => {
        setEmail(d.email);
      })
      .catch(() => setEmail(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-blue)12" }}>
          <Calendar size={26} className="text-accent-blue" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connecte ton Google Calendar</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Va dans Réglages pour connecter ton compte Google.
          </p>
        </div>
        <a
          href="/reglages"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-all"
        >
          Aller aux réglages
        </a>
      </div>
    );
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
  const src = encodeURIComponent(email);
  const embedUrl = `https://calendar.google.com/calendar/embed?src=${src}&ctz=${encodeURIComponent(tz)}&mode=${view}&showTitle=0&showPrint=0&showCalendars=0&showTabs=1&showTz=0&hl=fr&wkst=2`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-primary flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <Calendar size={18} className="text-accent-blue" /> Calendrier
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{email}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-empty-bg border border-b-primary">
            {(["WEEK", "MONTH", "AGENDA"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  view === v
                    ? "bg-accent-blue text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {v === "WEEK" ? "Semaine" : v === "MONTH" ? "Mois" : "Agenda"}
              </button>
            ))}
          </div>

          <a
            href={`https://calendar.google.com/calendar/u/0/r`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-empty-bg border border-b-primary text-[12px] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
          >
            <ExternalLink size={12} />
            Ouvrir
          </a>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3">
        <div className="w-full h-full rounded-2xl overflow-hidden border border-b-primary bg-white">
          <iframe
            key={view}
            src={embedUrl}
            className="w-full h-full"
            style={{ border: 0 }}
            frameBorder={0}
            scrolling="no"
            title="Google Calendar"
          />
        </div>
      </div>

      <div className="shrink-0 px-7 py-2 border-t border-b-primary flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
        <AlertCircle size={11} className="shrink-0 mt-0.5" />
        <span>
          Pour créer/modifier des events directement dans la vue, tu dois être connecté à Google dans ton navigateur avec le compte <strong>{email}</strong>. Sinon clique &quot;Ouvrir&quot; pour la vue complète.
        </span>
      </div>
    </div>
  );
}
