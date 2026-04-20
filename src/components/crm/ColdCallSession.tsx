"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phone, PhoneOff, X, Calendar, SkipForward, ArrowLeft,
  CheckCircle2, Target, Flame, Trophy, Copy, ExternalLink,
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
  { key: "RDV",          label: "RDV Booké",     shortcut: "1", color: "#10b981", textColor: "#10b981", icon: Calendar,      desc: "Il a dit oui. GG." },
  { key: "DECROCHE",     label: "Décroché",      shortcut: "2", color: "#3b82f6", textColor: "#3b82f6", icon: Phone,         desc: "A parlé mais pas de RDV" },
  { key: "REPONDEUR",    label: "Répondeur",     shortcut: "3", color: "#f97316", textColor: "#f97316", icon: PhoneOff,      desc: "Rappel plus tard" },
  { key: "PAS_JOIGNABLE",label: "Pas joignable", shortcut: "4", color: "#eab308", textColor: "#eab308", icon: PhoneOff,      desc: "Sonné dans le vide" },
  { key: "REFUS",        label: "Refus",         shortcut: "5", color: "#ef4444", textColor: "#ef4444", icon: X,             desc: "Pas intéressé. Next." },
  { key: "EXISTE_PAS",   label: "N'existe pas",  shortcut: "6", color: "#64748b", textColor: "#94a3b8", icon: X,             desc: "Numéro mort / faux" },
];

export default function ColdCallSession({ onExit }: { onExit: () => void }) {
  const prospects = useCrmStore((s) => s.prospects);
  const calls = useCrmStore((s) => s.calls);
  const logCall = useCrmStore((s) => s.logCall);

  // File d'attente : A_APPELER + REPONDEUR actifs, plus anciens d'abord (logique cold-call = épuiser la liste)
  const queue = useMemo<Prospect[]>(() => {
    return prospects
      .filter((p) => !p.archived && (p.statut === "A_APPELER" || p.statut === "REPONDEUR"))
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  }, [prospects]);

  // Index prospect courant (filtré sur la queue)
  const [cursor, setCursor] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const [submitting, setSubmitting] = useState<ResultatAppel | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const current = queue[cursor];

  // Stats session du jour
  const callsToday = useMemo(() => calls.filter((c) => isToday(c.date)), [calls]);
  const missionToday = callsToday.filter((c) => c.compte_mission).length;
  const rdvToday = callsToday.filter((c) => c.resultat === "RDV").length;

  // Reset notes quand on change de prospect
  useEffect(() => {
    setNoteDraft("");
  }, [current?.id]);

  const next = () => {
    if (cursor + 1 < queue.length) setCursor((c) => c + 1);
  };
  const prev = () => {
    if (cursor > 0) setCursor((c) => c - 1);
  };

  const handleLog = async (resultat: ResultatAppel) => {
    if (!current || submitting) return;
    setSubmitting(resultat);
    await logCall(current.id, resultat, noteDraft.trim() || undefined);
    const outcome = OUTCOMES.find((o) => o.key === resultat);
    setFlash(outcome?.label || resultat);
    setTimeout(() => setFlash(null), 1500);
    setSubmitting(null);
    // auto-advance vers le suivant. Le prospect courant va disparaître de la queue
    // après logCall (statut changé), donc cursor pointera naturellement sur le suivant.
    // On garde cursor tel quel — le useMemo va refiltrer la queue.
  };

  // Raccourcis clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") { onExit(); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { next(); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { prev(); return; }
      const outcome = OUTCOMES.find((o) => o.shortcut === e.key);
      if (outcome) {
        e.preventDefault();
        handleLog(outcome.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, cursor, queue.length, noteDraft]);

  const copyTel = () => {
    if (!current?.telephone) return;
    navigator.clipboard.writeText(current.telephone);
    setFlash("Numéro copié");
    setTimeout(() => setFlash(null), 1200);
  };

  // Si queue épuisée → écran de victoire
  if (queue.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-0 p-8">
        <div className="max-w-md w-full text-center">
          <Trophy size={64} className="mx-auto mb-6 text-dopa-green" />
          <h2 className="text-2xl font-bold mb-2">Liste vidée</h2>
          <p className="text-[13.5px] text-t-tertiary mb-6">
            Plus aucun prospect à appeler ou à relancer. Importe un nouveau CSV ou reviens demain.
          </p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-dopa-cyan text-black font-semibold text-[13px] hover:bg-dopa-cyan/90"
          >
            Retour au CRM
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    // Fin de session (cursor hors queue)
    return (
      <div className="h-full flex items-center justify-center bg-surface-0 p-8">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 size={64} className="mx-auto mb-6 text-dopa-green" />
          <h2 className="text-2xl font-bold mb-2">Session terminée</h2>
          <p className="text-[13.5px] text-t-tertiary mb-1">
            {missionToday} appel(s) comptabilisé(s) aujourd&apos;hui.
          </p>
          <p className="text-[13.5px] text-dopa-green font-semibold mb-6">
            {rdvToday} RDV décroché(s).
          </p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-dopa-cyan text-black font-semibold text-[13px] hover:bg-dopa-cyan/90"
          >
            Retour au CRM
          </button>
        </div>
      </div>
    );
  }

  const tel = current.telephone?.trim();
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
            <span className="inline-flex items-center gap-1.5 text-t-tertiary">
              <Target size={13} className="text-dopa-cyan" />
              <span className="tabular-nums font-semibold text-t-primary">{missionToday}</span>
              <span>appels</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-t-tertiary">
              <Calendar size={13} className="text-dopa-green" />
              <span className="tabular-nums font-semibold text-dopa-green">{rdvToday}</span>
              <span>RDV</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-t-tertiary">
              <Flame size={13} className="text-dopa-orange" />
              <span className="tabular-nums font-semibold text-t-primary">{cursor + 1}</span>
              <span>/ {queue.length}</span>
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-dopa-green text-black text-[12.5px] font-semibold shadow-lg"
          >
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[900px] mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* Card prospect */}
            <div className="rounded-2xl border border-surface-3 bg-surface-1 p-7 mb-5">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-t-tertiary font-semibold mb-1">
                    Prospect {cursor + 1} / {queue.length}
                    {current.statut === "REPONDEUR" && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-dopa-orange/15 text-dopa-orange text-[10px]">
                        Rappel répondeur
                      </span>
                    )}
                  </p>
                  <h1 className="text-[28px] font-bold leading-tight tracking-tight break-words">
                    {current.entreprise}
                  </h1>
                  {current.niche && (
                    <p className="text-[12px] text-t-tertiary mt-1">{current.niche}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={prev}
                    disabled={cursor === 0}
                    className="w-9 h-9 rounded-lg border border-surface-3 hover:bg-surface-2 text-t-tertiary disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center"
                    title="Précédent"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    onClick={next}
                    className="w-9 h-9 rounded-lg border border-surface-3 hover:bg-surface-2 text-t-tertiary inline-flex items-center justify-center"
                    title="Skip (sans logger)"
                  >
                    <SkipForward size={14} />
                  </button>
                </div>
              </div>

              {/* Téléphone géant */}
              {tel ? (
                <div className="flex items-center gap-3 mb-4">
                  <a
                    href={telHref}
                    className="flex-1 inline-flex items-center gap-3 px-5 py-4 rounded-xl bg-dopa-cyan text-black font-bold text-[22px] tabular-nums hover:bg-dopa-cyan/90 transition-colors"
                  >
                    <Phone size={20} />
                    {tel}
                  </a>
                  <button
                    onClick={copyTel}
                    className="w-12 h-14 rounded-xl border border-surface-3 hover:bg-surface-2 inline-flex items-center justify-center text-t-tertiary"
                    title="Copier"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              ) : (
                <div className="mb-4 px-4 py-3 rounded-xl bg-dopa-red/10 border border-dopa-red/30 text-dopa-red text-[12.5px]">
                  Pas de téléphone enregistré pour ce prospect.
                </div>
              )}

              {/* Liens contexte */}
              <div className="flex flex-wrap gap-2 text-[12px]">
                {current.gmb_url && (
                  <a
                    href={current.gmb_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-surface-3 hover:bg-surface-3 text-t-secondary"
                  >
                    <ExternalLink size={11} /> Google Maps
                  </a>
                )}
                {current.site_url && (
                  <a
                    href={current.site_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-surface-3 hover:bg-surface-3 text-t-secondary"
                  >
                    <ExternalLink size={11} /> Site web
                  </a>
                )}
              </div>

              {/* Notes existantes */}
              {current.notes && (
                <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-surface-2 border-l-2 border-dopa-violet/40 text-[12px] text-t-secondary whitespace-pre-wrap max-h-32 overflow-auto">
                  {current.notes}
                </div>
              )}

              {/* Feedback récent */}
              {current.feedback && (
                <div className="mt-2 px-3.5 py-2.5 rounded-lg bg-surface-2 border-l-2 border-dopa-cyan/40 text-[12px] text-t-secondary whitespace-pre-wrap max-h-32 overflow-auto">
                  <span className="text-[10px] uppercase tracking-wider text-t-tertiary font-semibold block mb-0.5">Historique</span>
                  {current.feedback}
                </div>
              )}
            </div>

            {/* Notes appel */}
            <div className="rounded-2xl border border-surface-3 bg-surface-1 p-5 mb-5">
              <label className="text-[11px] uppercase tracking-wider text-t-tertiary font-semibold block mb-2">
                Notes de cet appel (optionnel)
              </label>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Rappeler mardi matin, intéressé mais en voyage..."
                rows={2}
                className="w-full bg-surface-0 border border-surface-3 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-dopa-cyan"
              />
            </div>

            {/* Outcomes — boutons XL */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {OUTCOMES.map((o) => {
                const Icon = o.icon;
                const isLoading = submitting === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => handleLog(o.key)}
                    disabled={!!submitting}
                    className="group relative px-4 py-4 rounded-xl border-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 text-left"
                    style={{
                      background: `${o.color}12`,
                      borderColor: `${o.color}55`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Icon size={18} style={{ color: o.textColor }} />
                      <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-0 border border-surface-3 text-t-tertiary font-mono">
                        {o.shortcut}
                      </kbd>
                    </div>
                    <p className="text-[14px] font-bold mb-0.5" style={{ color: o.textColor }}>
                      {isLoading ? "..." : o.label}
                    </p>
                    <p className="text-[11px] text-t-tertiary leading-tight">{o.desc}</p>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-t-tertiary text-center mt-4">
              Raccourcis : <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">1</kbd>–<kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">6</kbd> pour logger · <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">→</kbd> skip · <kbd className="px-1 py-0.5 rounded bg-surface-2 border border-surface-3 font-mono">Esc</kbd> quitter
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
