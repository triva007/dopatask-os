"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Calendar, Upload, Wrench, Users,
  TrendingUp, Banknote, AlertTriangle, Loader2, ChevronRight,
  Trophy, BarChart3,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import {
  STATUT_LABEL, STATUT_EMOJI, STATUT_COLORS,
} from "@/lib/crmLabels";
import type { StatutProspect } from "@/lib/crmTypes";
import { computeStatsMois } from "@/lib/crmLogic";
import StatutBadge from "./StatutBadge";
import ImportCsvModal from "./ImportCsvModal";
import ColdCallSession from "./ColdCallSession";
import { celebrate } from "@/lib/dopamineFeedback";

// Statuts affiches dans le pipeline kanban (on cache les terminaux)
const PIPELINE_STATUTS: StatutProspect[] = [
  "A_APPELER", "REPONDEUR", "RDV_BOOKE", "MAQUETTE_PRETE", "R1_EFFECTUE", "VENDU",
];

export default function CrmHub() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const error = useCrmStore((s) => s.error);
  const prospects = useCrmStore((s) => s.prospects);
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const loadAll = useCrmStore((s) => s.loadAll);
  const repair = useCrmStore((s) => s.repairProspectsFromNotes);

  const [showImport, setShowImport] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<{ fixed: number; scanned: number } | null>(null);
  const [coldCallMode, setColdCallMode] = useState(false);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  // Auto-refresh des données quand la page est visible
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") loadAll();
    };
    const id = window.setInterval(refresh, 20000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadAll]);

  const actifs = useMemo(() => prospects.filter((p) => !p.archived), [prospects]);
  const archives = useMemo(() => prospects.filter((p) => p.archived), [prospects]);
  const aAppeler = useMemo(
    () => actifs.filter((p) => p.statut === "A_APPELER" || p.statut === "REPONDEUR"),
    [actifs]
  );
  const rdvEnStock = useMemo(
    () => actifs.filter((p) => p.statut === "RDV_BOOKE" || p.statut === "MAQUETTE_PRETE" || p.statut === "R1_EFFECTUE"),
    [actifs]
  );
  const vendus = useMemo(() => prospects.filter((p) => p.statut === "VENDU"), [prospects]);

  // Pipeline : par statut
  const byStatut = useMemo(() => {
    const map: Record<StatutProspect, typeof prospects> = {
      A_APPELER: [], REPONDEUR: [], REFUS: [], EXISTE_PAS: [],
      RDV_BOOKE: [], MAQUETTE_PRETE: [], R1_EFFECTUE: [], VENDU: [], PERDU: [],
    };
    for (const p of actifs) map[p.statut].push(p);
    return map;
  }, [actifs]);

  // Prochains RDV : tries par date_rdv croissant, non passes
  const prochainsRdv = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return actifs
      .filter((p) => p.date_rdv && p.date_rdv >= today)
      .sort((a, b) => (a.date_rdv! < b.date_rdv! ? -1 : 1))
      .slice(0, 6);
  }, [actifs]);

  // Prospects a appeler (priorite) : A_APPELER + REPONDEUR tries par created_at
  const aAppelerTop = useMemo(
    () => [...aAppeler].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6),
    [aAppeler]
  );


  // Stats mois (reutilisable sur home)
  const stats = useMemo(() => computeStatsMois(calls, revenus), [calls, revenus]);

  // Nombre de prospects susceptibles d'avoir un statut dans leurs notes
  const suspectsNotes = useMemo(() => {
    return actifs.filter((p) => p.statut === "A_APPELER" && p.notes && p.notes.length > 3).length;
  }, [actifs]);

  const runRepair = async () => {
    setRepairing(true);
    const r = await repair();
    setRepairResult(r);
    if (r.fixed > 0) celebrate("task-complete");
    setRepairing(false);
    setTimeout(() => setRepairResult(null), 6000);
  };

  if (!loaded && loading) {
    return (
      <div className="h-full flex items-center justify-center text-t-tertiary gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span>Chargement du CRM...</span>
      </div>
    );
  }

  // Mode session cold-call : on remplace tout le hub par le composant focus
  if (coldCallMode) {
    return <ColdCallSession onExit={() => setColdCallMode(false)} />;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1700px] mx-auto px-10 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">CRM</h1>
            <p className="text-[12.5px] text-t-tertiary mt-1">
              Vue globale {prospects.length} prospects &middot; {actifs.length} actifs &middot; {archives.length} archives
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/crm/analytics"
              className="inline-flex items-center gap-2 px-3 py-2 bg-surface-2 border border-surface-3 rounded-lg text-[13px] font-semibold hover:bg-surface-3"
            >
              <BarChart3 size={14} /> Analytique
            </Link>
            <Link
              href="/prospects"
              className="inline-flex items-center gap-2 px-3 py-2 bg-surface-2 border border-surface-3 rounded-lg text-[13px] font-semibold hover:bg-surface-3"
            >
              <Users size={14} /> Tous les prospects
            </Link>
            <button
              onClick={runRepair}
              disabled={repairing || suspectsNotes === 0}
              className="inline-flex items-center gap-2 px-3 py-2 bg-dopa-violet/10 text-dopa-violet rounded-lg text-[13px] font-semibold hover:bg-dopa-violet/20 disabled:opacity-40 disabled:cursor-not-allowed"
              title={suspectsNotes === 0 ? "Aucune note suspecte" : `${suspectsNotes} prospect(s) a verifier`}
            >
              <Wrench size={14} />
              {repairing ? "Analyse..." : `Reparer notes${suspectsNotes > 0 ? ` (${suspectsNotes})` : ""}`}
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-dopa-cyan/10 text-dopa-cyan rounded-lg text-[13px] font-semibold hover:bg-dopa-cyan/20"
            >
              <Upload size={14} /> Importer CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-dopa-red/10 border border-dopa-red/30 rounded-lg text-[12px] text-dopa-red flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {repairResult && (
          <div className="px-4 py-3 bg-dopa-violet/10 border border-dopa-violet/30 rounded-lg text-[12.5px] text-dopa-violet flex items-center gap-2">
            <Wrench size={14} />
            {repairResult.fixed > 0
              ? `${repairResult.fixed} prospect(s) reparesur ${repairResult.scanned}.`
              : `Aucun statut cache dans les notes (${repairResult.scanned} prospect(s) scannes).`}
          </div>
        )}

        {/* CTA XL SESSION COLD-CALL */}
        <motion.button
          onClick={() => setColdCallMode(true)}
          disabled={aAppeler.length === 0}
          whileHover={aAppeler.length > 0 ? { scale: 1.005, y: -1 } : undefined}
          whileTap={aAppeler.length > 0 ? { scale: 0.995 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="w-full group relative overflow-hidden rounded-2xl border-2 border-dopa-cyan bg-gradient-to-br from-dopa-cyan/15 via-dopa-cyan/5 to-transparent p-6 hover:shadow-[0_0_40px_rgba(34,211,238,0.18)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-dopa-cyan text-black flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                <Phone size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-dopa-cyan mb-1">
                  Mode focus · Zéro distraction
                </p>
                <h2 className="text-[22px] font-bold leading-tight">
                  {aAppeler.length > 0 ? "Démarrer session cold-call" : "Aucun prospect à appeler"}
                </h2>
                <p className="text-[12.5px] text-t-tertiary mt-1">
                  {aAppeler.length > 0
                    ? `${aAppeler.length} prospects en file · boutons XL · raccourcis clavier · auto-advance`
                    : "Importe un CSV pour lancer une session"}
                </p>
              </div>
            </div>
            {aAppeler.length > 0 && (
              <div className="text-right shrink-0">
                <p className="text-[44px] font-black leading-none tabular-nums text-dopa-cyan">
                  {aAppeler.length}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-t-tertiary font-semibold">
                  à appeler
                </p>
              </div>
            )}
          </div>
        </motion.button>

        {/* STATS CRM : 5 mini-cards (stagger) */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
          }}
        >
          <MiniStat icon={<Users size={14} />} label="Total" value={prospects.length} color="#64748b" />
          <MiniStat icon={<Phone size={14} />} label="A appeler" value={aAppeler.length} color="#F97316" highlight />
          <MiniStat icon={<Calendar size={14} />} label="RDV en stock" value={rdvEnStock.length} color="#3B82F6" />
          <MiniStat icon={<Trophy size={14} />} label="Vendus" value={vendus.length} color="#10B981" />
          <MiniStat icon={<Banknote size={14} />} label={`Revenu mois`} value={`${stats.revenuTotal.toLocaleString("fr-FR")}`} suffix="EUR" color="#22d3ee" />
        </motion.div>

        {/* PIPELINE KANBAN */}
        <div className="rounded-2xl border border-surface-3 bg-surface-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-dopa-cyan" />
              <h2 className="text-[14px] font-semibold">Pipeline</h2>
            </div>
            <p className="text-[11px] text-t-tertiary">
              Clique sur une colonne pour filtrer la liste complete.
            </p>
          </div>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
            }}
          >
            {PIPELINE_STATUTS.map((s) => {
              const col = STATUT_COLORS[s];
              const list = byStatut[s];
              return (
                <motion.div
                  key={s}
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.97 },
                    show: { opacity: 1, y: 0, scale: 1 },
                  }}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 360, damping: 24 }}
                >
                <Link
                  href={`/prospects?statut=${s}`}
                  className="group block rounded-xl border p-3 transition-shadow hover:shadow-card-hover"
                  style={{ background: col.bg + "33", borderColor: col.border }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: col.text }}>
                      <span>{STATUT_EMOJI[s]}</span>
                      <span className="truncate">{STATUT_LABEL[s]}</span>
                    </div>
                  </div>
                  <p className="text-[26px] font-black tabular-nums" style={{ color: col.text }}>
                    {list.length}
                  </p>
                  <div className="mt-2 space-y-1 min-h-[34px]">
                    {list.slice(0, 2).map((p) => (
                      <p key={p.id} className="text-[11px] text-t-secondary truncate">
                        {p.entreprise}
                      </p>
                    ))}
                    {list.length > 2 && (
                      <p className="text-[10px] text-t-tertiary">+ {list.length - 2}</p>
                    )}
                    {list.length === 0 && (
                      <p className="text-[10.5px] text-t-tertiary italic">vide</p>
                    )}
                  </div>
                </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* 2 PANELS : PROCHAINS A APPELER + PROCHAINS RDV */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left : prochains a appeler */}
          <div className="rounded-2xl border border-surface-3 bg-surface-1 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-dopa-orange" />
                <h3 className="text-[13.5px] font-semibold">A appeler en priorite</h3>
              </div>
              {aAppeler.length > 6 && (
                <Link href="/prospects?statut=A_APPELER" className="text-[11px] text-t-tertiary hover:text-dopa-cyan inline-flex items-center gap-0.5">
                  Voir les {aAppeler.length} <ChevronRight size={11} />
                </Link>
              )}
            </div>
            {aAppelerTop.length === 0 ? (
              <p className="text-[12.5px] text-t-tertiary italic py-4">Aucun prospect a appeler. Importe un CSV ou ajoutes-en.</p>
            ) : (
              <ul className="space-y-1">
                {aAppelerTop.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/prospects/${p.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-t-primary truncate">{p.entreprise}</p>
                        {p.telephone && (
                          <p className="text-[11px] text-t-tertiary tabular-nums">{p.telephone}</p>
                        )}
                      </div>
                      <StatutBadge statut={p.statut} compact />
                      <ChevronRight size={13} className="text-t-tertiary group-hover:text-t-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right : prochains RDV */}
          <div className="rounded-2xl border border-surface-3 bg-surface-1 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-dopa-cyan" />
                <h3 className="text-[13.5px] font-semibold">Prochains RDV</h3>
              </div>
            </div>
            {prochainsRdv.length === 0 ? (
              <p className="text-[12.5px] text-t-tertiary italic py-4">Aucun RDV en stock. Decroche, propose, book.</p>
            ) : (
              <ul className="space-y-1">
                {prochainsRdv.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/prospects/${p.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-t-primary truncate">{p.entreprise}</p>
                        <p className="text-[11px] text-dopa-cyan tabular-nums font-semibold">
                          {new Date(p.date_rdv!).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <StatutBadge statut={p.statut} compact />
                      <ChevronRight size={13} className="text-t-tertiary group-hover:text-t-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {prospects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-surface-3 bg-surface-1/50 p-12 text-center">
            <div className="text-[42px] mb-3">@_@</div>
            <p className="text-[14px] font-semibold mb-1">Ton CRM est vide</p>
            <p className="text-[12.5px] text-t-tertiary mb-4">
              Importe ton CSV existant ou ajoute ton premier prospect.
            </p>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-dopa-cyan text-black rounded-lg text-[13px] font-semibold hover:bg-dopa-cyan/90"
            >
              <Upload size={14} /> Importer mon CSV
            </button>
          </div>
        )}
      </div>

      {showImport && <ImportCsvModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

function MiniStat({
  icon, label, value, color, suffix, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 360, damping: 26 } },
      }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className={`rounded-xl border p-4 ${highlight ? "ring-1 ring-dopa-orange/30" : ""}`}
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        borderColor: `${color}33`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <p className="text-[10px] uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className="text-[22px] font-black tabular-nums tracking-tight flex items-baseline gap-1" style={{ color }}>
        {value}
        {suffix && <span className="text-[11px] font-semibold text-t-tertiary">{suffix}</span>}
      </p>
    </motion.div>
  );
}
