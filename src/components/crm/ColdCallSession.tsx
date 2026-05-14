"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phone, PhoneOff, X, Calendar, SkipForward, ArrowLeft,
  CheckCircle2, Target, Trophy, Copy, ExternalLink, Ban, FileText, ChevronDown, ChevronUp,
  Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrmStore } from "@/store/useCrmStore";
import type { Prospect, ResultatAppel } from "@/lib/crmTypes";
import { isToday } from "@/lib/crmLogic";

type Outcome = {
  key: ResultatAppel;
  label: string;
  shortcut: string;
  color: string;
  textColor: string;
  icon: React.ElementType;
  desc: string;
};

const OUTCOMES: Outcome[] = [
  { key: "RDV",             label: "RDV Booké",          shortcut: "1", color: "#10b981", textColor: "#10b981", icon: Calendar, desc: "Il a dit oui. GG."           },
  { key: "REPONDEUR",       label: "Répondeur",           shortcut: "2", color: "#f97316", textColor: "#f97316", icon: PhoneOff, desc: "Pas répondu, à relancer"     },
  { key: "RAPPEL_PLUS_TARD",label: "Rappeler plus tard",  shortcut: "3", color: "#8b5cf6", textColor: "#8b5cf6", icon: Clock,    desc: "Fixer une date de rappel"    },
  { key: "REFUS",           label: "Refus",               shortcut: "4", color: "#ef4444", textColor: "#ef4444", icon: X,        desc: "Pas intéressé. Next."        },
  { key: "EXISTE_PAS",      label: "N'existe pas",        shortcut: "5", color: "#64748b", textColor: "#94a3b8", icon: X,        desc: "Numéro mort / faux"          },
  { key: "PAS_MA_CIBLE",    label: "Pas ma cible",        shortcut: "6", color: "#eab308", textColor: "#eab308", icon: Ban,      desc: "Erreur de sourcing"          },
];

/** Date ISO locale (YYYY-MM-DD) pour un offset de jours */
function localDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ColdCallSession({ onExit }: { onExit: () => void }) {
  const prospects = useCrmStore((s) => s.prospects);
  const calls     = useCrmStore((s) => s.calls);
  const logCall   = useCrmStore((s) => s.logCall);

  /* ── Queue : A_APPELER + REPONDEUR dont le dernier appel date de >24h
     ET dont la date_relance (si présente) est aujourd'hui ou passée ── */
  const queue = useMemo<Prospect[]>(() => {
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;

    // Index : dernière date d'appel par prospect
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
          // Si une date_relance est fixée, n'afficher qu'à partir de cette date
          if (p.date_relance) {
            const relance = new Date(p.date_relance + "T00:00:00").getTime();
            return now >= relance;
          }
          // Sinon, attendre au moins 24h depuis le dernier appel
          const lastTs = lastCallByProspect.get(p.id) ?? 0;
          return now - lastTs > H24;
        }
        return false;
      })
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  }, [prospects, calls]);

  const [sessionQueue, setSessionQueue] = useState<Prospect[]>([]);

  // Initialisation de la queue stable au montage (ou quand la queue calculée change mais qu'on n'en a pas encore)
  useEffect(() => {
    if (sessionQueue.length === 0 && queue.length > 0) {
      setSessionQueue(queue);
    }
  }, [queue, sessionQueue.length]);

  const [cursor, setCursor]       = useState(0);
  const [submitting, setSubmitting] = useState<ResultatAppel | null>(null);
  const [flash, setFlash]         = useState<string | null>(null);

  const [rappelMode, setRappelMode] = useState(false);
  const [rappelDate, setRappelDate] = useState(localDateOffset(3));
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [historyDraft, setHistoryDraft] = useState("");
  const [prioritizeRepondeur, setPrioritizeRepondeur] = useState(false);

  // On récupère le prospect actuel depuis le store via son ID pour avoir les données fraîches,
  // tout en gardant l'ordre de la sessionQueue stable.
  const currentId = sessionQueue[cursor]?.id;
  const current   = useMemo(() => {
    if (!currentId) return null;
    return prospects.find(p => p.id === currentId) || sessionQueue[cursor];
  }, [currentId, prospects, sessionQueue, cursor]);

  const config  = useCrmStore((s) => s.config);

  // Stats session du jour
  const callsToday  = useMemo(() => calls.filter((c) => isToday(c.date)), [calls]);
  const missionToday = callsToday.filter((c) => c.compte_mission).length;
  const rdvToday     = callsToday.filter((c) => c.resultat === "RDV").length;

  // Reset quand on change de prospect (via le curseur)
  useEffect(() => {
    setRappelMode(false);
    setRappelDate(localDateOffset(3));
    setIsEditingHistory(false);
  }, [cursor, currentId]);

  const next = () => { if (cursor + 1 < sessionQueue.length) setCursor((c) => c + 1); };
  const prev = () => { if (cursor > 0) setCursor((c) => c - 1); };

  const handleTogglePrioritize = () => {
    setPrioritizeRepondeur(prevVal => {
      const nextVal = !prevVal;
      setSessionQueue(currentQueue => {
        const newQueue = [...currentQueue];
        newQueue.sort((a, b) => {
          if (nextVal) {
            if (a.statut === "REPONDEUR" && b.statut !== "REPONDEUR") return -1;
            if (b.statut === "REPONDEUR" && a.statut !== "REPONDEUR") return 1;
          }
          return a.created_at < b.created_at ? -1 : 1;
        });
        return newQueue;
      });
      setCursor(0); // Reset cursor to show the first prioritized item immediately
      return nextVal;
    });
  };

  const handleLog = async (resultat: ResultatAppel, dateRappel?: string) => {
    if (!current || submitting) return;
    setSubmitting(resultat);
    await logCall(current.id, resultat, undefined, dateRappel);
    const outcome = OUTCOMES.find((o) => o.key === resultat);
    setFlash(outcome?.label || resultat);
    setTimeout(() => setFlash(null), 1500);
    setSubmitting(null);
    setRappelMode(false);
  };

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "Escape")                        { if (rappelMode) { setRappelMode(false); } else { onExit(); } return; }
      if (e.key === "ArrowRight" || e.key === "ArrowDown")  { next(); return; }
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")    { prev(); return; }
      const outcome = OUTCOMES.find((o) => o.shortcut === e.key);
      if (outcome) {
        e.preventDefault();
        if (outcome.key === "RAPPEL_PLUS_TARD") {
          setRappelMode(true);
        } else {
          handleLog(outcome.key);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, cursor, sessionQueue.length, rappelMode]);

  const copyTel = () => {
    if (!current?.telephone) return;
    navigator.clipboard.writeText(current.telephone);
    setFlash("Numéro copié");
    setTimeout(() => setFlash(null), 1200);
  };

  /* ── Écran liste vide ── */
  if (sessionQueue.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-0 p-8">
        <div className="max-w-md w-full text-center">
          <Trophy size={64} className="mx-auto mb-6" style={{ color: "var(--accent-green)" }} />
          <h2 className="text-2xl font-bold mb-2">Liste vidée</h2>
          <p className="text-[13.5px] text-t-tertiary mb-6">
            Plus aucun prospect à appeler aujourd&apos;hui. Les répondeurs récents reviendront dans +24h.
          </p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all"
            style={{ background: "var(--accent-cyan)", color: "var(--surface-0)" }}
          >
            Retour au CRM
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-0 p-8">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 size={64} className="mx-auto mb-6" style={{ color: "var(--accent-green)" }} />
          <h2 className="text-2xl font-bold mb-2">Session terminée</h2>
          <p className="text-[13.5px] text-t-tertiary mb-1">
            {missionToday} appel(s) comptabilisé(s) aujourd&apos;hui.
          </p>
          <p className="text-[13.5px] font-semibold mb-6" style={{ color: "var(--accent-green)" }}>
            {rdvToday} RDV décroché(s).
          </p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all"
            style={{ background: "var(--accent-cyan)", color: "var(--surface-0)" }}
          >
            Retour au CRM
          </button>
        </div>
      </div>
    );
  }

  const tel    = current.telephone?.trim();
  const telHref = tel ? `tel:${tel.replace(/\s/g, "")}` : undefined;

  return (
    <div className="h-full overflow-auto bg-surface-0">
      {/* Top bar sticky */}
      <div className="sticky top-0 z-20 border-b border-surface-3 bg-surface-0/95 backdrop-blur">
        <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] text-t-tertiary hover:text-t-primary hover:bg-surface-2"
          >
            <ArrowLeft size={14} /> Quitter
          </button>

          <div className="flex items-center gap-4 text-[12px]">
            <label className="flex items-center gap-2 cursor-pointer text-t-tertiary hover:text-t-primary transition-colors border-r border-surface-3 pr-4">
              <input
                type="checkbox"
                checked={prioritizeRepondeur}
                onChange={handleTogglePrioritize}
                className="rounded border-surface-3 text-[var(--accent-cyan)] focus:ring-[var(--accent-cyan)]"
              />
              Prioriser répondeurs
            </label>
            <span className="inline-flex items-center gap-1.5 text-t-tertiary">
              <Target size={13} style={{ color: "var(--accent-cyan)" }} />
              <span className="tabular-nums font-semibold text-t-primary">{missionToday}</span>
              <span>appels</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-t-tertiary">
              <Calendar size={13} style={{ color: "var(--accent-green)" }} />
              <span className="tabular-nums font-semibold" style={{ color: "var(--accent-green)" }}>{rdvToday}</span>
              <span>RDV</span>
            </span>
          </div>
        </div>
      </div>

      {/* Flash notification */}
      <AnimatePresence>
        {flash && (
            <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg text-[12.5px] font-semibold shadow-lg"
            style={{ background: "var(--accent-green)", color: "var(--surface-0)" }}
          >
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[900px] mx-auto px-6 py-6 h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl mx-auto flex flex-col gap-6"
          >
            {/* Card prospect centrale (Focus Mode) */}
            <div className="hero-card p-10 text-center relative">
              <div className="flex flex-col items-center mb-8">
                <p className="text-[12px] uppercase tracking-widest text-t-tertiary font-bold mb-3 flex items-center justify-center gap-2">
                  Prospect {cursor + 1} / {sessionQueue.length}
                    {current.statut === "REPONDEUR" && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-dopa-orange/15 text-dopa-orange text-[10px]">
                        Rappel répondeur
                      </span>
                    )}
                    {current.date_relance && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-dopa-violet/15 text-dopa-violet text-[10px]">
                        📅 Rappel prévu {new Date(current.date_relance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    )}
                </p>
                
                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight break-words mb-2 text-t-primary">
                  {current.entreprise}
                </h1>
                
                {current.niche && (
                  <p className="text-[14px] font-medium text-t-tertiary mt-2 px-3 py-1 rounded-full bg-surface-2 border border-surface-3">
                    {current.niche}
                  </p>
                )}
              </div>

              <div className="absolute top-6 right-6 flex gap-2">
                <button
                  onClick={prev}
                  disabled={cursor === 0}
                  className="w-10 h-10 rounded-xl glass-card hover:bg-surface-2 text-t-tertiary disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center transition-all hover:text-t-primary"
                  title="Précédent"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={next}
                  className="w-10 h-10 rounded-xl glass-card hover:bg-surface-2 text-t-tertiary inline-flex items-center justify-center transition-all hover:text-t-primary"
                  title="Skip (sans logger)"
                >
                  <SkipForward size={16} />
                </button>
              </div>

              {/* Téléphone (Enorme) */}
              {tel && (
                <div className="flex items-center justify-center gap-3 mb-8">
                  <a
                    href={telHref}
                    className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-[28px] tabular-nums transition-all hover:scale-[1.02] active:scale-[0.98] glow-cyan"
                    style={{ background: "var(--accent-cyan)", color: "var(--surface-0)" }}
                  >
                    <Phone size={24} />
                    {tel}
                  </a>
                  <button
                    onClick={copyTel}
                    className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-t-tertiary hover:text-t-primary transition-all"
                    title="Copier"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              )}

              {/* Liens contexte */}
              <div className="flex flex-wrap justify-center gap-3 text-[13px] font-medium">
                {current.gmb_url && (
                  <a href={current.gmb_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-card hover:border-dopa-cyan/40 text-t-secondary hover:text-dopa-cyan transition-colors">
                    <ExternalLink size={13} /> Google Maps
                  </a>
                )}
                {current.site_url && (
                  <a href={current.site_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-card hover:border-dopa-cyan/40 text-t-secondary hover:text-dopa-cyan transition-colors">
                    <ExternalLink size={13} /> Site web
                  </a>
                )}
              </div>
            </div>



            {/* Historique et Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="glass-card p-5 rounded-2xl flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-t-tertiary font-bold block">Historique</span>
                  {!isEditingHistory && (
                    <button onClick={() => { setIsEditingHistory(true); setHistoryDraft(current?.feedback || ""); }} className="text-t-tertiary hover:text-t-primary p-1">
                      <Edit3 size={12} />
                    </button>
                  )}
                </div>
                {isEditingHistory ? (
                  <div className="flex flex-col gap-2 h-full">
                    <textarea 
                      value={historyDraft} 
                      onChange={e => setHistoryDraft(e.target.value)} 
                      className="flex-1 bg-surface-0 border border-surface-3 rounded-lg px-3 py-2 text-[12px] resize-none focus:outline-none focus:border-dopa-cyan/50 min-h-[80px]"
                      placeholder="Modifier l'historique ici..."
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEditingHistory(false)} className="text-[11px] px-3 py-1.5 bg-surface-3 hover:bg-surface-3/80 rounded-lg transition-colors font-medium">Annuler</button>
                      <button 
                        onClick={async () => { 
                          if (current) {
                            await useCrmStore.getState().updateProspect(current.id, { feedback: historyDraft || null }); 
                          }
                          setIsEditingHistory(false); 
                        }} 
                        className="text-[11px] px-3 py-1.5 bg-[var(--accent-cyan)] text-[var(--surface-0)] font-bold rounded-lg hover:brightness-110 transition-colors"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  current?.feedback ? (
                    <div className="text-[13px] text-t-secondary whitespace-pre-wrap flex-1 overflow-auto max-h-32">
                      {current.feedback}
                    </div>
                  ) : (
                    <div className="text-[12px] text-t-tertiary italic flex-1">Aucun historique.</div>
                  )
                )}
              </div>

              <div className="glass-card p-5 rounded-2xl flex flex-col h-full">
                <label className="text-[11px] uppercase tracking-wider text-t-tertiary font-bold block mb-3">
                  Notes du prospect <span className="normal-case font-medium">(sauvegarde auto)</span>
                </label>
                <textarea
                  key={`note-${current.id}`}
                  defaultValue={current.notes || ""}
                  onBlur={async (e) => {
                    if (current && e.target.value !== current.notes) {
                      await useCrmStore.getState().updateProspect(current.id, { notes: e.target.value });
                    }
                  }}
                  placeholder="Informations sur le prospect..."
                  className="flex-1 bg-surface-0 border border-surface-3 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-dopa-violet min-h-[80px]"
                />
              </div>
            </div>
            {/* Outcomes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {OUTCOMES.map((o) => {
                const Icon     = o.icon;
                const isLoading = submitting === o.key;
                const isRappel  = o.key === "RAPPEL_PLUS_TARD";

                /* Bouton "Rappeler plus tard" → mode date picker si actif */
                if (isRappel && rappelMode) {
                  return (
                    <motion.div
                      key={o.key}
                      initial={{ scale: 0.97 }}
                      animate={{ scale: 1 }}
                      className="col-span-2 md:col-span-1 px-4 py-4 rounded-xl border-2 text-left"
                      style={{ background: `${o.color}18`, borderColor: `${o.color}88` }}
                    >
                      <p className="text-[12px] font-semibold mb-2" style={{ color: o.textColor }}>
                        📅 Rappeler le :
                      </p>
                      <input
                        type="date"
                        value={rappelDate}
                        min={localDateOffset(1)}
                        onChange={(e) => setRappelDate(e.target.value)}
                        className="w-full bg-surface-0 border border-surface-3 rounded-lg px-3 py-2 text-[13px] mb-3 focus:outline-none focus:border-dopa-violet"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLog("RAPPEL_PLUS_TARD", rappelDate)}
                          disabled={!!submitting || !rappelDate}
                          className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold disabled:opacity-50 transition-colors"
                          style={{ background: o.color, color: "#fff" }}
                        >
                          {isLoading ? "..." : "Confirmer"}
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <button
                    key={o.key}
                    onClick={isRappel ? () => setRappelMode(true) : () => handleLog(o.key)}
                    disabled={!!submitting}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl glass-card-3d hover:brightness-110 active:scale-[0.97] transition-all group relative overflow-hidden"
                    style={{ background: `${o.color}10`, borderColor: `${o.color}40` }}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/10 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <Icon size={24} className="mb-3 transition-transform group-hover:scale-110" style={{ color: o.textColor }} />
                    <span className="text-[14px] font-extrabold text-t-primary">{o.label}</span>
                    <span className="text-[11px] text-t-tertiary mt-1 font-medium text-center">{o.desc}</span>
                    <span className="absolute top-2 right-3 text-[10px] font-bold opacity-30 group-hover:opacity-60">{o.shortcut}</span>
                  </button>
                );
              })}
            </div>
            
            <p className="text-[11px] text-t-tertiary text-center mt-6">
              Raccourcis : <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">1</kbd>–<kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">6</kbd> pour logger · <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">→</kbd> skip · <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">Esc</kbd> quitter
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
  </div>
);
}
