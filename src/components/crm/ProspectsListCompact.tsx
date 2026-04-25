"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Upload, MapPin, Plus, Loader2,
  AlertTriangle, ArrowLeft, Archive, Trash2, Check, X, RotateCcw,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { STATUTS_ORDRE, STATUT_LABEL, STATUT_EMOJI } from "@/lib/crmLabels";
import type { StatutProspect } from "@/lib/crmTypes";
import StatutBadge from "./StatutBadge";
import ImportCsvModal from "./ImportCsvModal";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function ProspectsListCompact({ selectedId, onSelect }: Props) {
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
  const [showImport, setShowImport] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

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
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospects, query, filterStatut, filterNiche, callsByProspect]);

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

  // Selection helpers
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

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* HEADER COMPACT */}
      <div className="px-4 pt-4 pb-3 border-b border-surface-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/crm"
              className="text-t-tertiary hover:text-t-primary inline-flex items-center gap-1 text-[11px]"
            >
              <ArrowLeft size={12} /> CRM
            </Link>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight leading-none">Prospects</h1>
              <p className="text-[10.5px] text-t-tertiary mt-1">
                {filtered.length} affichés · {counts.actifs} actifs
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-dopa-cyan/10 text-dopa-cyan rounded-lg text-[11.5px] font-semibold hover:bg-dopa-cyan/20"
          >
            <Upload size={12} />
            Importer
          </button>
        </div>

        {/* Onglets rapides */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <QuickTab active={filterStatut === "ACTIFS"} onClick={() => setFilterStatut("ACTIFS")}>Actifs ({counts.actifs})</QuickTab>
          <QuickTab active={filterStatut === "JAMAIS_APPELES"} onClick={() => setFilterStatut("JAMAIS_APPELES")}>Jamais ({counts.jamais})</QuickTab>
          <QuickTab active={filterStatut === "A_APPELER"} onClick={() => setFilterStatut("A_APPELER")}>À appeler ({counts.aAppeler})</QuickTab>
          <QuickTab active={filterStatut === "A_RAPPELER"} onClick={() => setFilterStatut("A_RAPPELER")}>À rappeler ({counts.aRappeler})</QuickTab>
          <QuickTab active={filterStatut === "RDV_BOOKE"} onClick={() => setFilterStatut("RDV_BOOKE")}>RDV ({counts.rdv})</QuickTab>
          <QuickTab active={filterStatut === "VENDU"} onClick={() => setFilterStatut("VENDU")}>Vendus ({counts.vendus})</QuickTab>
          <QuickTab active={filterStatut === "ARCHIVES"} onClick={() => setFilterStatut("ARCHIVES")}>Archivés ({counts.archived})</QuickTab>
        </div>

        {/* Search + Niche */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher…"
              className="w-full pl-7 pr-2 py-1.5 bg-surface-2 border border-surface-3 rounded-md text-[12px] placeholder-t-tertiary focus:outline-none focus:border-dopa-cyan/50"
            />
          </div>
          {niches.length > 0 && (
            <select
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="px-2 py-1.5 bg-surface-2 border border-surface-3 rounded-md text-[11.5px] focus:outline-none focus:border-dopa-cyan/50 cursor-pointer"
            >
              <option value="ALL">Toutes niches</option>
              <option value="__NONE__">Sans niche</option>
              {niches.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>

        {/* Quick add */}
        <div className="flex items-center gap-2 mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onQuickCreate()}
            placeholder="+ Nouveau prospect…"
            className="flex-1 px-2.5 py-1.5 bg-surface-2 border border-surface-3 rounded-md text-[12px] placeholder-t-tertiary focus:outline-none focus:border-dopa-green/50"
          />
          <button
            onClick={onQuickCreate}
            disabled={creating || !newName.trim()}
            className="inline-flex items-center justify-center w-7 h-7 bg-dopa-green/10 text-dopa-green rounded-md hover:bg-dopa-green/20 disabled:opacity-40"
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
        <div className="px-3 py-1.5 bg-dopa-green/10 border-b border-dopa-green/30 text-[11.5px] text-dopa-green font-semibold">
          ✓ {flash}
        </div>
      )}

      {error && (
        <div className="mx-3 mt-2 px-3 py-2 bg-dopa-red/10 border border-dopa-red/30 rounded-md text-[11px] text-dopa-red flex items-center gap-1.5">
          <AlertTriangle size={11} /> {error}
        </div>
      )}

      {/* LISTE */}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex items-center justify-center h-32 text-t-tertiary gap-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[12px]">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-t-tertiary gap-2 px-4 text-center">
            <p className="text-[13px]">
              {prospects.length === 0
                ? "Aucun prospect."
                : "Aucun prospect ne correspond aux filtres."}
            </p>
            {prospects.length === 0 && (
              <button
                onClick={() => setShowImport(true)}
                className="mt-2 px-3 py-1.5 bg-dopa-cyan/10 text-dopa-cyan rounded-md text-[12px] font-semibold hover:bg-dopa-cyan/20"
              >
                Importer un CSV
              </button>
            )}
          </div>
        ) : (
          <ul className="py-1">
            {filtered.length > 5 && (
              <li className="px-3 py-1 flex items-center gap-2 border-b border-surface-3/50">
                <input
                  type="checkbox"
                  checked={allSelectedInView}
                  ref={(el) => { if (el) el.indeterminate = !allSelectedInView && someSelectedInView; }}
                  onChange={toggleSelectAll}
                  className="accent-dopa-cyan cursor-pointer"
                />
                <span className="text-[10px] text-t-tertiary uppercase tracking-wider">Tout sélectionner ({filtered.length})</span>
              </li>
            )}
            {filtered.map((p) => {
              const isSel = selected.has(p.id);
              const isActive = selectedId === p.id;
              const nbCalls = callCountFor(p.id);
              return (
                <li
                  key={p.id}
                  className={`group relative border-b border-surface-3/40 transition-colors ${
                    isActive ? "bg-dopa-cyan/10" : isSel ? "bg-dopa-cyan/5" : "hover:bg-surface-2/60"
                  } ${p.archived ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelectOne(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="accent-dopa-cyan cursor-pointer shrink-0"
                    />
                    <button
                      onClick={() => onSelect(p.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-[14px] font-bold text-t-primary truncate leading-tight">
                        {p.entreprise}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatutBadge statut={p.statut} compact />
                        {nbCalls > 0 && (
                          <span
                            className={`inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1 py-0.5 rounded tabular-nums ${
                              nbCalls >= 3
                                ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]"
                                : "bg-surface-2 text-t-secondary"
                            }`}
                            title={`${nbCalls} appel(s)`}
                          >
                            <RotateCcw size={8} />{nbCalls}
                          </span>
                        )}
                        {p.niche && (
                          <span className="text-[9.5px] text-t-tertiary truncate">{p.niche}</span>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.gmb_url && (
                        <a
                          href={p.gmb_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Ouvrir GMB"
                          className="inline-flex items-center justify-center w-7 h-7 bg-dopa-cyan/10 text-dopa-cyan rounded-md hover:bg-dopa-cyan/20"
                        >
                          <MapPin size={12} />
                        </a>
                      )}
                      <select
                        value={p.statut}
                        onChange={(e) => onChangeStatut(p.id, e.target.value as StatutProspect)}
                        onClick={(e) => e.stopPropagation()}
                        title="Changer le statut"
                        className="text-[11px] bg-surface-2 border border-surface-3 rounded-md px-1.5 py-1 cursor-pointer focus:outline-none focus:border-dopa-cyan/50 max-w-[100px]"
                      >
                        {STATUTS_ORDRE.map((s) => (
                          <option key={s} value={s}>{STATUT_EMOJI[s]} {STATUT_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showImport && <ImportCsvModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

function QuickTab({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-dopa-cyan text-black"
          : "bg-surface-2 text-t-secondary hover:bg-surface-3 hover:text-t-primary"
      }`}
    >
      {children}
    </button>
  );
}
