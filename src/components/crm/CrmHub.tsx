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
import ImportCsvModal from "./ImportCsvModal";
import ColdCallSession from "./ColdCallSession";
import { celebrate } from "@/lib/dopamineFeedback";
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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
  const updateProspect = useCrmStore((s) => s.updateProspect);

  const [showImport, setShowImport] = useState(false);
  const [coldCallMode, setColdCallMode] = useState(false);
  const [activeDragProspectId, setActiveDragProspectId] = useState<string | null>(null);

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

  // Rappels du jour : REPONDEUR avec date_relance <= aujourd'hui ou sans date_relance ET dernier appel > 24h
  const todayStr = new Date().toISOString().slice(0, 10);
  const rappelsDuJour = useMemo(() => {
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const lastCallTs = new Map<string, number>();
    for (const c of calls) {
      const ts = new Date(c.date).getTime();
      const prev = lastCallTs.get(c.prospect_id) ?? 0;
      if (ts > prev) lastCallTs.set(c.prospect_id, ts);
    }
    return actifs.filter((p) => {
      if (p.statut !== "REPONDEUR") return false;
      if (p.date_relance) return p.date_relance <= todayStr;
      return now - (lastCallTs.get(p.id) ?? 0) > H24;
    }).slice(0, 5);
  }, [actifs, calls, todayStr]);

  const aAppeler = useMemo(() => {
    const now = Date.now();
    return actifs.filter((p) => {
      if (p.statut === "A_APPELER") return true;
      if (p.statut === "REPONDEUR") {
        if (p.date_relance) return p.date_relance <= todayStr;
        return true;
      }
      return false;
    });
  }, [actifs, todayStr]);
  const rdvEnStock = useMemo(
    () => actifs.filter((p) => p.statut === "RDV_BOOKE" || p.statut === "MAQUETTE_PRETE" || p.statut === "R1_EFFECTUE"),
    [actifs]
  );
  const vendus = useMemo(() => prospects.filter((p) => p.statut === "VENDU"), [prospects]);

  // Pipeline : par statut
  const byStatut = useMemo(() => {
    const map: Record<StatutProspect, typeof prospects> = {
      A_APPELER: [], REPONDEUR: [], REFUS: [], EXISTE_PAS: [],
      PAS_MA_CIBLE: [], RDV_BOOKE: [], MAQUETTE_PRETE: [], R1_EFFECTUE: [], VENDU: [], PERDU: [],
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

  const handleDragStart = (e: any) => {
    setActiveDragProspectId(e.active.id);
  };

  const handleDragEnd = (e: any) => {
    setActiveDragProspectId(null);
    const { active, over } = e;
    if (over && active.id && PIPELINE_STATUTS.includes(over.id as StatutProspect)) {
      const prospect = prospects.find(p => p.id === active.id);
      if (prospect && prospect.statut !== over.id) {
        updateProspect(active.id, { statut: over.id });
        if (over.id === "VENDU" || over.id === "RDV_BOOKE") celebrate("achievement");
      }
    }
  };

  const activeDragProspect = activeDragProspectId ? prospects.find(p => p.id === activeDragProspectId) : null;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1700px] mx-auto px-10 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight">CRM</h1>
            <p className="text-[12.5px] text-t-tertiary mt-1">
              Vue globale {actifs.length} prospects actifs &middot; {archives.length} archivés
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
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all"
              style={{ background: "var(--accent-cyan-light)", color: "var(--accent-cyan)" }}
            >
              <Upload size={14} /> Importer CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg text-[12px] flex items-center gap-2"
            style={{ background: "var(--accent-red-light)", color: "var(--accent-red)", border: "1px solid color-mix(in srgb, var(--accent-red) 20%, transparent)" }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* CTA XL SESSION COLD-CALL */}
        <motion.button
          onClick={() => setColdCallMode(true)}
          disabled={aAppeler.length === 0}
          whileHover={aAppeler.length > 0 ? { scale: 1.005, y: -1 } : undefined}
          whileTap={aAppeler.length > 0 ? { scale: 0.995 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="w-full group relative overflow-hidden rounded-2xl border-2 p-6 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ 
            borderColor: "var(--accent-cyan)", 
            background: "linear-gradient(135deg, var(--accent-cyan-light) 0%, transparent 100%)",
            boxShadow: "0 0 40px color-mix(in srgb, var(--accent-cyan) 10%, transparent)"
          }}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform"
                style={{ background: "var(--accent-cyan)", color: "var(--surface-0)" }}>
                <Phone size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--accent-cyan)" }}>
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
                <p className="text-[44px] font-black leading-none tabular-nums" style={{ color: "var(--accent-cyan)" }}>
                  {aAppeler.length}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-t-tertiary font-semibold">
                  à appeler
                </p>
              </div>
            )}
          </div>
        </motion.button>

        {/* RAPPELS DU JOUR */}
        {rappelsDuJour.length > 0 && (
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-1)] p-5"
            style={{ borderColor: "color-mix(in srgb, var(--accent-orange) 25%, transparent)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px]">🕐</span>
              <h3 className="text-[13px] font-semibold" style={{ color: "var(--accent-orange)" }}>
                Rappels du jour · {rappelsDuJour.length}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {rappelsDuJour.map((p) => (
                <Link
                  key={p.id}
                  href={`/prospects/${p.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium hover:opacity-80 transition-opacity"
                  style={{
                    background: "color-mix(in srgb, var(--accent-orange) 10%, transparent)",
                    color: "var(--accent-orange)",
                    border: "1px solid color-mix(in srgb, var(--accent-orange) 22%, transparent)",
                  }}
                >
                  {p.entreprise}
                  {p.date_relance && (
                    <span className="text-[10px] opacity-70">
                      · prévu {new Date(p.date_relance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

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
          <MiniStat icon={<Users size={14} />} label="Total" value={actifs.length} color="#64748b" />
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
              <h2 className="text-[14px] font-semibold">Pipeline Kanban</h2>
            </div>
            <p className="text-[11px] text-t-tertiary">
              Glissez et déposez les prospects pour les faire avancer.
            </p>
          </div>
          
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-start">
              {PIPELINE_STATUTS.map((s) => {
                const col = STATUT_COLORS[s];
                const list = byStatut[s];
                return (
                  <DroppableColumn key={s} statut={s} colorInfo={col} list={list} />
                );
              })}
            </div>
            <DragOverlay>
              {activeDragProspect ? (
                <div 
                  className="rounded-lg p-2 shadow-2xl scale-105 border border-surface-3 bg-surface-2"
                  style={{ cursor: 'grabbing' }}
                >
                  <p className="text-[12px] font-bold text-t-primary truncate">{activeDragProspect.entreprise}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
              style={{ background: "var(--accent-cyan)", color: "var(--surface-0)" }}
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

function DroppableColumn({ statut, colorInfo, list }: { statut: StatutProspect, colorInfo: any, list: any[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: statut });
  
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border p-3 flex flex-col h-full min-h-[250px] transition-colors ${isOver ? "ring-2 ring-offset-2 ring-offset-surface-1" : ""}`}
      style={{ 
        background: colorInfo.bg + "22", 
        borderColor: isOver ? colorInfo.text : colorInfo.border,
        boxShadow: isOver ? `0 0 20px ${colorInfo.text}33` : "none"
      }}
    >
      <Link href={`/prospects?statut=${statut}`} className="flex items-center justify-between mb-3 hover:opacity-70 transition-opacity">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: colorInfo.text }}>
          <span>{STATUT_EMOJI[statut]}</span>
          <span className="truncate">{STATUT_LABEL[statut]}</span>
        </div>
        <span className="text-[12px] font-bold bg-black/20 px-1.5 rounded" style={{ color: colorInfo.text }}>
          {list.length}
        </span>
      </Link>
      
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] scrollbar-none pb-2">
        {list.length === 0 && (
          <p className="text-[11px] text-t-tertiary italic text-center mt-4">Glissez ici</p>
        )}
        {list.map((p) => (
          <DraggableProspect key={p.id} prospect={p} colorInfo={colorInfo} />
        ))}
      </div>
    </div>
  );
}

function DraggableProspect({ prospect, colorInfo }: { prospect: any, colorInfo: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: prospect.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor: colorInfo.border }}
      {...listeners}
      {...attributes}
      className={`rounded-lg p-2 border bg-[var(--surface-1)] transition-all cursor-grab active:cursor-grabbing hover:brightness-110 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex justify-between items-start gap-1">
        <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight line-clamp-2">
          {prospect.entreprise}
        </p>
        <Link href={`/prospects/${prospect.id}`} className="shrink-0 p-1 bg-[var(--surface-2)] rounded hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" onClick={(e) => e.stopPropagation()}>
          <ChevronRight size={12} />
        </Link>
      </div>
      {(prospect.telephone || prospect.niche) && (
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1 truncate">
          {prospect.telephone || prospect.niche}
        </p>
      )}
    </div>
  );
}
