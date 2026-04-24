"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, MapPin, ExternalLink, Save, Check,
  Loader2, DollarSign, PhoneOff, Voicemail, Calendar, Frown,
  ChevronLeft, ChevronRight, Sparkles, Clock, RotateCcw,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import type { Prospect, ResultatAppel } from "@/lib/crmTypes";
import StatutBadge from "./StatutBadge";
import { STATUT_LABEL, STATUT_EMOJI, STATUTS_ORDRE } from "@/lib/crmLabels";

function addDaysISO(baseISO: string | null, days: number): string {
  const d = baseISO ? new Date(baseISO) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextMondayISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = dim, 1 = lun
  const delta = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function ordinal(n: number): string {
  if (n === 1) return "1re";
  return `${n}e`;
}

export default function ProspectDetail({ id }: { id: string }) {
  const router = useRouter();
  const loaded = useCrmStore((s) => s.loaded);
  const prospects = useCrmStore((s) => s.prospects);
  const calls = useCrmStore((s) => s.calls);
  const loadAll = useCrmStore((s) => s.loadAll);
  const updateProspect = useCrmStore((s) => s.updateProspect);
  const logCall = useCrmStore((s) => s.logCall);
  const addRevenu = useCrmStore((s) => s.addRevenu);
  const config = useCrmStore((s) => s.config);

  const prospect = prospects.find((p) => p.id === id);
  const prospectCalls = useMemo(
    () => calls.filter((c) => c.prospect_id === id).sort((a, b) => b.date.localeCompare(a.date)),
    [calls, id]
  );

  // Compteur de tentatives = nombre d'appels passés à ce prospect + 1 (le prochain)
  const tentativeNum = prospectCalls.length + 1;

  // Navigation Prev/Next parmi les prospects non archivés (ordre d'arrivée)
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

  const lastCall = prospectCalls[0];
  const isRappel = prospect.statut === "REPONDEUR" || !!prospect.date_relance;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/prospects"
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-tight flex items-center gap-2 truncate">
              {prospect.entreprise}
              {prospect.archived && <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">archivé</span>}
            </h1>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <StatutBadge statut={prospect.statut} compact />
              {prospectCalls.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
                    prospectCalls.length >= 3
                      ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]"
                      : prospectCalls.length >= 1
                      ? "bg-[#422006]/80 text-[#fb923c]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                  }`}
                  title={`${prospectCalls.length} appel(s) déjà passé(s)`}
                >
                  <RotateCcw size={10} />
                  {ordinal(tentativeNum)} tentative
                </span>
              )}
              {isRappel && prospect.date_relance && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)]">
                  <Clock size={10} />
                  Relance {new Date(prospect.date_relance).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Prev / Next */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => prevId && router.push(`/prospects/${prevId}`)}
              disabled={!prevId}
              title="Prospect précédent"
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] tabular-nums text-[var(--text-tertiary)] px-1">
              {position}/{total}
            </span>
            <button
              onClick={() => nextId && router.push(`/prospects/${nextId}`)}
              disabled={!nextId}
              title="Prospect suivant"
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)] rounded-lg text-[12px] font-semibold hover:bg-[var(--surface-2)]"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : savedPulse ? <Check size={12} /> : <Save size={12} />}
            {savedPulse ? "Sauvé" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* BLOC APPEL — tout sous les yeux pendant le call */}
      <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--surface-1)]">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          {/* Gauche : tel + liens rapides */}
          <div className="flex items-center gap-3 flex-wrap">
            {prospect.telephone ? (
              <a
                href={`tel:${prospect.telephone}`}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-[var(--accent-green-light)] text-[var(--accent-green)] rounded-xl font-bold text-[16px] tabular-nums hover:bg-[var(--surface-2)] border border-[var(--accent-green)]/30"
              >
                <Phone size={18} />
                {prospect.telephone}
              </a>
            ) : (
              <span className="px-4 py-2.5 bg-[var(--surface-2)] text-[var(--text-tertiary)] rounded-xl text-[13px] italic">
                Pas de téléphone
              </span>
            )}
            <div className="flex items-center gap-1.5">
              {prospect.gmb_url && (
                <a
                  href={prospect.gmb_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Fiche Google My Business"
                  className="inline-flex items-center gap-1 px-2.5 py-2 bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)] rounded-lg text-[11px] font-semibold hover:bg-[var(--surface-2)]"
                >
                  <MapPin size={12} /> GMB
                </a>
              )}
              {prospect.site_url && (
                <a
                  href={prospect.site_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Site actuel du prospect"
                  className="inline-flex items-center gap-1 px-2.5 py-2 bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)] rounded-lg text-[11px] font-semibold hover:bg-[var(--surface-2)]"
                >
                  <ExternalLink size={12} /> Site
                </a>
              )}
              {prospect.lien_maquette && (
                <a
                  href={prospect.lien_maquette}
                  target="_blank"
                  rel="noreferrer"
                  title="Maquette IA"
                  className="inline-flex items-center gap-1 px-2.5 py-2 bg-[var(--accent-purple-light)] text-[var(--accent-purple)] rounded-lg text-[11px] font-semibold hover:bg-[var(--surface-2)]"
                >
                  <Sparkles size={12} /> Maquette
                </a>
              )}
            </div>
          </div>
          {/* Droite : dernier feedback */}
          {(prospect.feedback || lastCall) && (
            <div className="max-w-[340px] bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-1">
                Dernier appel
              </p>
              <p className="text-[11.5px] text-[var(--text-primary)] leading-relaxed">
                {prospect.feedback || (lastCall && RESULTAT_TEXT[lastCall.resultat])}
              </p>
              {lastCall?.notes && (
                <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 italic line-clamp-2">
                  &ldquo;{lastCall.notes}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action bar résultat appel */}
        <div className="grid grid-cols-5 gap-2 mt-3">
          <ResultBtn icon={<Calendar size={16} />} label="RDV calé" color="blue" onClick={() => onAction("RDV")} disabled={acting} />
          <ResultBtn icon={<Voicemail size={16} />} label="Répondeur" color="orange" onClick={() => onAction("REPONDEUR")} disabled={acting} />
          <ResultBtn icon={<Frown size={16} />} label="Refus" color="red" onClick={() => onAction("REFUS")} disabled={acting} />
          <ResultBtn icon={<PhoneOff size={16} />} label="Pas joignable" color="gray" onClick={() => onAction("PAS_JOIGNABLE")} disabled={acting} />
          <ResultBtn icon={<DollarSign size={16} />} label="VENDU 💸" color="green" onClick={() => setShowVendu(true)} disabled={acting} />
        </div>
      </div>

      {/* Body split 2 colonnes */}
      <div className="flex-1 overflow-auto grid grid-cols-2 gap-0">
        {/* Colonne gauche : fiche éditable */}
        <div className="p-6 border-r border-[var(--border-primary)] space-y-5">
          <Field label="Entreprise">
            <input
              value={form.entreprise || ""}
              onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-var(--accent-cyan)/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone">
              <input
                value={form.telephone || ""}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[13px] tabular-nums focus:outline-none focus:border-var(--accent-cyan)/50"
              />
            </Field>

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
          </div>

          <Field label="Fiche GMB">
            <input
              value={form.gmb_url || ""}
              onChange={(e) => setForm({ ...form, gmb_url: e.target.value })}
              placeholder="https://maps.google.com/..."
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50"
            />
          </Field>

          <Field label="Site actuel">
            <input
              value={form.site_url || ""}
              onChange={(e) => setForm({ ...form, site_url: e.target.value })}
              placeholder="https://..."
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50"
            />
          </Field>

          <Field label="Lien maquette IA">
            <input
              value={form.lien_maquette || ""}
              onChange={(e) => setForm({ ...form, lien_maquette: e.target.value })}
              placeholder="Colle ici le lien Google AI Studio"
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date RDV">
              <input
                type="date"
                value={form.date_rdv || ""}
                onChange={(e) => setForm({ ...form, date_rdv: e.target.value || null })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50"
              />
            </Field>
            <Field label="Date relance">
              <input
                type="date"
                value={form.date_relance || ""}
                onChange={(e) => setForm({ ...form, date_relance: e.target.value || null })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50"
              />
              <div className="flex gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, date_relance: addDaysISO(null, 3) })}
                  className="flex-1 px-2 py-1 text-[10.5px] font-semibold bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-md hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)] text-[var(--text-secondary)]"
                  title="Relance dans 3 jours"
                >
                  J+3
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, date_relance: addDaysISO(null, 7) })}
                  className="flex-1 px-2 py-1 text-[10.5px] font-semibold bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-md hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)] text-[var(--text-secondary)]"
                  title="Relance dans 7 jours"
                >
                  J+7
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, date_relance: nextMondayISO() })}
                  className="flex-1 px-2 py-1 text-[10.5px] font-semibold bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-md hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)] text-[var(--text-secondary)]"
                  title="Lundi prochain"
                >
                  Lundi
                </button>
              </div>
            </Field>
          </div>

          <Field label="Feedback appel">
            <textarea
              value={form.feedback || ""}
              onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              rows={2}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50 resize-none"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-var(--accent-cyan)/50 resize-none"
            />
          </Field>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
            <label className="inline-flex items-center gap-2 text-[12px] text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.archived}
                onChange={(e) => setForm({ ...form, archived: e.target.checked })}
                className="accent-var(--accent-red)"
              />
              Archivé
            </label>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              Créé le {new Date(prospect.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Colonne droite : historique appels */}
        <div className="p-6 bg-[var(--surface-1)]/40">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Historique des appels ({prospectCalls.length})
          </p>
          {prospectCalls.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-tertiary)] text-[13px]">
              Aucun appel enregistré pour ce prospect.
            </div>
          ) : (
            <ol className="space-y-2.5">
              {prospectCalls.map((c, idx) => {
                const attemptNum = prospectCalls.length - idx;
                return (
                  <li
                    key={c.id}
                    className="bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] tabular-nums">
                          #{attemptNum}
                        </span>
                        <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                          {RESULTAT_ICON[c.resultat]} {RESULTAT_TEXT[c.resultat]}
                        </span>
                        {!c.compte_mission && (
                          <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
                            ne compte pas
                          </span>
                        )}
                      </div>
                      {c.notes && (
                        <p className="text-[11.5px] text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{c.notes}</p>
                      )}
                    </div>
                    <time className="text-[10px] text-[var(--text-tertiary)] tabular-nums whitespace-nowrap">
                      {new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      <br />
                      {new Date(c.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Modal VENDU */}
      {showVendu && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowVendu(false)}>
          <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
            className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl  w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-var(--accent-green)" />
              Encaisser une vente
            </h3>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
              Montant (€)
            </label>
            <input
              type="number"
              value={montantVendu}
              onChange={(e) => setMontantVendu(Number(e.target.value))}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[14px] font-semibold tabular-nums focus:outline-none focus:border-var(--accent-green)/50 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowVendu(false)} className="px-4 py-2 text-[13px] text-[var(--text-secondary)] rounded-lg">
                Annuler
              </button>
              <button
                onClick={onVendu}
                disabled={acting || !montantVendu}
                className="px-4 py-2 bg-var(--accent-green) text-black text-[13px] font-semibold rounded-lg disabled:opacity-40"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5 font-semibold">
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
      className={`inline-flex flex-col items-center justify-center gap-1 px-3 py-3 border rounded-xl text-[11.5px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${BTN_COLORS[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
