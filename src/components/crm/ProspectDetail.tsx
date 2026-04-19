"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, MapPin, ExternalLink, Save, Check,
  Loader2, DollarSign, PhoneOff, Voicemail, Calendar, Frown,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import type { Prospect, ResultatAppel } from "@/lib/crmTypes";
import StatutBadge from "./StatutBadge";
import { STATUT_LABEL, STATUT_EMOJI, STATUTS_ORDRE } from "@/lib/crmLabels";

export default function ProspectDetail({ id }: { id: string }) {
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
      <div className="h-full flex items-center justify-center text-t-tertiary">
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/prospects"
            className="p-2 hover:bg-surface-2 rounded-lg text-t-tertiary hover:text-t-primary transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight flex items-center gap-2">
              {prospect.entreprise}
              {prospect.archived && <span className="text-[10px] uppercase tracking-wider text-t-tertiary">archivé</span>}
            </h1>
            <div className="mt-1">
              <StatutBadge statut={prospect.statut} compact />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 bg-dopa-cyan/10 text-dopa-cyan rounded-lg text-[12px] font-semibold hover:bg-dopa-cyan/20"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : savedPulse ? <Check size={12} /> : <Save size={12} />}
            {savedPulse ? "Sauvé" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Action bar gros boutons résultats appel */}
      <div className="px-6 py-4 border-b border-surface-3 bg-surface-1">
        <p className="text-[10px] uppercase tracking-wider text-t-tertiary mb-3">Résultat de l'appel</p>
        <div className="grid grid-cols-5 gap-2">
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
        <div className="p-6 border-r border-surface-3 space-y-5">
          <Field label="Entreprise">
            <input
              value={form.entreprise || ""}
              onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-dopa-cyan/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone">
              <div className="flex gap-1.5">
                <input
                  value={form.telephone || ""}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="flex-1 bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[13px] tabular-nums focus:outline-none focus:border-dopa-cyan/50"
                />
                {prospect.telephone && (
                  <a
                    href={`tel:${prospect.telephone}`}
                    className="inline-flex items-center justify-center w-9 h-9 bg-dopa-green/10 text-dopa-green rounded-lg hover:bg-dopa-green/20"
                    title="Appeler"
                  >
                    <Phone size={14} />
                  </a>
                )}
              </div>
            </Field>

            <Field label="Statut">
              <select
                value={form.statut || prospect.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value as Prospect["statut"] })}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-dopa-cyan/50 cursor-pointer"
              >
                {STATUTS_ORDRE.map((s) => (
                  <option key={s} value={s}>{STATUT_EMOJI[s]} {STATUT_LABEL[s]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Fiche GMB">
            <div className="flex gap-1.5">
              <input
                value={form.gmb_url || ""}
                onChange={(e) => setForm({ ...form, gmb_url: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="flex-1 bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-dopa-cyan/50"
              />
              {prospect.gmb_url && (
                <a href={prospect.gmb_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-9 h-9 bg-dopa-cyan/10 text-dopa-cyan rounded-lg hover:bg-dopa-cyan/20">
                  <MapPin size={14} />
                </a>
              )}
            </div>
          </Field>

          <Field label="Site actuel">
            <div className="flex gap-1.5">
              <input
                value={form.site_url || ""}
                onChange={(e) => setForm({ ...form, site_url: e.target.value })}
                placeholder="https://..."
                className="flex-1 bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-dopa-cyan/50"
              />
              {prospect.site_url && (
                <a href={prospect.site_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-9 h-9 bg-dopa-cyan/10 text-dopa-cyan rounded-lg hover:bg-dopa-cyan/20">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </Field>

          <Field label="Lien maquette IA">
            <div className="flex gap-1.5">
              <input
                value={form.lien_maquette || ""}
                onChange={(e) => setForm({ ...form, lien_maquette: e.target.value })}
                placeholder="Colle ici le lien Google AI Studio"
                className="flex-1 bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-dopa-cyan/50"
              />
              {prospect.lien_maquette && (
                <a href={prospect.lien_maquette} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-9 h-9 bg-dopa-violet/10 text-dopa-violet rounded-lg hover:bg-dopa-violet/20">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date RDV">
              <input
                type="date"
                value={form.date_rdv || ""}
                onChange={(e) => setForm({ ...form, date_rdv: e.target.value || null })}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-dopa-cyan/50"
              />
            </Field>
            <Field label="Date relance">
              <input
                type="date"
                value={form.date_relance || ""}
                onChange={(e) => setForm({ ...form, date_relance: e.target.value || null })}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-dopa-cyan/50"
              />
            </Field>
          </div>

          <Field label="Feedback appel">
            <textarea
              value={form.feedback || ""}
              onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              rows={2}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-dopa-cyan/50 resize-none"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-dopa-cyan/50 resize-none"
            />
          </Field>

          <div className="flex items-center justify-between pt-3 border-t border-surface-3">
            <label className="inline-flex items-center gap-2 text-[12px] text-t-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.archived}
                onChange={(e) => setForm({ ...form, archived: e.target.checked })}
                className="accent-dopa-red"
              />
              Archivé
            </label>
            <span className="text-[10px] text-t-tertiary">
              Créé le {new Date(prospect.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Colonne droite : historique appels */}
        <div className="p-6 bg-surface-1/40">
          <p className="text-[10px] uppercase tracking-wider text-t-tertiary mb-3">
            Historique des appels ({prospectCalls.length})
          </p>
          {prospectCalls.length === 0 ? (
            <div className="text-center py-10 text-t-tertiary text-[13px]">
              Aucun appel enregistré pour ce prospect.
            </div>
          ) : (
            <ol className="space-y-2.5">
              {prospectCalls.map((c) => (
                <li
                  key={c.id}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-t-primary">
                        {RESULTAT_ICON[c.resultat]} {RESULTAT_TEXT[c.resultat]}
                      </span>
                      {!c.compte_mission && (
                        <span className="text-[9px] uppercase tracking-wider text-t-tertiary">
                          ne compte pas
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <p className="text-[11.5px] text-t-secondary mt-1 whitespace-pre-wrap">{c.notes}</p>
                    )}
                  </div>
                  <time className="text-[10px] text-t-tertiary tabular-nums whitespace-nowrap">
                    {new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    <br />
                    {new Date(c.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Modal VENDU */}
      {showVendu && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowVendu(false)}>
          <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
            className="bg-surface-1 border border-surface-3 rounded-2xl shadow-elevated w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-dopa-green" />
              Encaisser une vente
            </h3>
            <label className="block text-[11px] uppercase tracking-wider text-t-tertiary mb-2">
              Montant (€)
            </label>
            <input
              type="number"
              value={montantVendu}
              onChange={(e) => setMontantVendu(Number(e.target.value))}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-[14px] font-semibold tabular-nums focus:outline-none focus:border-dopa-green/50 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowVendu(false)} className="px-4 py-2 text-[13px] text-t-secondary rounded-lg">
                Annuler
              </button>
              <button
                onClick={onVendu}
                disabled={acting || !montantVendu}
                className="px-4 py-2 bg-dopa-green text-black text-[13px] font-semibold rounded-lg disabled:opacity-40"
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
      <label className="block text-[10px] uppercase tracking-wider text-t-tertiary mb-1.5 font-semibold">
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
  red:    "bg-dopa-red/10 text-dopa-red border-dopa-red/30 hover:bg-dopa-red/20",
  gray:   "bg-surface-2 text-t-secondary border-surface-3 hover:bg-surface-3",
  green:  "bg-dopa-green/10 text-dopa-green border-dopa-green/30 hover:bg-dopa-green/20",
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
