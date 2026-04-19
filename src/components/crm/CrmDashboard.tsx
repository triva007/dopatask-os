"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone, Calendar, CheckCircle2, Banknote, Target, Zap, Rocket, Flame,
  Skull, Trophy, AlertTriangle, Loader2,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import {
  computeStatsMois, computeStreak, joursAvantDeadline,
  motivationMessage, thermometreColor,
} from "@/lib/crmLogic";

export default function CrmDashboard() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const error = useCrmStore((s) => s.error);
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const config = useCrmStore((s) => s.config);
  const loadAll = useCrmStore((s) => s.loadAll);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  const stats = useMemo(() => computeStatsMois(calls, revenus), [calls, revenus]);
  const streak = useMemo(() => computeStreak(calls), [calls]);

  const objectif = config?.objectif_mensuel ?? 3000;
  const deadline = config?.deadline_date ?? "2026-06-01";
  const dailyTarget = config?.mission_daily_target ?? 5;
  const motivationDefault = config?.motivation_default ?? "Ne regarde pas la montagne. Prends ton téléphone et passe juste 1 appel.";
  const bouleMessage = config?.boule_a_z_message ?? "Si 0 € au 1er juin → boule à Z le 2 juin.";

  const jX = joursAvantDeadline(deadline);
  const pct = Math.min(100, Math.round((stats.revenuTotal / objectif) * 100));
  const thermoColor = thermometreColor(stats.revenuTotal, objectif);
  const trajectoire = Math.round((objectif / Math.max(1, 43)) * (43 - Math.max(0, jX))); // pro-rata sur 43j (19 avr → 1 juin)
  const retard = stats.revenuTotal < trajectoire;

  const motiv = motivationMessage({
    appelsDuJour: stats.appelsDuJour,
    dailyTarget,
    rdvObtenus: stats.rdvObtenus,
    sitesVendus: stats.sitesVendus,
    revenuTotal: stats.revenuTotal,
    objectifMensuel: objectif,
    motivationDefault,
  });

  if (!loaded && loading) {
    return (
      <div className="h-full flex items-center justify-center text-t-tertiary gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span>Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1280px] mx-auto px-8 py-8 space-y-6">
        {error && (
          <div className="px-4 py-3 bg-dopa-red/10 border border-dopa-red/30 rounded-lg text-[12px] text-dopa-red flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* === 1. BANDEAU OBJECTIF + THERMOMÈTRE === */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-surface-3 bg-gradient-to-br from-surface-1 to-surface-2 p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dopa-cyan/10 text-dopa-cyan flex items-center justify-center">
                <Target size={20} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-t-tertiary font-semibold">
                  Objectif mensuel · deadline {new Date(deadline).toLocaleDateString("fr-FR")}
                </p>
                <h2 className="text-[20px] font-bold tracking-tight">
                  {stats.revenuTotal.toLocaleString("fr-FR")} € <span className="text-t-tertiary font-normal">/ {objectif.toLocaleString("fr-FR")} €</span>
                </h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-t-tertiary">J - {Math.max(0, jX)}</p>
              <p className={`text-[14px] font-bold tabular-nums ${retard ? "text-dopa-red" : "text-dopa-green"}`}>
                {retard ? `-${(trajectoire - stats.revenuTotal).toLocaleString("fr-FR")} € vs trajectoire` : "Sur la bonne voie"}
              </p>
            </div>
          </div>

          <div className="relative h-4 rounded-full bg-surface-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: thermoColor, boxShadow: `0 0 16px ${thermoColor}66` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-t-tertiary tabular-nums">
            <span>0 €</span>
            <span className="text-t-primary font-semibold">{pct}%</span>
            <span>{objectif.toLocaleString("fr-FR")} €</span>
          </div>
        </motion.div>

        {/* === 2. 4 KPI GROS FORMAT === */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={<Phone size={18} />} label="Appels total" value={stats.appelsTotal} color="#F97316" />
          <KpiCard icon={<Calendar size={18} />} label="RDV obtenus" value={stats.rdvObtenus} color="#3B82F6" />
          <KpiCard icon={<CheckCircle2 size={18} />} label="Sites vendus" value={stats.sitesVendus} color="#8B5CF6" />
          <KpiCard icon={<Banknote size={18} />} label="Revenu total" value={`${stats.revenuTotal.toLocaleString("fr-FR")} €`} color="#10B981" />
        </div>

        {/* === 3. 2 TAUX === */}
        <div className="grid grid-cols-2 gap-4">
          <RatioCard icon={<Zap size={14} />} label="Conversion appel" value={`${stats.tauxConversion}%`} hint="RDV / Appels" />
          <RatioCard icon={<Trophy size={14} />} label="Taux de closing" value={`${stats.tauxClosing}%`} hint="Ventes / RDV" />
        </div>

        {/* === 4. MISSION DU JOUR === */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-surface-3 bg-surface-1 p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-dopa-xp" />
              <p className="text-[11px] uppercase tracking-wider font-semibold text-t-tertiary">
                Mission du jour · objectif {dailyTarget} appels
              </p>
            </div>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-dopa-xp font-semibold">
                <Flame size={11} /> Streak {streak}j
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <p className="text-[32px] font-bold tabular-nums text-t-primary leading-none">
              {stats.appelsDuJour}<span className="text-t-tertiary"> / {dailyTarget}</span>
            </p>
            <div className="flex gap-2">
              {Array.from({ length: dailyTarget }).map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                    i < stats.appelsDuJour
                      ? "bg-dopa-green/10 border-dopa-green text-dopa-green"
                      : "border-surface-3 text-surface-4"
                  }`}
                >
                  {i < stats.appelsDuJour ? <CheckCircle2 size={18} /> : <span className="text-[14px] font-bold">{i + 1}</span>}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[13.5px] text-t-secondary italic border-t border-surface-3 pt-3">
            {motiv}
          </p>
        </motion.div>

        {/* === 5. BOUTON LANCER RITUEL (V1.1 placeholder) === */}
        <div className="grid grid-cols-[1fr_auto] gap-4 items-stretch">
          <Link
            href="/prospects"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-dopa-cyan to-dopa-violet p-6 shadow-card-hover hover:shadow-glow-cyan transition-shadow"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-black/70 font-semibold">
                  {stats.appelsDuJour >= dailyTarget ? "Bonus — continuer" : "Démarrer ma session"}
                </p>
                <p className="text-[22px] font-black text-black leading-tight">
                  {stats.appelsDuJour >= dailyTarget ? "La suite c'est du bonus" : "Lancer mon rituel"}
                </p>
                <p className="text-[12px] text-black/60 mt-1">
                  Ouvre la liste prospects · V1.1 : mode focus 17h50 (phases 1→2→3)
                </p>
              </div>
              <Rocket size={36} className="text-black/80 group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          {/* === 6. BOULE À Z (coin bas-droit) === */}
          <BouleAZ sitesVendus={stats.sitesVendus} revenuTotal={stats.revenuTotal} bouleMessage={bouleMessage} />
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants ───────────────────────────────────────

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 border border-surface-3 shadow-card"
      style={{ background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}26`, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-wider text-t-tertiary font-semibold mb-1">{label}</p>
      <p className="text-[28px] font-black tabular-nums tracking-tight" style={{ color }}>
        {value}
      </p>
    </motion.div>
  );
}

function RatioCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface-1 border border-surface-3 p-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-t-tertiary mb-0.5">
          {icon}
          <p className="text-[10px] uppercase tracking-wider font-semibold">{label}</p>
        </div>
        <p className="text-[11px] text-t-tertiary">{hint}</p>
      </div>
      <p className="text-[24px] font-bold tabular-nums text-t-primary">{value}</p>
    </div>
  );
}

function BouleAZ({ sitesVendus, revenuTotal, bouleMessage }: { sitesVendus: number; revenuTotal: number; bouleMessage: string }) {
  if (sitesVendus === 0) {
    return (
      <div className="rounded-2xl border border-dopa-red/30 bg-dopa-red/5 p-5 w-72 flex flex-col justify-center">
        <div className="flex items-center gap-2 text-dopa-red mb-2">
          <Skull size={14} />
          <p className="text-[10px] uppercase tracking-wider font-semibold">Boule à Z</p>
        </div>
        <p className="text-[12px] text-t-secondary leading-snug">{bouleMessage}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dopa-green/30 bg-dopa-green/5 p-5 w-72 flex flex-col justify-center">
      <div className="flex items-center gap-2 text-dopa-green mb-2">
        <Trophy size={14} />
        <p className="text-[10px] uppercase tracking-wider font-semibold">Boule à Z évitée</p>
      </div>
      <p className="text-[12px] text-t-secondary leading-snug">
        <span className="font-bold text-t-primary">{sitesVendus} contrat{sitesVendus > 1 ? "s" : ""} signé{sitesVendus > 1 ? "s" : ""}</span> · {revenuTotal.toLocaleString("fr-FR")} € encaissés.
      </p>
    </div>
  );
}
