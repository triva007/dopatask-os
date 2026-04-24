"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, Filter, Upload, Phone, MapPin, ExternalLink, Plus, Loader2,
  AlertTriangle, ArrowLeft, Archive, Trash2, Check, X, Clock,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { STATUTS_ORDRE, STATUT_LABEL, STATUT_EMOJI } from "@/lib/crmLabels";
import type { StatutProspect } from "@/lib/crmTypes";
import StatutBadge from "./StatutBadge";
import ImportCsvModal from "./ImportCsvModal";

type SortKey = "entreprise" | "statut" | "date_relance" | "created_at" | "last_activity" | "call_count";

function daysSince(iso: string): number {
  const d = new Date(iso).getTime();
  return Math.floor((Date.now() - d) / 86400000);
}

export default function ProspectsTable() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const error = useCrmStore((s) => s.error);
  const prospects = useCrmStore((s) => s.prospects);
  const calls = useCrmStore((s) => s.calls);
  const loadAll = useCrmStore((s) => s.loadAll);
  const createProspect = useCrmStore((s) => s.createProspect);
  const bulkUpdateProspects = useCrmStore((s) => s.bulkUpdateProspects);
  const bulkDeleteProspects = useCrmStore((s) => s.bulkDeleteProspects);

  const searchParams = useSearchParams();
  const initialStatut = searchParams.get("statut");
  const initialNiche = searchParams.get("niche");
  const [query, setQuery] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutProspect | "ALL" | "ACTIFS" | "ARCHIVES" | "JAMAIS_APPELES" | "A_RAPPELER_AUJ">(
    (initialStatut as StatutProspect) || "ACTIFS"
  );
  const [filterNiche, setFilterNiche] = useState<string>(initialNiche || "ALL");
  const [sortKey, setSortKey] = useState<SortKey>("last_activity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showImport, setShowImport] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  // Index : calls par prospect_id
  const callsByProspect = useMemo(() => {
    const map = new Map<string, typeof calls>();
    for (const c of calls) {
      const arr = map.get(c.prospect_id) || [];
      arr.push(c);
      map.set(c.prospect_id, arr);
    }
    return map;
  }, [calls]);

  const lastCallAt = (id: string): string | null => {
    const list = callsByProspect.get(id);
    if (!list || list.length === 0) return null;
    // list est déjà triée desc par date (store)
    return list[0].date;
  };
  const callCountFor = (id: string) => callsByProspect.get(id)?.length || 0;

  // Niches distinctes pour le filtre
  const niches = useMemo(() => {
    const set = new Set<string>();
    for (const p of prospects) if (p.niche) set.add(p.niche);
    return Array.from(set).sort();
  }, [prospects]);

  const filtered = useMemo(() => {
    let arr = prospects;
    // Filtrage par statut (meta-filtres d'abord)
    const today = new Date().toISOString().slice(0, 10);
    if (filterStatut === "ACTIFS") {
      arr = arr.filter((p) => !p.archived);
    } else if (filterStatut === "ARCHIVES") {
      arr = arr.filter((p) => p.archived);
    } else if (filterStatut === "JAMAIS_APPELES") {
      arr = arr.filter((p) => !p.archived && callCountFor(p.id) === 0);
    } else if (filterStatut === "A_RAPPELER_AUJ") {
      arr = arr.filter((p) => !p.archived && p.date_relance && p.date_relance <= today);
    } else if (filterStatut !== "ALL") {
      arr = arr.filter((p) => p.statut === filterStatut);
    }
    // Filtrage par niche
    if (filterNiche !== "ALL") {
      if (filterNiche === "__NONE__") arr = arr.filter((p) => !p.niche);
      else arr = arr.filter((p) => p.niche === filterNiche);
    }
    // Recherche plein texte
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((p) =>
        [p.entreprise, p.telephone, p.notes, p.feedback, p.gmb_url, p.site_url, p.niche]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q))
      );
    }
    // Tri
    arr = [...arr].sort((a, b) => {
      let va: string | number = "", vb: string | number = "";
      switch (sortKey) {
        case "entreprise":
          va = a.entreprise.toLowerCase();
          vb = b.entreprise.toLowerCase();
          break;
        case "statut":
          va = STATUTS_ORDRE.indexOf(a.statut);
          vb = STATUTS_ORDRE.indexOf(b.statut);
          break;
        case "date_relance":
          va = a.date_relance || a.date_rdv || "9999-12-31";
          vb = b.date_relance || b.date_rdv || "9999-12-31";
          break;
        case "created_at":
          va = a.created_at;
          vb = b.created_at;
          break;
        case "last_activity":
          va = lastCallAt(a.id) || a.created_at;
          vb = lastCallAt(b.id) || b.created_at;
          break;
        case "call_count":
          va = callCountFor(a.id);
          vb = callCountFor(b.id);
          break;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospects, query, filterStatut, filterNiche, sortKey, sortDir, callsByProspect]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "entreprise" ? "asc" : "desc");
    }
  };

  const onQuickCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createProspect({ entreprise: newName.trim() });
    setNewName("");
    setCreating(false);
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
    setFlash(`${n} prospect(s) archivé(s)`);
    setTimeout(() => setFlash(null), 2500);
    clearSelection();
  };
  const doBulkUnarchive = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const n = await bulkUpdateProspects(Array.from(selected), { archived: false });
    setBulkBusy(false);
    setFlash(`${n} prospect(s) désarchivé(s)`);
    setTimeout(() => setFlash(null), 2500);
    clearSelection();
  };
  const doBulkStatut = async (statut: StatutProspect) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const n = await bulkUpdateProspects(Array.from(selected), { statut });
    setBulkBusy(false);
    setFlash(`${n} prospect(s) → ${STATUT_LABEL[statut]}`);
    setTimeout(() => setFlash(null), 2500);
    clearSelection();
  };
  const doBulkNiche = async () => {
    if (selected.size === 0) return;
    const nouveauNiche = prompt(`Nouvelle niche pour ${selected.size} prospect(s) ?`, "menuisiers_france");
    if (!nouveauNiche || !nouveauNiche.trim()) return;
    setBulkBusy(true);
    const n = await bulkUpdateProspects(Array.from(selected), { niche: nouveauNiche.trim() });
    setBulkBusy(false);
    setFlash(`${n} prospect(s) → niche "${nouveauNiche.trim()}"`);
    setTimeout(() => setFlash(null), 2500);
    clearSelection();
  };
  const doBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`SUPPRIMER DÉFINITIVEMENT ${selected.size} prospect(s) ? (calls associés supprimés aussi)`)) return;
    setBulkBusy(true);
    const n = await bulkDeleteProspects(Array.from(selected));
    setBulkBusy(false);
    setFlash(`${n} prospect(s) supprimé(s)`);
    setTimeout(() => setFlash(null), 2500);
    clearSelection();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-surface-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/crm"
              className="text-t-tertiary hover:text-t-primary inline-flex items-center gap-1 text-[12px]"
              title="Retour au CRM"
            >
              <ArrowLeft size={14} /> CRM
            </Link>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">Prospects</h1>
              <p className="text-[12px] text-t-tertiary mt-0.5">
                {filtered.length} affichés · {prospects.filter((p) => !p.archived).length} actifs · {prospects.filter((p) => p.archived).length} archivés
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-dopa-cyan/10 text-dopa-cyan rounded-lg text-[13px] font-semibold hover:bg-dopa-cyan/20 transition-colors"
            >
              <Upload size={14} />
              Importer CSV
            </button>
          </div>
        </div>

        {/* Onglets rapides */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <QuickTab active={filterStatut === "ACTIFS"} onClick={() => setFilterStatut("ACTIFS")}>
            Actifs ({prospects.filter((p) => !p.archived).length})
          </QuickTab>
          <QuickTab active={filterStatut === "A_APPELER"} onClick={() => setFilterStatut("A_APPELER")}>
            À appeler ({prospects.filter((p) => !p.archived && p.statut === "A_APPELER").length})
          </QuickTab>
          <QuickTab active={filterStatut === "REPONDEUR"} onClick={() => setFilterStatut("REPONDEUR")}>
            Répondeur ({prospects.filter((p) => !p.archived && p.statut === "REPONDEUR").length})
          </QuickTab>
          <QuickTab active={filterStatut === "JAMAIS_APPELES"} onClick={() => setFilterStatut("JAMAIS_APPELES")}>
            Jamais appelés ({prospects.filter((p) => !p.archived && callCountFor(p.id) === 0).length})
          </QuickTab>
          <QuickTab active={filterStatut === "A_RAPPELER_AUJ"} onClick={() => setFilterStatut("A_RAPPELER_AUJ")}>
            À rappeler auj. ({prospects.filter((p) => { const t = new Date().toISOString().slice(0,10); return !p.archived && p.date_relance && p.date_relance <= t; }).length})
          </QuickTab>
          <QuickTab active={filterStatut === "RDV_BOOKE"} onClick={() => setFilterStatut("RDV_BOOKE")}>
            RDV ({prospects.filter((p) => !p.archived && p.statut === "RDV_BOOKE").length})
          </QuickTab>
          <QuickTab active={filterStatut === "VENDU"} onClick={() => setFilterStatut("VENDU")}>
            Vendus ({prospects.filter((p) => p.statut === "VENDU").length})
          </QuickTab>
          <QuickTab active={filterStatut === "ARCHIVES"} onClick={() => setFilterStatut("ARCHIVES")}>
            Archivés ({prospects.filter((p) => p.archived).length})
          </QuickTab>
          <QuickTab active={filterStatut === "ALL"} onClick={() => setFilterStatut("ALL")}>
            Tous
          </QuickTab>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher entreprise, téléphone, note, niche..."
              className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-surface-3 rounded-lg text-[13px] placeholder-t-tertiary focus:outline-none focus:border-dopa-cyan/50"
            />
          </div>

          {/* Filter statut */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-tertiary pointer-events-none" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as typeof filterStatut)}
              className="pl-9 pr-8 py-2 bg-surface-2 border border-surface-3 rounded-lg text-[13px] focus:outline-none focus:border-dopa-cyan/50 appearance-none cursor-pointer"
            >
              <option value="ACTIFS">Actifs uniquement</option>
              <option value="ARCHIVES">Archivés uniquement</option>
              <option value="JAMAIS_APPELES">Jamais appelés</option>
              <option value="A_RAPPELER_AUJ">À rappeler aujourd&apos;hui</option>
              <option value="ALL">Tous (incl. archivés)</option>
              {STATUTS_ORDRE.map((s) => (
                <option key={s} value={s}>
                  {STATUT_EMOJI[s]} {STATUT_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Filter niche */}
          {niches.length > 0 && (
            <div className="relative">
              <select
                value={filterNiche}
                onChange={(e) => setFilterNiche(e.target.value)}
                className="pl-3 pr-8 py-2 bg-surface-2 border border-surface-3 rounded-lg text-[13px] focus:outline-none focus:border-dopa-cyan/50 appearance-none cursor-pointer"
              >
                <option value="ALL">Toutes les niches</option>
                <option value="__NONE__">Sans niche</option>
                {niches.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick add */}
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onQuickCreate()}
              placeholder="Ajouter rapidement..."
              className="px-3 py-2 bg-surface-2 border border-surface-3 rounded-lg text-[13px] placeholder-t-tertiary focus:outline-none focus:border-dopa-cyan/50 w-44"
            />
            <button
              onClick={onQuickCreate}
              disabled={creating || !newName.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 bg-dopa-green/10 text-dopa-green rounded-lg text-[13px] font-semibold hover:bg-dopa-green/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar (sticky en haut du tableau quand selection > 0) */}
      {selected.size > 0 && (
        <div className="px-6 py-2.5 bg-dopa-cyan/10 border-b border-dopa-cyan/30 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[12.5px] font-semibold text-dopa-cyan inline-flex items-center gap-2">
            <Check size={14} />
            {selected.size} sélectionné(s)
            <button onClick={clearSelection} className="ml-1 text-t-tertiary hover:text-t-primary inline-flex items-center gap-0.5 text-[11px]">
              <X size={11} /> désélectionner
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={doBulkArchive}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dopa-orange/15 text-dopa-orange rounded-lg text-[12px] font-semibold hover:bg-dopa-orange/25 disabled:opacity-40"
            >
              <Archive size={13} /> Archiver
            </button>
            <button
              onClick={doBulkUnarchive}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 text-t-secondary rounded-lg text-[12px] font-semibold hover:bg-surface-3 disabled:opacity-40"
            >
              Désarchiver
            </button>
            <button
              onClick={doBulkNiche}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dopa-violet/15 text-dopa-violet rounded-lg text-[12px] font-semibold hover:bg-dopa-violet/25 disabled:opacity-40"
            >
              Changer niche…
            </button>
            <select
              onChange={(e) => { if (e.target.value) { doBulkStatut(e.target.value as StatutProspect); e.target.value = ""; } }}
              disabled={bulkBusy}
              className="px-2.5 py-1.5 bg-surface-2 text-t-secondary rounded-lg text-[12px] font-semibold border border-surface-3 disabled:opacity-40 cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Changer statut…</option>
              {STATUTS_ORDRE.map((s) => (
                <option key={s} value={s}>{STATUT_EMOJI[s]} {STATUT_LABEL[s]}</option>
              ))}
            </select>
            <button
              onClick={doBulkDelete}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dopa-red/15 text-dopa-red rounded-lg text-[12px] font-semibold hover:bg-dopa-red/25 disabled:opacity-40"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Flash */}
      {flash && (
        <div className="px-6 py-2 bg-dopa-green/10 border-b border-dopa-green/30 text-[12.5px] text-dopa-green font-semibold">
          ✓ {flash}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-dopa-red/10 border border-dopa-red/30 rounded-lg text-[12px] text-dopa-red flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {loading && !loaded ? (
          <div className="flex items-center justify-center h-64 text-t-tertiary gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-t-tertiary gap-3">
            <div className="text-[40px]">🗂️</div>
            <p className="text-[14px]">
              {prospects.length === 0
                ? "Aucun prospect. Importe ton CSV pour démarrer."
                : "Aucun prospect ne correspond aux filtres."}
            </p>
            {prospects.length === 0 && (
              <button
                onClick={() => setShowImport(true)}
                className="mt-2 px-4 py-2 bg-dopa-cyan/10 text-dopa-cyan rounded-lg text-[13px] font-semibold hover:bg-dopa-cyan/20"
              >
                Importer mon premier CSV
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 sticky top-0 z-10">
              <tr className="text-left text-t-tertiary uppercase text-[10px] tracking-wider">
                <th className="pl-4 pr-2 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allSelectedInView}
                    ref={(el) => { if (el) el.indeterminate = !allSelectedInView && someSelectedInView; }}
                    onChange={toggleSelectAll}
                    className="accent-dopa-cyan cursor-pointer"
                    title={allSelectedInView ? "Tout désélectionner" : "Tout sélectionner (dans la vue)"}
                  />
                </th>
                <th
                  onClick={() => toggleSort("entreprise")}
                  className="px-4 py-2.5 cursor-pointer hover:text-t-primary font-semibold"
                >
                  Prospect {sortKey === "entreprise" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-3 py-2.5 font-semibold">Téléphone</th>
                <th
                  onClick={() => toggleSort("statut")}
                  className="px-3 py-2.5 cursor-pointer hover:text-t-primary font-semibold"
                >
                  Statut {sortKey === "statut" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => toggleSort("last_activity")}
                  className="px-3 py-2.5 cursor-pointer hover:text-t-primary font-semibold whitespace-nowrap"
                >
                  Activité {sortKey === "last_activity" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => toggleSort("date_relance")}
                  className="px-3 py-2.5 cursor-pointer hover:text-t-primary font-semibold whitespace-nowrap"
                >
                  À faire {sortKey === "date_relance" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const isSel = selected.has(p.id);
                const last = lastCallAt(p.id);
                const nbCalls = callCountFor(p.id);
                const today = new Date().toISOString().slice(0, 10);
                const relanceDue = p.date_relance && p.date_relance <= today;
                const rdvFutur = p.date_rdv && p.date_rdv >= today;
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.008, 0.15) }}
                    className={`border-b border-surface-3 hover:bg-surface-2/60 transition-colors ${
                      isSel ? "bg-dopa-cyan/5" : idx % 2 === 0 ? "bg-surface-1" : "bg-surface-1/50"
                    } ${p.archived ? "opacity-50" : ""}`}
                  >
                    <td className="pl-4 pr-2 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelectOne(p.id)}
                        className="accent-dopa-cyan cursor-pointer mt-0.5"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link href={`/prospects/${p.id}`} className="block font-bold text-[14px] text-t-primary hover:text-dopa-cyan leading-tight">
                        {p.entreprise}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {p.niche && (
                          <span className="text-[10px] text-t-tertiary uppercase tracking-wider">
                            {p.niche}
                          </span>
                        )}
                        {p.gmb_url && (
                          <a href={p.gmb_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-dopa-cyan hover:underline">
                            <MapPin size={9} /> GMB
                          </a>
                        )}
                        {p.site_url && (
                          <a href={p.site_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-dopa-cyan hover:underline">
                            <ExternalLink size={9} /> Site
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {p.telephone ? (
                        <a href={`tel:${p.telephone}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-t-primary hover:text-dopa-green tabular-nums">
                          <Phone size={12} />
                          {p.telephone}
                        </a>
                      ) : (
                        <span className="text-t-tertiary text-[11px]">pas de tel</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <StatutBadge statut={p.statut} compact />
                        {nbCalls > 0 && (
                          <span
                            className={`inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                              nbCalls >= 3
                                ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]"
                                : "bg-surface-2 text-t-secondary"
                            }`}
                            title={`${nbCalls} appel(s) passé(s)`}
                          >
                            {nbCalls}× appelé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-[11.5px] text-t-tertiary whitespace-nowrap">
                      {last ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={10} /> il y a {daysSince(last)}j
                        </span>
                      ) : (
                        <span className="italic">jamais</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top tabular-nums whitespace-nowrap">
                      {rdvFutur ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)] font-semibold text-[11px]">
                          📅 RDV {new Date(p.date_rdv!).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      ) : p.date_relance ? (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-[11px] ${
                          relanceDue
                            ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]"
                            : "bg-surface-2 text-t-secondary"
                        }`}>
                          {relanceDue ? "⚠ " : "⏰ "}
                          {new Date(p.date_relance).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      ) : (
                        <span className="text-t-tertiary text-[11px]">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
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
      className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-dopa-cyan text-black"
          : "bg-surface-2 text-t-secondary hover:bg-surface-3 hover:text-t-primary"
      }`}
    >
      {children}
    </button>
  );
}
