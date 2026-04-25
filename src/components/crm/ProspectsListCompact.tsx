"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Upload, MapPin, Plus, Loader2, Phone, Calendar,
  AlertTriangle, ArrowLeft, Archive, Trash2, Check, X, RotateCcw,
  List as ListIcon, LayoutGrid, Columns3, Filter, ArrowUpDown,
  ExternalLink, Sparkles, Flame, Clock,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
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

        {/* Stats motivantes ribbon (caché si vue list+split pour gagner de la place) */}
        {!isSplit && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
            <StatPill icon={<Phone size={11} />} label="À appeler" value={counts.aAppeler} color="#F97316" pulse={counts.aAppeler > 0} />
            <StatPill icon={<RotateCcw size={11} />} label="À rappeler" value={counts.aRappeler} color="#fbbf24" />
            <StatPill icon={<Calendar size={11} />} label="RDV" value={counts.rdv} color="#3B82F6" />
            <StatPill icon={<Sparkles size={11} />} label="Vendus" value={counts.vendus} color="#10B981" />
            <StatPill icon={<Flame size={11} />} label="Jamais touchés" value={counts.jamais} color="#a78bfa" />
          </div>
        )}

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
     