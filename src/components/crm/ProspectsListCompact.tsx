"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Upload, MapPin, Plus, Loader2, Calendar,
  AlertTriangle, ArrowLeft, Archive, Trash2, Check, X, RotateCcw,
  List as ListIcon, LayoutGrid, Columns3, Filter, ArrowUpDown,
  ExternalLink, Sparkles, Clock, ListChecks,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { useAppStore } from "@/store/useAppStore";
import { STATUTS_ORDRE, STATUT_LABEL, STATUT_EMOJI, STATUT_COLORS } from "@/lib/crmLabels";
import type { StatutProspect, Prospect } from "@/lib/crmTypes";
import ImportCsvModal from "./ImportCsvModal";

export type ViewMode = "list" | "cards" | "kanban";
type SortMode = "recent" | "alpha" | "priority" | "calls";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  isSplit: boolean;
};

const PIPELINE_STATUTS: StatutProspect[] = [
  "A_APPELER", "REPONDEUR", "RDV_BOOKE", "MAQUETTE_PRETE", "R1_EFFECTUE", "VENDU",
];

// Ordre de priorité d'action pour le tri "priorité"
const PRIORITY_ORDER: Record<StatutProspect, number> = {
  RDV_BOOKE: 0,
  MAQUETTE_PRETE: 1,
  R1_EFFECTUE: 2,
  REPONDEUR: 3,
  A_APPELER: 4,
  VENDU: 5,
  REFUS: 6,
  EXISTE_PAS: 7,
  PERDU: 8,
};

export default function ProspectsListCompact({
  selectedId, onSelect, view, onViewChange, isSplit,
}: Props) {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const error = useCrmStore((s) => s.error);
  const prospects = useCrmStore((s) => s.prospects);
  const calls = useCrmStore((s) => s.calls);
  const loadAll = useCrmStore((s) => s.loadAll);
  const createProspect = useCrmStore((s) => s.createProspect);
  const updateProspect = useCrmStore((s) => s.updateProspect);
  const bulkUpdateProspects = useCrmStore((s) => s.bulkUpdateProspects);
  const bulkDeleteProspects = useCrmStore((s) => s.bulkDeleteProspects);

  const searchParams = useSearchParams();
  const initialStatut = searchParams.get("statut");
  const initialNiche = searchParams.get("niche");

  const [query, setQuery] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutProspect | "ALL" | "ACTIFS" | "ARCHIVES" | "JAMAIS_APPELES" | "A_RAPPELER">(
    (initialStatut as StatutProspect) || "ACTIFS"
  );
  const [filterNiche, setFilterNiche] = useState<string>(initialNiche || "ALL");
  const [sort, setSort] = useState<SortMode>("priority");
  const [showImport, setShowImport] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [dragOverStatut, setDragOverStatut] = useState<StatutProspect | null>(null);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  const callsByProspect = useMemo(() => {
    const map = new Map<string, typeof calls>();
    for (const c of calls) {
      const arr = map.get(c.prospect_id) || [];
      arr.push(c);
      map.set(c.prospect_id, arr);
    }
    return map;
  }, [calls]);

  const callCountFor = (id: string) => callsByProspect.get(id)?.length || 0;
  const lastCallFor = (id: string) => {
    const arr = callsByProspect.get(id);
    return arr && arr.length > 0 ? arr[0].date : null;
  };

  // Tâches liées aux prospects (matching par entreprise dans text/description)
  const allTasks = useAppStore((s) => s.tasks);
  const tasksByProspect = useMemo(() => {
    const map = new Map<string, number>();
    if (!allTasks?.length || !prospects?.length) return map;
    for (const p of prospects) {
      const needle = p.entreprise.trim().toLowerCase();
      if (needle.length < 2) continue;
      let count = 0;
      for (const t of allTasks) {
        if (t.status === "done" || t.status === "completed") continue;
        const hay = `${t.text || ""} ${t.description || ""}`.toLowerCase();
        if (hay.includes(needle)) count++;
      }
      if (count > 0) map.set(p.id, count);
    }
    return map;
  }, [allTasks, prospects]);
  const taskCountFor = (id: string) => tasksByProspect.get(id) || 0;

  const niches = useMemo(() => {
    const set = new Set<string>();
    for (const p of prospects) if (p.niche) set.add(p.niche);
    return Array.from(set).sort();
  }, [prospects]);

  const filtered = useMemo(() => {
    let arr = prospects;
    if (filterStatut === "ACTIFS") arr = arr.filter((p) => !p.archived);
    else if (filterStatut === "ARCHIVES") arr = arr.filter((p) => p.archived);
    else if (filterStatut === "JAMAIS_APPELES") arr = arr.filter((p) => !p.archived && callCountFor(p.id) === 0);
    else if (filterStatut === "A_RAPPELER") arr = arr.filter((p) => !p.archived && p.statut === "REPONDEUR");
    else if (filterStatut !== "ALL") arr = arr.filter((p) => p.statut === filterStatut);

    if (filterNiche !== "ALL") {
      if (filterNiche === "__NONE__") arr = arr.filter((p) => !p.niche);
      else arr = arr.filter((p) => p.niche === filterNiche);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((p) =>
        [p.entreprise, p.telephone, p.notes, p.feedback, p.gmb_url, p.niche]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q))
      );
    }

    // Tri
    const sorted = [...arr];
    if (sort === "alpha") {
      sorted.sort((a, b) => a.entreprise.localeCompare(b.entreprise, "fr"));
    } else if (sort === "recent") {
      sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    } else if (sort === "calls") {
      sorted.sort((a, b) => callCountFor(b.id) - callCountFor(a.id));
    } else {
      // priority : statut puis date
      sorted.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.statut];
        const pb = PRIORITY_ORDER[b.statut];
        if (pa !== pb) return pa - pb;
        return a.created_at < b.created_at ? 1 : -1;
      });
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospects, query, filterStatut, filterNiche, callsByProspect, sort]);

  const onQuickCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createProspect({ entreprise: newName.trim() });
    setNewName("");
    setCreating(false);
    if (created) onSelect(created.id);
  };

  const onChangeStatut = async (id: string, statut: StatutProspect) => {
    await updateProspect(id, { statut });
  };

  // Selection
  const allSelectedInView = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelectedInView = filtered.some((p) => selected.has(p.id));
  const toggleSelectAll = () => {
    if (allSelectedInView) {
      const next = new Set(selected);
      for (const p of filtered) next.delete(p.id);
      setSelected(next);
    } else {
      const next = new Set(selected);
      for (const p of filtered) next.add(p.id);
      setSelected(next);
    }
  };
  const toggleSelectOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const clearSelection = () => setSelected(new Set());

  const doBulkArchive = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Archiver ${selected.size} prospect(s) ?`)) return;
    setBulkBusy(true);
    const n = await bulkUpdateProspects(Array.from(selected), { archived: true });
    setBulkBusy(false);
    setFlash(`${n} archivé(s)`);
    setTimeout(() => setFlash(null), 2500);
    clearSelection();
  };
  const doBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`SUPPRIMER ${selected.size} prospect(s) ?`)) return;
    setBulkBusy(true);
    const n = await bulkDeleteProspects(Array.from(selected));
    setBulkBusy(false);
    setFlash(`${n} supprimé(s)`);
    setTimeout(() => setFlash(null), 2500);
    clearSelection();
  };

  const counts = useMemo(() => ({
    actifs: prospects.filter((p) => !p.archived).length,
    archived: prospects.filter((p) => p.archived).length,
    aAppeler: prospects.filter((p) => !p.archived && p.statut === "A_APPELER").length,
    aRappeler: prospects.filter((p) => !p.archived && p.statut === "REPONDEUR").length,
    rdv: prospects.filter((p) => !p.archived && p.statut === "RDV_BOOKE").length,
    vendus: prospects.filter((p) => p.statut === "VENDU").length,
    jamais: prospects.filter((p) => !p.archived && callCountFor(p.id) === 0).length,
  }), [prospects, callsByProspect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag-drop kanban
  const onDragStartProspect = (e: React.DragEvent, p: Prospect) => {
    e.dataTransfer.setData("text/prospect-id", p.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDropOnColumn = async (e: React.DragEvent, statut: StatutProspect) => {
    e.preventDefault();
    setDragOverStatut(null);
    const id = e.dataTransfer.getData("text/prospect-id");
    if (!id) return;
    const p = prospects.find((x) => x.id === id);
    if (!p || p.statut === statut) return;
    await updateProspect(id, { statut });
    setFlash(`${p.entreprise} → ${STATUT_LABEL[statut]}`);
    setTimeout(() => setFlash(null), 2200);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">

      {/* HEADER */}
      <div className="px-4 pt-4 pb-3 border-b border-surface-3 bg-gradient-to-b from-surface-1/40 to-transparent">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/crm"
              className="text-t-tertiary hover:text-t-primary inline-flex items-center gap-1 text-[11px] shrink-0"
            >
              <ArrowLeft size={12} /> CRM
            </Link>
            <div className="min-w-0">
              <h1 className="text-[19px] font-bold tracking-tight leading-none">Prospects</h1>
              <p className="text-[10.5px] text-t-tertiary mt-1 truncate">
                <span className="text-t-secondary font-semibold tabular-nums">{filtered.length}</span> affichés ·{" "}
                <span className="tabular-nums">{counts.actifs}</span> actifs ·{" "}
                <span className="tabular-nums">{counts.vendus}</span> vendus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View switcher */}
            <div className="inline-flex items-center bg-surface-2 border border-surface-3 rounded-lg p-0.5">
              <ViewBtn active={view === "list"} onClick={() => onViewChange("list")} icon={<ListIcon size={12} />} label="Liste" />
              <ViewBtn active={view === "cards"} onClick={() => onViewChange("cards")} icon={<LayoutGrid size={12} />} label="Cartes" />
              <ViewBtn active={view === "kanban"} onClick={() => onViewChange("kanban")} icon={<Columns3 size={12} />} label="Pipeline" />
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-dopa-cyan/10 text-dopa-cyan rounded-lg text-[11.5px] font-semibold hover:bg-dopa-cyan/20"
            >
              <Upload size={12} />
              {!isSplit && <span>Importer</span>}
            </button>
          </div>
        </div>

        {/* Onglets rapides — couleur du statut */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <QuickTab active={filterStatut === "ACTIFS"} onClick={() => setFilterStatut("ACTIFS")} count={counts.actifs}>Actifs</QuickTab>
          <QuickTab active={filterStatut === "JAMAIS_APPELES"} onClick={() => setFilterStatut("JAMAIS_APPELES")} count={counts.jamais} color="#a78bfa">Jamais</QuickTab>
          <QuickTab active={filterStatut === "A_APPELER"} onClick={() => setFilterStatut("A_APPELER")} count={counts.aAppeler} color="#F97316">À appeler</QuickTab>
          <QuickTab active={filterStatut === "A_RAPPELER"} onClick={() => setFilterStatut("A_RAPPELER")} count={counts.aRappeler} color="#fbbf24">À rappeler</QuickTab>
          <QuickTab active={filterStatut === "RDV_BOOKE"} onClick={() => setFilterStatut("RDV_BOOKE")} count={counts.rdv} color="#3B82F6">RDV</QuickTab>
          <QuickTab active={filterStatut === "VENDU"} onClick={() => setFilterStatut("VENDU")} count={counts.vendus} color="#10B981">Vendus</QuickTab>
          <QuickTab active={filterStatut === "ARCHIVES"} onClick={() => setFilterStatut("ARCHIVES")} count={counts.archived}>Archivés</QuickTab>
        </div>

        {/* Search + Niche + Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher entreprise, tél, notes…"
              className="w-full pl-7 pr-2 py-1.5 bg-surface-2 border border-surface-3 rounded-md text-[12px] placeholder-t-tertiary focus:outline-none focus:border-dopa-cyan/50"
            />
          </div>
          {niches.length > 0 && (
            <div className="relative">
              <Filter size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-t-tertiary pointer-events-none" />
              <select
                value={filterNiche}
                onChange={(e) => setFilterNiche(e.target.value)}
                className="pl-7 pr-2 py-1.5 bg-surface-2 border border-surface-3 rounded-md text-[11.5px] focus:outline-none focus:border-dopa-cyan/50 cursor-pointer"
              >
                <option value="ALL">Toutes niches</option>
                <option value="__NONE__">Sans niche</option>
                {niches.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          <div className="relative">
            <ArrowUpDown size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-t-tertiary pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="pl-7 pr-2 py-1.5 bg-surface-2 border border-surface-3 rounded-md text-[11.5px] focus:outline-none focus:border-dopa-cyan/50 cursor-pointer"
              title="Tri"
            >
              <option value="priority">Priorité</option>
              <option value="recent">Plus récents</option>
              <option value="alpha">A → Z</option>
              <option value="calls">Nb appels</option>
            </select>
          </div>
        </div>

        {/* Quick add */}
        <div className="flex items-center gap-2 mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onQuickCreate()}
            placeholder="+ Ajouter un prospect rapide…"
            className="flex-1 px-2.5 py-1.5 bg-surface-2 border border-surface-3 rounded-md text-[12px] placeholder-t-tertiary focus:outline-none focus:border-dopa-green/50"
          />
          <button
            onClick={onQuickCreate}
            disabled={creating || !newName.trim()}
            className="inline-flex items-center justify-center w-7 h-7 bg-dopa-green/15 text-dopa-green rounded-md hover:bg-dopa-green/25 disabled:opacity-40"
          >
            {creating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={13} />}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="px-3 py-2 bg-dopa-cyan/10 border-b border-dopa-cyan/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11.5px] font-semibold text-dopa-cyan inline-flex items-center gap-1.5">
            <Check size={12} />
            {selected.size} sélectionné(s)
            <button onClick={clearSelection} className="ml-1 text-t-tertiary hover:text-t-primary inline-flex items-center gap-0.5 text-[10px]">
              <X size={10} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={doBulkArchive}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1 px-2 py-1 bg-dopa-orange/15 text-dopa-orange rounded-md text-[10.5px] font-semibold hover:bg-dopa-orange/25"
            >
              <Archive size={11} /> Archiver
            </button>
            <button
              onClick={doBulkDelete}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1 px-2 py-1 bg-dopa-red/15 text-dopa-red rounded-md text-[10.5px] font-semibold hover:bg-dopa-red/25"
            >
              <Trash2 size={11} /> Supp.
            </button>
          </div>
        </div>
      )}

      {flash && (
        <div className="px-3 py-1.5 bg-dopa-green/10 border-b border-dopa-green/30 text-[11.5px] text-dopa-green font-semibold animate-fade-in">
          ✓ {flash}
        </div>
      )}

      {error && (
        <div className="mx-3 mt-2 px-3 py-2 bg-dopa-red/10 border border-dopa-red/30 rounded-md text-[11px] text-dopa-red flex items-center gap-1.5">
          <AlertTriangle size={11} /> {error}
        </div>
      )}

      {/* CONTENU SELON VUE */}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex items-center justify-center h-32 text-t-tertiary gap-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[12px]">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasProspects={prospects.length > 0}
            onImport={() => setShowImport(true)}
          />
        ) : view === "kanban" ? (
          <KanbanView
            prospects={filtered}
            byStatut={groupByStatut(filtered)}
            onSelect={onSelect}
            onDragStart={onDragStartProspect}
            onDrop={onDropOnColumn}
            dragOverStatut={dragOverStatut}
            setDragOverStatut={setDragOverStatut}
            callCountFor={callCountFor}
            taskCountFor={taskCountFor}
          />
        ) : view === "cards" ? (
          <CardsView
            prospects={filtered}
            onSelect={onSelect}
            onChangeStatut={onChangeStatut}
            callCountFor={callCountFor}
            lastCallFor={lastCallFor}
            taskCountFor={taskCountFor}
          />
        ) : (
          <ListView
            prospects={filtered}
            selectedId={selectedId}
            selected={selected}
            onSelect={onSelect}
            toggleSelectOne={toggleSelectOne}
            onChangeStatut={onChangeStatut}
            callCountFor={callCountFor}
            lastCallFor={lastCallFor}
            taskCountFor={taskCountFor}
            allSelectedInView={allSelectedInView}
            someSelectedInView={someSelectedInView}
            toggleSelectAll={toggleSelectAll}
            onUpdateValue={(id, field, value) => updateProspect(id, { [field]: value })}
          />
        )}
      </div>

      {showImport && <ImportCsvModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ============================================================
// VUE LISTE — hiérarchie forte, sans tel, GMB en bouton XL
// ============================================================
function ListView({
  prospects, selectedId, selected, onSelect, toggleSelectOne,
  onChangeStatut, callCountFor, lastCallFor, taskCountFor,
  allSelectedInView, someSelectedInView, toggleSelectAll, onUpdateValue,
}: {
  prospects: Prospect[];
  selectedId: string | null;
  selected: Set<string>;
  onSelect: (id: string) => void;
  toggleSelectOne: (id: string) => void;
  onChangeStatut: (id: string, s: StatutProspect) => void;
  callCountFor: (id: string) => number;
  lastCallFor: (id: string) => string | null;
  taskCountFor: (id: string) => number;
  allSelectedInView: boolean;
  someSelectedInView: boolean;
  toggleSelectAll: () => void;
  onUpdateValue: (id: string, field: keyof Prospect, value: string) => void;
}) {
  return (
    <div className="w-full min-w-[900px] pb-10">
      {/* Header du tableau */}
      <div className="grid grid-cols-[auto_2fr_1fr_2fr_1.5fr] gap-4 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-primary)] sticky top-0 bg-background/90 backdrop-blur z-10">
        <div className="flex items-center gap-3 w-[40px]">
          {prospects.length > 0 && (
            <input
              type="checkbox"
              checked={allSelectedInView}
              ref={(el) => { if (el) el.indeterminate = !allSelectedInView && someSelectedInView; }}
              onChange={toggleSelectAll}
              className="accent-[var(--accent-blue)] cursor-pointer"
            />
          )}
        </div>
        <div>Entreprise & Niche</div>
        <div>Téléphone</div>
        <div>Notes de prospection</div>
        <div>Statut</div>
      </div>

      <AnimatePresence initial={false}>
        {prospects.map((p, idx) => {
          const isSel = selected.has(p.id);
          const isActive = selectedId === p.id;
          const c = STATUT_COLORS[p.statut];
          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
              onClick={() => onSelect(p.id)}
              className={`group grid grid-cols-[auto_2fr_1fr_2fr_1.5fr] gap-4 px-5 py-4 items-center border-b border-[var(--border-secondary)] transition-all cursor-pointer ${
                isActive ? "bg-[var(--accent-blue-light)]" : isSel ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"
              } ${p.archived ? "opacity-40" : ""}`}
            >
              {/* Checkbox */}
              <div className="flex items-center w-[40px]" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggleSelectOne(p.id)}
                  className="accent-[var(--accent-blue)] cursor-pointer"
                />
              </div>

              {/* Entreprise & Niche */}
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]" aria-hidden>{STATUT_EMOJI[p.statut]}</span>
                  <input
                    value={p.entreprise}
                    onChange={(e) => onUpdateValue(p.id, "entreprise", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Nom de l'entreprise"
                    className="flex-1 bg-transparent text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] rounded px-1 -ml-1 transition-all"
                  />
                </div>
                <div className="mt-1 flex items-center gap-1.5 ml-6">
                  <input
                    value={p.niche || ""}
                    onChange={(e) => onUpdateValue(p.id, "niche", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="+ Ajouter niche"
                    className="text-[11px] bg-[var(--surface-2)] text-[var(--text-tertiary)] px-2 py-0.5 rounded focus:outline-none focus:bg-[var(--surface-3)] focus:text-[var(--text-primary)] transition-all w-24"
                  />
                  {p.gmb_url && (
                    <a
                      href={p.gmb_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline"
                    >
                      GMB
                    </a>
                  )}
                </div>
              </div>

              {/* Téléphone */}
              <div className="min-w-0 pr-4">
                <input
                  value={p.telephone || ""}
                  onChange={(e) => onUpdateValue(p.id, "telephone", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="---"
                  className="w-full bg-transparent text-[13px] font-medium text-[var(--text-secondary)] tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] rounded px-2 py-1 -ml-2 transition-all hover:bg-[var(--surface-3)]"
                />
              </div>

              {/* Notes */}
              <div className="min-w-0 pr-4">
                <input
                  value={p.notes || ""}
                  onChange={(e) => onUpdateValue(p.id, "notes", e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Ajouter une note rapide..."
                  className="w-full bg-transparent text-[12.5px] italic text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] focus:not-italic focus:text-[var(--text-primary)] rounded px-2 py-1 -ml-2 transition-all hover:bg-[var(--surface-3)] truncate"
                />
              </div>

              {/* Statut */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <select
                  value={p.statut}
                  onChange={(e) => onChangeStatut(p.id, e.target.value as StatutProspect)}
                  className="text-[12px] font-bold bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-[var(--accent-blue)] shadow-sm max-w-full"
                  style={{ color: c.text }}
                >
                  {STATUTS_ORDRE.map((s) => (
                    <option key={s} value={s}>{STATUT_EMOJI[s]} {STATUT_LABEL[s]}</option>
                  ))}
                </select>
              </div>

            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// VUE CARTES — grille visuelle pour scan rapide
// ============================================================
function CardsView({
  prospects, onSelect, onChangeStatut, callCountFor, lastCallFor, taskCountFor,
}: {
  prospects: Prospect[];
  onSelect: (id: string) => void;
  onChangeStatut: (id: string, s: StatutProspect) => void;
  callCountFor: (id: string) => number;
  lastCallFor: (id: string) => string | null;
  taskCountFor: (id: string) => number;
}) {
  return (
    <motion.div
      className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.025, delayChildren: 0.04 } },
      }}
    >
      <AnimatePresence initial={false}>
        {prospects.map((p) => {
          const c = STATUT_COLORS[p.statut];
          const nbCalls = callCountFor(p.id);
          const nbTasks = taskCountFor(p.id);
          const last = lastCallFor(p.id);
          return (
            <motion.div
              key={p.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.985 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              exit={{ opacity: 0, scale: 0.96 }}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`group relative rounded-xl border bg-surface-1 hover:bg-surface-2/60 hover:shadow-card-hover overflow-hidden ${
                p.archived ? "opacity-50" : ""
              }`}
              style={{ borderColor: c.border }}
            >
              <div className="h-1.5" style={{ background: c.text }} />
              <button
                onClick={() => onSelect(p.id)}
                className="block w-full text-left p-3.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[14px]" aria-hidden>{STATUT_EMOJI[p.statut]}</span>
                      <span
                        className="text-[9.5px] font-bold uppercase tracking-wider"
                        style={{ color: c.text }}
                      >
                        {STATUT_LABEL[p.statut].split(" ")[0]}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-t-primary leading-tight line-clamp-2">
                      {p.entreprise}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] text-t-tertiary mb-3">
                  {nbCalls > 0 ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-2 font-bold">
                      <RotateCcw size={9} />{nbCalls} appel{nbCalls > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-dopa-violet/15 text-dopa-violet font-bold">
                      <Sparkles size={9} />Jamais touché
                    </span>
                  )}
                  {nbTasks > 0 && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-dopa-violet/15 text-dopa-violet font-bold"
                      title={`${nbTasks} tâche(s) liée(s)`}
                    >
                      <ListChecks size={9} />{nbTasks}
                    </span>
                  )}
                  {last && (
                    <span className="inline-flex items-center gap-0.5">
                      <Clock size={9} />{relativeDate(last)}
                    </span>
                  )}
                  {p.niche && (
                    <span className="px-1.5 py-0.5 rounded bg-surface-2 truncate max-w-[100px]">
                      {p.niche}
                    </span>
                  )}
                </div>

                {p.date_rdv && (
                  <div className="px-2 py-1.5 rounded-md bg-dopa-cyan/10 border border-dopa-cyan/20 text-[11px] text-dopa-cyan font-semibold inline-flex items-center gap-1 mb-2">
                    <Calendar size={11} />
                    RDV {shortDate(p.date_rdv)}
                  </div>
                )}

                {p.notes && (
                  <p className="text-[11px] text-t-tertiary line-clamp-2 italic">
                    {p.notes}
                  </p>
                )}
              </button>

              {/* Quick actions : GMB en gros */}
              <div className="flex items-center gap-1.5 px-3 pb-3 border-t border-surface-3/50 pt-2.5">
                {p.gmb_url ? (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                    href={p.gmb_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-dopa-cyan text-black rounded-md text-[12px] font-bold hover:brightness-110 shadow-sm shadow-dopa-cyan/20"
                  >
                    <MapPin size={13} strokeWidth={2.5} />
                    Ouvrir GMB
                  </motion.a>
                ) : (
                  <span className="flex-1 px-2 py-2 text-[11px] text-t-tertiary text-center italic bg-surface-2 rounded-md">
                    Pas de fiche GMB
                  </span>
                )}
                {p.site_url && (
                  <a
                    href={p.site_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center w-9 h-9 bg-surface-2 text-t-secondary rounded-md hover:bg-surface-3"
                    title="Site web"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
                <select
                  value={p.statut}
                  onChange={(e) => onChangeStatut(p.id, e.target.value as StatutProspect)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] bg-surface-2 border border-surface-3 rounded-md px-1.5 py-1.5 cursor-pointer focus:outline-none focus:border-dopa-cyan/50 max-w-[60px]"
                  title="Statut"
                >
                  {STATUTS_ORDRE.map((s) => (
                    <option key={s} value={s}>{STATUT_EMOJI[s]}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// VUE KANBAN — colonnes drag-droppable par statut
// ============================================================
function KanbanView({
  byStatut, onSelect, onDragStart, onDrop, dragOverStatut, setDragOverStatut, callCountFor, taskCountFor,
}: {
  prospects: Prospect[];
  byStatut: Record<StatutProspect, Prospect[]>;
  onSelect: (id: string) => void;
  onDragStart: (e: any, p: Prospect) => void;
  onDrop: (e: any, statut: StatutProspect) => Promise<void>;
  dragOverStatut: StatutProspect | null;
  setDragOverStatut: (s: StatutProspect | null) => void;
  callCountFor: (id: string) => number;
  taskCountFor: (id: string) => number;
}) {
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden p-3">
      <div className="flex gap-3 h-full min-w-max pb-2">
        {PIPELINE_STATUTS.map((s, colIdx) => {
          const c = STATUT_COLORS[s];
          const list = byStatut[s] || [];
          const isDragOver = dragOverStatut === s;
          return (
            <motion.div
              key={s}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIdx * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onDragOver={(e) => { e.preventDefault(); setDragOverStatut(s); }}
              onDragLeave={() => setDragOverStatut(null)}
              onDrop={(e) => onDrop(e, s)}
              className={`w-[280px] shrink-0 rounded-xl border flex flex-col transition-all ${
                isDragOver ? "ring-2 ring-dopa-cyan scale-[1.01] shadow-glow-cyan" : ""
              }`}
              style={{
                borderColor: c.border,
                background: `linear-gradient(180deg, ${c.bg}55 0%, transparent 100%)`,
              }}
            >
              <div
                className="px-3 py-2.5 border-b flex items-center justify-between sticky top-0 backdrop-blur z-10"
                style={{ borderColor: c.border, background: `${c.bg}aa` }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[14px]">{STATUT_EMOJI[s]}</span>
                  <span
                    className="text-[10.5px] font-bold uppercase tracking-wider truncate"
                    style={{ color: c.text }}
                  >
                    {STATUT_LABEL[s]}
                  </span>
                </div>
                <motion.span
                  layout
                  className="text-[11px] font-black tabular-nums px-1.5 py-0.5 rounded"
                  style={{ color: c.text, background: `${c.text}22` }}
                >
                  {list.length}
                </motion.span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
                {list.length === 0 ? (
                  <p className="text-[11px] text-t-tertiary italic text-center py-6">
                    {isDragOver ? "Lâche ici ↓" : "Vide"}
                  </p>
                ) : (
                  list.map((p) => {
                      const nb = callCountFor(p.id);
                      const nbTasks = taskCountFor(p.id);
                      return (
                        <motion.div
                          key={p.id}
                          layout="position"
                          layoutId={`kanban-${p.id}`}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          draggable
                          onDragStart={(e) => onDragStart(e, p)}
                          onClick={() => onSelect(p.id)}
                          className="rounded-lg bg-surface-1 border border-surface-3 p-2.5 cursor-grab active:cursor-grabbing hover:border-dopa-cyan/40 hover:bg-surface-2/60 transition-colors"
                        >
                          <p className="text-[12.5px] font-bold text-t-primary truncate leading-tight mb-1">
                            {p.entreprise}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9.5px] text-t-tertiary flex-wrap">
                            {nb > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-bold text-t-secondary">
                                <RotateCcw size={8} />{nb}
                              </span>
                            )}
                            {nbTasks > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-bold text-dopa-violet">
                                <ListChecks size={8} />{nbTasks}
                              </span>
                            )}
                            {p.date_rdv && (
                              <span className="inline-flex items-center gap-0.5 text-dopa-cyan font-semibold">
                                <Calendar size={8} />{shortDate(p.date_rdv)}
                              </span>
                            )}
                            {p.niche && (
                              <span className="truncate">{p.niche}</span>
                            )}
                          </div>
                          {p.gmb_url && (
                            <motion.a
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              href={p.gmb_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-dopa-cyan/15 text-dopa-cyan rounded text-[10px] font-bold hover:bg-dopa-cyan/25"
                            >
                              <MapPin size={10} /> GMB
                            </motion.a>
                          )}
                        </motion.div>
                      );
                    })
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// HELPERS UI
// ============================================================
function ViewBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold transition-colors ${
        active
          ? "bg-dopa-cyan text-black"
          : "text-t-tertiary hover:text-t-primary hover:bg-surface-3"
      }`}
    >
      {icon}
    </button>
  );
}

function QuickTab({ active, onClick, count, color, children }: {
  active: boolean; onClick: () => void; count: number; color?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1"
      style={{
        background: active ? (color || "#22d3ee") : "var(--surface-2, #151518)",
        color: active ? "#000" : "var(--text-secondary)",
      }}
    >
      <span>{children}</span>
      <span
        className="tabular-nums text-[9.5px] font-bold px-1 rounded"
        style={{
          background: active ? "rgba(0,0,0,0.18)" : "var(--surface-3, #1a1a1f)",
          color: active ? "#000" : "var(--text-tertiary)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ hasProspects, onImport }: { hasProspects: boolean; onImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-t-tertiary gap-3 px-6 text-center py-12">
      <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center text-[28px]">
        {hasProspects ? "🔍" : "📋"}
      </div>
      <p className="text-[14px] font-semibold text-t-secondary">
        {hasProspects ? "Aucun prospect ne correspond" : "Ton CRM est vide"}
      </p>
      <p className="text-[12px] text-t-tertiary max-w-[280px]">
        {hasProspects
          ? "Change les filtres ou la recherche pour voir d'autres prospects."
          : "Importe ton CSV existant ou crée ton premier prospect ci-dessus."}
      </p>
      {!hasProspects && (
        <button
          onClick={onImport}
          className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-dopa-cyan text-black rounded-lg text-[12.5px] font-bold hover:bg-dopa-cyan/90"
        >
          <Upload size={13} /> Importer un CSV
        </button>
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function groupByStatut(arr: Prospect[]): Record<StatutProspect, Prospect[]> {
  const map: Record<StatutProspect, Prospect[]> = {
    A_APPELER: [], REPONDEUR: [], REFUS: [], EXISTE_PAS: [],
    RDV_BOOKE: [], MAQUETTE_PRETE: [], R1_EFFECTUE: [], VENDU: [], PERDU: [],
  };
  for (const p of arr) map[p.statut].push(p);
  return map;
}

function shortDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function relativeDate(iso: string) {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const day = 1000 * 60 * 60 * 24;
    const days = Math.floor(diffMs / day);
    if (days <= 0) return "auj.";
    if (days === 1) return "hier";
    if (days < 7) return `${days}j`;
    if (days < 30) return `${Math.floor(days / 7)}sem`;
    return `${Math.floor(days / 30)}mo`;
  } catch {
    return "";
  }
}
