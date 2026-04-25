"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, MapPin, Save, Check,
  Loader2, DollarSign, PhoneOff, Voicemail, Calendar, Frown,
  ChevronLeft, ChevronRight, Sparkles, RotateCcw, X,
  ListChecks, Plus, CheckCircle2, Circle,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { useAppStore } from "@/store/useAppStore";
import type { Prospect, ResultatAppel } from "@/lib/crmTypes";
import StatutBadge from "./StatutBadge";
import { STATUT_LABEL, STATUT_EMOJI, STATUTS_ORDRE } from "@/lib/crmLabels";

function ordinal(n: number): string {
  if (n === 1) return "1re";
  return `${n}e`;
}

type Props = {
  id: string;
  /** Mode drawer : appelé quand on ferme (au lieu de revenir à /prospects) */
  onClose?: () => void;
  /** ID du prospect suivant (pour fleche custom dans le drawer) */
  onNavigate?: (id: string) => void;
};

export default function ProspectDetail({ id, onClose, onNavigate }: Props) {
  const router = useRouter();
  const loaded = useCrmStore((s) => s.loaded);
  const prospects = useCrmStore((s) => s.prospects);
  const calls = useCrmStore((s) => s.calls);
  const loadAll = useCrmStore((s) => s.loadAll);
  const updateProspect = useCrmStore((s) => s.updateProspect);
  const logCall = useCrmStore((s) => s.logCall);
  const addRevenu = useCrmStore((s) => s.addRevenu);
  const config = useCrmStore((s) => s.config);

  // Tâches liées (matching par nom d'entreprise dans text/description)
  const allTasks = useAppStore((s) => s.tasks);
  const addTask = useAppStore((s) => s.addTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);

  const prospect = prospects.find((p) => p.id === id);
  const prospectCalls = useMemo(
    () => calls.filter((c) => c.prospect_id === id).sort((a, b) => b.date.localeCompare(a.date)),
    [calls, id]
  );

  // Tâches liées : recherche du nom d'entreprise dans text/description (case-insensitive)
  const relatedTasks = useMemo(() => {
    if (!prospect) return [];
    const needle = prospect.entreprise.trim().toLowerCase();
    if (needle.length < 2) return [];
    return allTasks.filter((t) => {
      const hay = `${t.text || ""} ${t.description || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [allTasks, prospect?.entreprise]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTasks = useMemo(
    () => relatedTasks.filter((t) => t.status !== "done" && t.status !== "completed"),
    [relatedTasks]
  );
  const completedTasks = useMemo(
    () => relatedTasks.filter((t) => t.status === "done" || t.status === "completed"),
    [relatedTasks]
  );

  const onAddTaskForProspect = () => {
    if (!prospect) return;
    addTask(`Suivi ${prospect.entreprise}`, "today");
  };

  const onToggleTask = (taskId: string, isDone: boolean) => {
    if (isDone) updateTaskStatus(taskId, "today");
    else completeTask(taskId);
  };

  const tentativeNum = prospectCalls.length + 1;

  // Navigation Prev/Next parmi les prospects non archivés
  const { prevId, nextId, position, total } = useMemo(() => {
    const list = prospects.filter((p) => !p.archived);
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return { prevId: null, nextId: null, position: 0, total: list.length };
    return {
      prevId: idx > 0 ? list[idx - 1].id : null,
      nextId: idx < list.length - 1 ? list[idx + 1].id : null,
      position: idx + 1,
      total: list.length,
    };
  }, [prospects, id]);

  const goTo = (targetId: string) => {
    if (onNavigate) onNavigate(targetId);
    else router.push(`/prospects/${targetId}`);
  };

  const [form, setForm] = useState<Partial<Prospect>>({});
  const [saving, setSaving] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [acting, setActing] = useState(false);
  const [showVendu, setShowVendu] = useState(false);
  const [montantVendu, setMontantVendu] = useState(config?.prix_site || 980);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  useEffect(() => {
    if (prospect) setForm(prospect);
  }, [prospect?.id, prospect?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (config?.prix_site) setMontantVendu(config.prix_site);
  }, [config?.prix_site]);

  if (!prospect) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
        {loaded ? "Prospect introuvable." : <Loader2 size={16} className="animate-spin" />}
      </div>
    );
  }

  const onSave = async () => {
    setSaving(true);
    await updateProspect(id, form);
    setSaving(false);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1200);
  };

  const onAction = async (resultat: ResultatAppel) => {
    setActing(true);
    await logCall(id, resultat);
    setActing(false);
  };

  const onVendu = async () => {
    setActing(true);
    await addRevenu(id, Number(montantVendu));
    setShowVendu(false);
    setActing(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--background)]">

      {/* ─── HEADER : nom + statut + tentatives + nav prev/next ─── */}
      <div className="px-5 py-3 border-b border-[var(--border-primary)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onClose ? (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0"
              title="Fermer"
            >
              <X size={16} />
            </button>
          ) : (
            <Link
              href="/prospects"
              className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-[17px] font-bold tracking-tight truncate">
              {prospect.entreprise}
              {prospect.archived && <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">archivé</span>}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5">
              <StatutBadge statut={prospect.statut} compact />
              {prospectCalls.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                    prospectCalls.length >= 3
                      ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]"
                      : "bg-[#422006]/80 text-[#fb923c]"
                  }`}
                >
                  <RotateCcw size={9} />
                  {ordinal(tentativeNum)} appel
                </span>
              )}
              {openTasks.length > 0 && (
                <motion.span
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums bg-dopa-violet/15 text-dopa-violet border border-dopa-violet/30"
                  title={`${openTasks.length} tâche(s) liée(s) en cours`}
                >
                  <ListChecks size={9} />
                  {openTasks.length} tâche{openTasks.length > 1 ? "s" : ""}
                </motion.span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => prevId && goTo(prevId)}
            disabled={!prevId}
            title="Précédent"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-[10.5px] tabular-nums text-[var(--text-tertiary)] px-0.5">
            {position}/{total}
          </span>
          <button
            onClick={() => nextId && goTo(nextId)}
            disabled={!nextId}
            title="Suivant"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ─── ZONE D'APPEL : GMB + ACTIONS XL ─── */}
      <div className="px-5 py-4 border-b border-[var(--border-primary)] bg-[var(--surface-1)] space-y-3">

        {/* GMB MEGA bouton + tel discret */}
        <div className="flex items-stretch gap-2">
          {prospect.gmb_url ? (
            <a
              href={prospect.gmb_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-4 bg-[var(--accent-cyan)] text-black rounded-xl font-bold text-[15px] hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-cyan)]/20"
            >
              <MapPin size={20} strokeWidth={2.5} />
              Ouvrir la fiche GMB
            </a>
          ) : (
            <span className="flex-1 inline-flex items-center justify-center px-4 py-4 bg-[var(--surface-2)] text-[var(--text-tertiary)] rounded-xl text-[13px] italic">
              Pas de fiche GMB
            </span>
          )}
          {prospect.telephone && (
            <a
              href={`tel:${prospect.telephone}`}
              title={prospect.telephone}
              className="inline-flex items-center justify-center px-3 py-2 bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--surface-3)] tabular-nums text-[11px]"
            >
              <Phone size={13} className="mr-1" />
              {prospect.telephone}
            </a>
          )}
        </div>

        {/* Action bar résultat appel — XL */}
        <div className="grid grid-cols-5 gap-1.5">
          <ResultBtn icon={<Calendar size={18} />} label="RDV Booké" color="blue" onClick={() => onAction("RDV")} disabled={acting} />
          <ResultBtn icon={<Voicemail size={18} />} label="Répondeur" color="orange" onClick={() => onAction("REPONDEUR")} disabled={acting} />
          <ResultBtn icon={<Frown size={18} />} label="Refus" color="red" onClick={() => onAction("REFUS")} disabled={acting} />
          <ResultBtn icon={<PhoneOff size={18} />} label="Pas joignable" color="gray" onClick={() => onAction("PAS_JOIGNABLE")} disabled={acting} />
          <ResultBtn icon={<DollarSign size={18} />} label="VENDU" color="green" onClick={() => setShowVendu(true)} disabled={acting} />
        </div>
      </div>

      {/* ─── BODY scrollable ─── */}
      <div className="flex-1 overflow-auto p-5 space-y-4">

        {/* Statut + RDV date (édition rapide) */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Statut">
            <select
              value={form.statut || prospect.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value as Prospect["statut"] })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-var(--accent-cyan)/50 cursor-pointer"
            >
              {STATUTS_ORDRE.map((s) => (
                <option key={s} value={s}>{STATUT_EMOJI[s]} {STATUT_LABEL[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Date RDV">
            <input
              type="date"
              value={form.date_rdv || ""}
              onChange={(e) => setForm({ ...form, date_rdv: e.target.value || null })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50"
            />
          </Field>
        </div>

        {/* Maquette (visible si RDV booké ou maquette prête) */}
        {(prospect.statut === "RDV_BOOKE" || prospect.statut === "MAQUETTE_PRETE" || form.lien_maquette) && (
          <Field label={
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={11} className="text-[var(--accent-purple)]" />
              Lien maquette IA
            </span>
          }>
            <input
              value={form.lien_maquette || ""}
              onChange={(e) => setForm({ ...form, lien_maquette: e.target.value })}
              placeholder="Colle ici le lien Google AI Studio"
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-purple)/50"
            />
          </Field>
        )}

        {/* Notes (le champ principal) */}
        <Field label="Notes (ce qui s'est dit)">
          <textarea
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
            placeholder="Le boss s'appelle Marc, dispo jeudi 14h, budget 3k€/an…"
            className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12.5px] focus:outline-none focus:border-var(--accent-cyan)/50 resize-none leading-relaxed"
          />
        </Field>

        {/* Save + auto-feedback indicator */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[10.5px] text-[var(--text-tertiary)] italic">
            {prospect.feedback ? `Auto: « ${prospect.feedback} »` : "Pas encore de feedback auto."}
          </p>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)] rounded-lg text-[12px] font-semibold hover:bg-[var(--surface-2)] shrink-0"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : savedPulse ? <Check size={12} /> : <Save size={12} />}
            {savedPulse ? "Sauvé" : "Enregistrer notes"}
          </button>
        </div>

        {/* ─── TÂCHES LIÉES ─── */}
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-1)] p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <ListChecks size={13} className="text-dopa-violet" />
              <h4 className="text-[12px] font-bold tracking-tight">Tâches liées</h4>
              {relatedTasks.length > 0 && (
                <span className="text-[10px] tabular-nums text-[var(--text-tertiary)]">
                  · {openTasks.length} en cours
                  {completedTasks.length > 0 && ` · ${completedTasks.length} fait`}
                </span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              onClick={onAddTaskForProspect}
              className="inline-flex items-center gap-1 px-2 py-1 bg-dopa-violet/15 text-dopa-violet rounded-md text-[10.5px] font-semibold hover:bg-dopa-violet/25"
            >
              <Plus size={11} /> Tâche
            </motion.button>
          </div>

          {relatedTasks.length === 0 ? (
            <p className="text-[11px] text-[var(--text-tertiary)] italic py-1">
              Aucune tâche liée. Crée-en une pour suivre ce prospect.
            </p>
          ) : (
            <ul className="space-y-1.5">
              <AnimatePresence initial={false}>
                {[...openTasks, ...completedTasks].map((t) => {
                  const isDone = t.status === "done" || t.status === "completed";
                  return (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={`group flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-colors ${
                        isDone
                          ? "bg-[var(--surface-1)] border-[var(--border-primary)] opacity-60"
                          : "bg-[var(--surface-2)] border-[var(--border-primary)] hover:border-dopa-violet/40"
                      }`}
                    >
                      <button
                        onClick={() => onToggleTask(t.id, isDone)}
                        className="shrink-0 mt-0.5 text-[var(--text-tertiary)] hover:text-dopa-green"
                        title={isDone ? "Marquer comme à faire" : "Terminer"}
                      >
                        {isDone ? (
                          <CheckCircle2 size={14} className="text-dopa-green" />
                        ) : (
                          <Circle size={14} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] leading-tight ${isDone ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)] font-medium"}`}>
                          {t.text}
                        </p>
                        {t.description && (
                          <p className="text-[10.5px] text-[var(--text-tertiary)] mt-0.5 line-clamp-1">
                            {t.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[9.5px] text-[var(--text-tertiary)] flex-wrap">
                          <span className="uppercase tracking-wider font-semibold px-1.5 py-px rounded bg-[var(--surface-1)]">
                            {t.status}
                          </span>
                          {t.dueDate && (
                            <span className="inline-flex items-center gap-0.5 tabular-nums">
                              <Calendar size={9} />
                              {new Date(t.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Historique appels (déroulé en bas) */}
        {prospectCalls.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-1 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold py-2 hover:text-[var(--text-primary)]">
              Historique ({prospectCalls.length} appel{prospectCalls.length > 1 ? "s" : ""})
              <ChevronRight size={11} className="group-open:rotate-90 transition-transform" />
            </summary>
            <ol className="space-y-1.5 mt-2">
              {prospectCalls.map((c, idx) => {
                const attemptNum = prospectCalls.length - idx;
                return (
                  <li key={c.id} className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-lg px-3 py-2 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] tabular-nums">#{attemptNum}</span>
                        {RESULTAT_ICON[c.resultat]} {RESULTAT_TEXT[c.resultat]}
                      </p>
                      {c.notes && <p className="text-[11px] text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{c.notes}</p>}
                    </div>
                    <time className="text-[10px] text-[var(--text-tertiary)] tabular-nums whitespace-nowrap shrink-0">
                      {new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </time>
                  </li>
                );
              })}
            </ol>
          </details>
        )}

        {/* Footer infos discrètes */}
        <div className="pt-2 border-t border-[var(--border-primary)] flex items-center justify-between text-[10.5px] text-[var(--text-tertiary)]">
          <span>{prospect.niche || "Sans niche"}</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={!!form.archived}
              onChange={(e) => setForm({ ...form, archived: e.target.checked })}
              className="accent-var(--accent-red)"
            />
            Archivé
          </label>
          <span>Créé {new Date(prospect.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>

      {/* Modal VENDU */}
      {showVendu && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowVendu(false)}>
          <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
            className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-[var(--accent-green)]" />
              Encaisser une vente
            </h3>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Montant (€)</label>
            <input
              type="number"
              value={montantVendu}
              onChange={(e) => setMontantVendu(Number(e.target.value))}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[14px] font-semibold tabular-nums focus:outline-none focus:border-[var(--accent-green)]/50 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowVendu(false)} className="px-4 py-2 text-[13px] text-[var(--text-secondary)] rounded-lg">Annuler</button>
              <button
                onClick={onVendu}
                disabled={acting || !montantVendu}
                className="px-4 py-2 bg-[var(--accent-green)] text-black text-[13px] font-semibold rounded-lg disabled:opacity-40"
              >
                Encaisser {montantVendu}€
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Sous-composants ─────────────────────────────────────────

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1 font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

const RESULTAT_ICON: Record<ResultatAppel, string> = {
  DECROCHE: "🗣️",
  REPONDEUR: "🟠",
  REFUS: "🔴",
  EXISTE_PAS: "⚪",
  RDV: "📅",
  PAS_JOIGNABLE: "⏱️",
};

const RESULTAT_TEXT: Record<ResultatAppel, string> = {
  DECROCHE: "Décroché",
  REPONDEUR: "Répondeur",
  REFUS: "Refus",
  EXISTE_PAS: "N'existe pas",
  RDV: "RDV pris",
  PAS_JOIGNABLE: "Pas joignable",
};

type BtnColor = "blue" | "orange" | "red" | "gray" | "green";
const BTN_COLORS: Record<BtnColor, string> = {
  blue:   "bg-dopa-blue/10 text-dopa-blue border-dopa-blue/30 hover:bg-dopa-blue/20",
  orange: "bg-[#422006]/80 text-[#fb923c] border-[#78350f] hover:bg-[#422006]",
  red:    "bg-[var(--accent-red-light)] text-[var(--accent-red)] border-[var(--accent-red)] hover:bg-[var(--surface-2)]",
  gray:   "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-surface-3",
  green:  "bg-[var(--accent-green-light)] text-[var(--accent-green)] border-[var(--accent-green)] hover:bg-[var(--surface-2)]",
};

function ResultBtn({
  icon, label, color, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  color: BtnColor;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex flex-col items-center justify-center gap-1 px-2 py-3 border rounded-xl text-[10.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${BTN_COLORS[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
