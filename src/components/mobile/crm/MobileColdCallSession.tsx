"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Phone, PhoneOff, X, Calendar, SkipForward, ArrowLeft,
  CheckCircle2, Target, Trophy, Copy, ExternalLink, Clock, Ban, Edit3, FileText, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrmStore } from "@/store/useCrmStore";
import { useAppStore } from "@/store/useAppStore";
import type { Prospect, ResultatAppel } from "@/lib/crmTypes";
import { isToday, formatWebsiteUrl } from "@/lib/crmLogic";

type Outcome = {
  key: ResultatAppel;
  label: string;
  color: string;
  textColor: string;
  icon: React.ElementType;
};

const OUTCOMES: Outcome[] = [
  { key: "RDV",             label: "RDV",           color: "#10b981", textColor: "#10b981", icon: Calendar },
  { key: "REPONDEUR",       label: "Rép.",          color: "#f97316", textColor: "#f97316", icon: PhoneOff },
  { key: "MESSAGE_VOCAL_WHATSAPP", label: "WhatsApp", color: "#8b5cf6", textColor: "#8b5cf6", icon: MessageSquare },
  { key: "REFUS",           label: "Refus",         color: "#ef4444", textColor: "#ef4444", icon: X },
  { key: "EXISTE_PAS",      label: "Faux No",       color: "#64748b", textColor: "#94a3b8", icon: X },
  { key: "PAS_MA_CIBLE",    label: "Hors Cib",      color: "#eab308", textColor: "#eab308", icon: Ban },
];

function localDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function MobileColdCallSession() {
  const router = useRouter();
  const prospects = useCrmStore((s) => s.prospects);
  const calls     = useCrmStore((s) => s.calls);
  const logCall   = useCrmStore((s) => s.logCall);

  const [hideRepondeurs, setHideRepondeurs] = useState(false);
  const lastHideRef = useRef(hideRepondeurs);

  const queue = useMemo<Prospect[]>(() => {
    const now = Date.now();
    const lastCallByProspect = new Map<string, number>();
    for (const c of calls) {
      const ts = new Date(c.date).getTime();
      const prev = lastCallByProspect.get(c.prospect_id) ?? 0;
      if (ts > prev) lastCallByProspect.set(c.prospect_id, ts);
    }

    return prospects
      .filter((p) => {
        if (p.archived) return false;
        if (p.statut === "A_APPELER") return true;
        if (p.statut === "REPONDEUR") {
          if (hideRepondeurs) return false;
          if (p.date_relance) {
            const relance = new Date(p.date_relance + "T00:00:00").getTime();
            return now >= relance;
          }
          const lastTs = lastCallByProspect.get(p.id) ?? 0;
          if (lastTs === 0) return true;
          
          const lastD = new Date(lastTs);
          const today = new Date(now);
          const isSameDay = lastD.getFullYear() === today.getFullYear() &&
                            lastD.getMonth() === today.getMonth() &&
                            lastD.getDate() === today.getDate();
          return !isSameDay;
        }
        return false;
      })
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  }, [prospects, calls, hideRepondeurs]);

  const [sessionQueue, setSessionQueue] = useState<Prospect[]>([]);

  useEffect(() => {
    if (sessionQueue.length === 0 && queue.length > 0) {
      setSessionQueue(queue);
    }
  }, [queue, sessionQueue.length]);

  const [cursor, setCursor] = useState(0);
  const [submitting, setSubmitting] = useState<ResultatAppel | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [rappelMode, setRappelMode] = useState(false);
  const [rappelDate, setRappelDate] = useState(localDateOffset(3));
  const [rdvMode, setRdvMode] = useState(false);
  const [rdvConfirmedEmail, setRdvConfirmedEmail] = useState<string | null>(null);
  const [rdvDay, setRdvDay] = useState(localDateOffset(1));
  const [rdvHour, setRdvHour] = useState("10:00");
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [historyDraft, setHistoryDraft] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const currentId = sessionQueue[cursor]?.id;
  const current = useMemo(() => {
    if (!currentId) return null;
    return prospects.find(p => p.id === currentId) || sessionQueue[cursor];
  }, [currentId, prospects, sessionQueue, cursor]);

  const callsToday = useMemo(() => calls.filter((c) => isToday(c.date)), [calls]);
  const missionToday = callsToday.filter((c) => c.compte_mission).length;
  const rdvToday = callsToday.filter((c) => c.resultat === "RDV").length;

  useEffect(() => {
    setRappelMode(false);
    setRdvMode(false);
    setRdvConfirmedEmail(null);
    setRappelDate(localDateOffset(3));
    setRdvDay(localDateOffset(1));
    setRdvHour("10:00");
    setIsEditingHistory(false);
    setShowNotes(false);
  }, [cursor, currentId]);

  const next = () => { if (cursor + 1 < sessionQueue.length) setCursor((c) => c + 1); };
  const prev = () => { if (cursor > 0) setCursor((c) => c - 1); };

  useEffect(() => {
    if (hideRepondeurs !== lastHideRef.current) {
      setSessionQueue(queue);
      setCursor(0);
      lastHideRef.current = hideRepondeurs;
    }
  }, [hideRepondeurs, queue]);

  const handleLog = async (resultat: ResultatAppel, dateRappel?: string) => {
    if (!current || submitting) return;
    setSubmitting(resultat);
    await logCall(current.id, resultat, undefined, dateRappel);
    const outcome = OUTCOMES.find((o) => o.key === resultat);
    setFlash(outcome?.label || resultat);
    setTimeout(() => setFlash(null), 1500);
    setSubmitting(null);
    setRappelMode(false);
    setRdvMode(false);
  };

  const handleRdvSubmit = async () => {
    if (!current || submitting) return;
    setSubmitting("RDV");
    await logCall(current.id, "RDV");
    await useCrmStore.getState().updateProspect(current.id, { date_rdv: rdvDay });

    const { addTimelineEvent, projects, addTask } = useAppStore.getState();
    const agenceProject = projects.find(p => p.name.toLowerCase().includes("agence bizz"));
    const hourFloat = parseInt(rdvHour.split(":")[0]) + parseInt(rdvHour.split(":")[1]) / 60;
    
    let targetCalendarId = "primary";
    try {
      const res = await fetch("/api/google/calendar/calendars");
      if (res.ok) {
        const { calendars } = await res.json() as { calendars: any[] };
        const businessCal = calendars.find((c: any) => c.summary?.toLowerCase() === "business");
        if (businessCal) targetCalendarId = businessCal.id;
      }
    } catch (e) {}
    
    addTimelineEvent({
      label: `RDV : ${current.entreprise}`,
      day: rdvDay,
      hour: hourFloat,
      duration: 1,
      color: "blue",
      linkedProspectId: current.id,
      linkedProjectId: agenceProject?.id,
      googleCalendarId: targetCalendarId
    });

    const rdvDateObj = new Date(`${rdvDay}T${rdvHour}:00`);
    const taskDateObj = new Date(rdvDateObj.getTime() - 24 * 60 * 60 * 1000);
    const taskDay = taskDateObj.toISOString().slice(0, 10);
    
    addTask(
      `Créer la maquette pour ${current.entreprise}`, 
      "todo", 
      agenceProject?.id, 
      taskDay, 
      undefined, 
      current.id
    );

    try {
      const { syncCalendar, syncTasks } = await import("@/lib/googleSync");
      await syncCalendar();
      await syncTasks();
    } catch (e) {}

    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const jourStr = jours[rdvDateObj.getDay()];
    const dateStr = `${rdvDateObj.getDate()} ${mois[rdvDateObj.getMonth()]}`;
    const hStr = rdvHour;
    
    let prenom = "(Prénom)";
    if (current.entreprise) {
      prenom = current.entreprise.split(" ")[0];
      prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
    }

    const emailTemplate = `Objet : Confirmation RDV ${jourStr} ${dateStr} - Aaron de Triva-Media et ${prenom}

Bonjour ${prenom},

Je vous confirme notre rendez-vous ${jourStr} ${dateStr} à ${hStr}. Pensez à le bloquer dans votre agenda.

On fera ça en visio, je vous enverrai le lien un peu avant.

Au programme : je vous montre la maquette que j'ai préparée pour votre nouveau site. On la regarde ensemble et vous me dites ce que vous en pensez.

À ${jourStr}`;

    setRdvConfirmedEmail(emailTemplate);
    setFlash("RDV Booké !");
    setTimeout(() => setFlash(null), 2500);
    setSubmitting(null);
  };

  const copyTel = () => {
    if (!current?.telephone) return;
    navigator.clipboard.writeText(current.telephone);
    setFlash("Numéro copié");
    setTimeout(() => setFlash(null), 1200);
  };

  if (sessionQueue.length === 0) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-surface-0 px-6">
        <Trophy size={64} className="mb-6" style={{ color: "var(--accent-green)" }} />
        <h2 className="text-[22px] font-bold mb-2 text-center text-t-primary">Liste vidée</h2>
        <p className="text-[14px] text-t-tertiary mb-8 text-center leading-relaxed">
          Plus aucun prospect à appeler aujourd&apos;hui. Les répondeurs récents reviendront dans 24h.
        </p>
        <button
          onClick={() => router.push("/m/crm")}
          className="w-full max-w-[280px] py-3.5 rounded-2xl font-bold text-[15px] transition-all"
          style={{ background: "var(--accent-blue)", color: "var(--surface-0)" }}
        >
          Retour au CRM
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-surface-0 px-6">
        <CheckCircle2 size={64} className="mb-6" style={{ color: "var(--accent-green)" }} />
        <h2 className="text-[22px] font-bold mb-2 text-center text-t-primary">Session terminée</h2>
        <div className="flex items-center gap-4 mb-8">
          <div className="text-center p-3 rounded-xl bg-surface-1 border border-surface-2 min-w-[80px]">
            <p className="text-[24px] font-extrabold text-t-primary">{missionToday}</p>
            <p className="text-[11px] text-t-tertiary uppercase font-bold tracking-wider mt-1">Appels</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-surface-1 border border-surface-2 min-w-[80px]">
            <p className="text-[24px] font-extrabold" style={{ color: "var(--accent-green)" }}>{rdvToday}</p>
            <p className="text-[11px] text-t-tertiary uppercase font-bold tracking-wider mt-1">RDVs</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/m/crm")}
          className="w-full max-w-[280px] py-3.5 rounded-2xl font-bold text-[15px] transition-all"
          style={{ background: "var(--accent-blue)", color: "var(--surface-0)" }}
        >
          Retour au CRM
        </button>
      </div>
    );
  }

  const tel = current.telephone?.trim();
  const telHref = tel ? `tel:${tel.replace(/\s/g, "")}` : undefined;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-surface-0 relative pb-[90px]">
      {/* Header Mobile */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-surface-2 bg-surface-0/95 backdrop-blur z-20 sticky top-0">
        <button
          onClick={() => router.push("/m/crm")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-1 hover:bg-surface-2 text-t-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-surface-2 text-[12px] font-bold">
            <Target size={14} style={{ color: "var(--accent-blue)" }} />
            {missionToday}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-surface-2 text-[12px] font-bold">
            <Calendar size={14} style={{ color: "var(--accent-green)" }} />
            {rdvToday}
          </div>
        </div>
      </div>

      {/* Flash Mobile */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-4 right-4 z-50 text-center py-3 rounded-2xl text-[14px] font-bold shadow-2xl backdrop-blur"
            style={{ background: "rgba(16, 185, 129, 0.9)", color: "#fff" }}
          >
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-4 pt-4 pb-6 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-4"
          >
            {/* Main Info Card */}
            <div className="rounded-[24px] p-6 bg-surface-1 border border-surface-2 relative shadow-sm text-center mt-2">
              <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-t-tertiary">
                  Prospect {cursor + 1} / {sessionQueue.length}
                </span>
              </div>
              <div className="mt-5 mb-4">
                <h1 className="text-[32px] font-black leading-tight tracking-tight text-t-primary break-words">
                  {current.entreprise}
                </h1>
                {current.niche && (
                  <p className="inline-block text-[13px] font-bold px-3 py-1 mt-3 rounded-full bg-surface-2 text-t-secondary border border-surface-3">
                    {current.niche}
                  </p>
                )}
              </div>

              {tel && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <a
                    href={telHref}
                    className="flex-1 max-w-[240px] flex items-center justify-center gap-3 py-4 rounded-[20px] font-black text-[22px] shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                    style={{ background: "var(--accent-blue)", color: "#fff" }}
                  >
                    <Phone size={22} fill="currentColor" />
                    {tel}
                  </a>
                  <button
                    onClick={copyTel}
                    className="w-[58px] h-[58px] flex items-center justify-center rounded-[20px] bg-surface-2 text-t-secondary active:scale-[0.95] transition-all"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions (Links) */}
            <div className="flex gap-3">
              {current.gmb_url && (
                <a href={current.gmb_url} target="_blank" rel="noreferrer"
                   className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-1 border border-surface-2 text-t-secondary text-[12px] font-bold active:scale-95 transition-all">
                  <ExternalLink size={16} /> Google Maps
                </a>
              )}
              {current.site_url && (
                <a href={formatWebsiteUrl(current.site_url)} target="_blank" rel="noreferrer"
                   className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-1 border border-surface-2 text-t-secondary text-[12px] font-bold active:scale-95 transition-all">
                  <ExternalLink size={16} /> Site web
                </a>
              )}
            </div>

            {/* Notes Toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex justify-between items-center w-full px-5 py-4 bg-surface-1 border border-surface-2 rounded-2xl text-[14px] font-bold text-t-primary"
            >
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-t-tertiary" />
                Notes & Historique
              </div>
              <span className="text-[12px] text-t-tertiary">{showNotes ? "Masquer" : "Afficher"}</span>
            </button>

            {showNotes && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col gap-3">
                <div className="bg-surface-1 p-4 rounded-2xl border border-surface-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[11px] font-bold text-t-tertiary uppercase tracking-wider">Historique</p>
                    <button onClick={() => { setIsEditingHistory(!isEditingHistory); setHistoryDraft(current.feedback || ""); }} className="p-1 text-t-tertiary hover:text-t-primary">
                      <Edit3 size={14} />
                    </button>
                  </div>
                  {isEditingHistory ? (
                    <div className="flex flex-col gap-2">
                      <textarea 
                        value={historyDraft} 
                        onChange={e => setHistoryDraft(e.target.value)} 
                        className="w-full bg-surface-0 border border-surface-3 rounded-xl px-3 py-2 text-[13px] min-h-[80px]"
                        placeholder="Historique..."
                      />
                      <button onClick={async () => {
                        if (current) await useCrmStore.getState().updateProspect(current.id, { feedback: historyDraft || null });
                        setIsEditingHistory(false);
                      }} className="w-full py-2 bg-t-primary text-surface-0 rounded-xl text-[12px] font-bold">Sauvegarder</button>
                    </div>
                  ) : (
                    <div className="text-[13px] text-t-secondary whitespace-pre-wrap">{current.feedback || <span className="italic text-t-tertiary">Aucun historique</span>}</div>
                  )}
                </div>
                <div className="bg-surface-1 p-4 rounded-2xl border border-surface-2">
                  <p className="text-[11px] font-bold text-t-tertiary uppercase tracking-wider mb-2">Notes</p>
                  <textarea
                    defaultValue={current.notes || ""}
                    onBlur={async (e) => {
                      if (current && e.target.value !== current.notes) {
                        await useCrmStore.getState().updateProspect(current.id, { notes: e.target.value });
                      }
                    }}
                    placeholder="Notes rapides..."
                    className="w-full bg-surface-0 border border-surface-3 rounded-xl px-3 py-2 text-[13px] min-h-[80px]"
                 </div>
              </motion.div>
            )}

            {/* Sub-modes for Log (RDV) inline */}
            {rdvMode && !rdvConfirmedEmail && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-surface-1 border-2 border-[var(--accent-green)]/40 mt-2">
                <p className="text-[14px] font-bold mb-3 text-t-primary">Planifier RDV</p>
                <div className="flex gap-2 mb-3">
                  <input type="date" value={rdvDay} onChange={e => setRdvDay(e.target.value)} className="flex-1 bg-surface-0 border border-surface-3 rounded-xl px-3 py-2.5 text-[14px]" />
                  <input type="time" value={rdvHour} onChange={e => setRdvHour(e.target.value)} className="w-24 bg-surface-0 border border-surface-3 rounded-xl px-3 py-2.5 text-[14px]" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setRdvMode(false)} className="px-4 py-2.5 rounded-xl bg-surface-2 text-t-primary font-bold text-[13px]">Annuler</button>
                  <button onClick={handleRdvSubmit} disabled={!!submitting} className="flex-1 py-2.5 rounded-xl text-[#fff] font-bold text-[14px]" style={{ background: "var(--accent-green)" }}>{submitting ? "..." : "Confirmer"}</button>
                </div>
              </motion.div>
            )}

            {rdvMode && rdvConfirmedEmail && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-surface-1 border-2 border-[var(--accent-green)] mt-2">
                <p className="text-[14px] font-bold mb-3 text-t-primary">✅ RDV Booké ! Email auto :</p>
                <textarea readOnly value={rdvConfirmedEmail} className="w-full h-32 bg-surface-0 border border-surface-3 rounded-xl px-3 py-2 text-[11px] font-mono mb-3 text-t-secondary" />
                <button onClick={() => { setRdvMode(false); next(); }} className="w-full py-3 rounded-xl text-[#fff] font-bold text-[14px]" style={{ background: "var(--accent-green)" }}>Fermer & Suivant</button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Bottom Navigation / Action Grid */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-0/90 backdrop-blur-xl border-t border-surface-2 px-3 py-3 z-30 pb-safe-bottom">
        <div className="max-w-[500px] mx-auto flex gap-2">
          {/* Skip Button */}
          <button
            onClick={next}
            disabled={cursor + 1 >= sessionQueue.length}
            className="w-16 shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-surface-1 border border-surface-2 text-t-tertiary disabled:opacity-30 active:scale-95 transition-all"
          >
            <SkipForward size={22} />
            <span className="text-[10px] font-bold">Skip</span>
          </button>

          {/* Outcomes Scrollable Row */}
          <div className="flex-1 flex gap-2 overflow-x-auto snap-x hide-scrollbar">
            {OUTCOMES.map(o => {
              const isRdv = o.key === "RDV";
              const Icon = o.icon;
              return (
                <button
                  key={o.key}
                  onClick={isRdv ? () => setRdvMode(true) : () => handleLog(o.key)}
                  className="snap-start shrink-0 min-w-[72px] flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl active:scale-95 transition-all border border-surface-3"
                  style={{ background: `${o.color}15`, color: o.textColor }}
                >
                  <Icon size={24} />
                  <span className="text-[10px] font-extrabold">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>    </div>
      </div>

      {/* CSS for hiding scrollbar globally or just locally */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe-bottom { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
      `}} />
    </div>
  );
}
