"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2 } from "lucide-react";

export default function CalendrierPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/google/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { email: string | null }) => setEmail(d.email))
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
          style={{ background: "var(--accent-blue-light)" }}>
          <Calendar size={26} className="text-accent-blue" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connecte ton Google Agenda</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Va dans Reglages pour connecter ton compte.
          </p>
        </div>
        <a href="/reglages" className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90">
          Aller aux reglages
        </a>
      </div>
    );
  }

  const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris");
  const src = encodeURIComponent(email);
  // Embed Google Calendar avec le maximum de fonctionnalites visibles
  const embedUrl =
    "https://calendar.google.com/calendar/embed?src=" + src +
    "&ctz=" + tz +
    "&mode=WEEK" +
    "&showTitle=0&showPrint=0&showCalendars=1&showTabs=1&showTz=0&hl=fr&wkst=2";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-primary flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <Calendar size={18} className="text-accent-blue" /> Agenda
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{email}</p>
        </div>
        <a
          href="https://calendar.google.com/calendar/u/0/r"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-[12.5px] font-semibold hover:opacity-90 transition-all"
        >
          <ExternalLink size={13} />
          Ouvrir Google Agenda
        </a>
      </div>

      <div className="flex-1 min-h-0 p-3">
        <div className="w-full h-full rounded-2xl overflow-hidden border border-b-primary bg-white">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            style={{ border: 0 }}
            title="Google Agenda"
          />
        </div>
      </div>
    </div>
  );
}
