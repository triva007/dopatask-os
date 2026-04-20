"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, Upload, Phone, MapPin, ExternalLink, Plus, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { STATUTS_ORDRE, STATUT_LABEL, STATUT_EMOJI } from "@/lib/crmLabels";
import type { StatutProspect } from "@/lib/crmTypes";
import StatutBadge from "./StatutBadge";
import ImportCsvModal from "./ImportCsvModal";

type SortKey = "entreprise" | "statut" | "date_relance" | "created_at";

export default function ProspectsTable() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const error = useCrmStore((s) => s.error);
  const prospects = useCrmStore((s) => s.prospects);
  const loadAll = useCrmStore((s) => s.loadAll);
  const createProspect = useCrmStore((s) => s.createProspect);

  const searchParams = useSearchParams();
  const initialStatut = searchParams.get("statut");
  const [query, setQuery] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutProspect | "ALL" | "ACTIFS">(
    (initialStatut as StatutProspect) || "ACTIFS"
  );
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showImport, setShowImport] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  const filtered = useMemo(() => {
    let arr = prospects;
    // Filtrage par statut
    if (filterStatut === "ACTIFS") {
      arr = arr.filter((p) => !p.archived);
    } else if (filterStatut !== "ALL") {
      arr = arr.filter((p) => p.statut === filterStatut);
    }
    // Recherche plein texte
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((p) =>
        [p.entreprise, p.telephone, p.notes, p.feedback, p.gmb_url, p.site_url]
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
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [prospects, query, filterStatut, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const onQuickCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createProspect({ entreprise: newName.trim() });
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/crm"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 text-[12px]"
              title="Retour au CRM"
            >
              <ArrowLeft size={14} /> CRM
            </Link>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">Prospects</h1>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                {filtered.length} affiches - {prospects.filter((p) => !p.archived).length} actifs - {prospects.filter((p) => p.archived).length} archives
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 h-9 px-3 bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)] rounded-xl text-[12.5px] font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              <Upload size={14} />
              Importer CSV
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher une entreprise, téléphone, note..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg text-[13px] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-cyan)]"
            />
          </div>

          {/* Filter statut */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as typeof filterStatut)}
              className="pl-9 pr-8 py-2 bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg text-[13px] focus:outline-none focus:border-[var(--accent-cyan)] appearance-none cursor-pointer"
            >
              <option value="ACTIFS">Actifs uniquement</option>
              <option value="ALL">Tous (incl. archivés)</option>
              {STATUTS_ORDRE.map((s) => (
                <option key={s} value={s}>
                  {STATUT_EMOJI[s]} {STATUT_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Quick add */}
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onQuickCreate()}
              placeholder="Ajouter rapidement..."
              className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg text-[13px] placeholder-t-tertiary focus:outline-none focus:border-[var(--accent-cyan)]/50 w-44"
            />
            <button
              onClick={onQuickCreate}
              disabled={creating || !newName.trim()}
              className="inline-flex items-center gap-1 h-9 px-3 bg-[var(--accent-green-light)] text-[var(--accent-green)] rounded-xl text-[12.5px] font-medium hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-[var(--accent-red-light)] border border-[var(--accent-red)] rounded-lg text-[12px] text-[var(--accent-red)] flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {loading && !loaded ? (
          <div className="flex items-center justify-center h-64 text-[var(--text-tertiary)] gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]">Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-tertiary)] gap-3">
            <div className="text-[40px]">🗂️</div>
            <p className="text-[14px]">
              {prospects.length === 0
                ? "Aucun prospect. Importe ton CSV pour démarrer."
                : "Aucun prospect ne correspond aux filtres."}
            </p>
            {prospects.length === 0 && (
              <button
                onClick={() => setShowImport(true)}
                className="mt-2 h-9 px-3 bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)] rounded-xl text-[12.5px] font-medium hover:bg-[var(--surface-2)] transition-colors"
              >
                Importer mon premier CSV
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-[var(--surface-2)] sticky top-0 z-10">
              <tr className="text-left text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider">
                <th
                  onClick={() => toggleSort("entreprise")}
                  className="px-4 py-3 cursor-pointer hover:text-[var(--text-primary)] font-semibold"
                >
                  Entreprise {sortKey === "entreprise" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 font-semibold">Téléphone</th>
                <th className="px-4 py-3 font-semibold">GMB</th>
                <th
                  onClick={() => toggleSort("statut")}
                  className="px-4 py-3 cursor-pointer hover:text-[var(--text-primary)] font-semibold"
                >
                  Statut {sortKey === "statut" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => toggleSort("date_relance")}
                  className="px-4 py-3 cursor-pointer hover:text-[var(--text-primary)] font-semibold"
                >
                  Date RDV / Relance {sortKey === "date_relance" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 font-semibold">Maquette</th>
                <th className="px-4 py-3 font-semibold">Feedback</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.01, 0.2) }}
                  className={`border-b border-[var(--border-primary)] hover:bg-[var(--surface-2)]/60 transition-colors ${
                    idx % 2 === 0 ? "bg-[var(--surface-1)]" : "bg-[var(--surface-1)]/50"
                  } ${p.archived ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/prospects/${p.id}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-cyan)]">
                      {p.entreprise}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">
                    {p.telephone ? (
                      <a href={`tel:${p.telephone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--accent-green)]">
                        <Phone size={11} />
                        {p.telephone}
                      </a>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.gmb_url ? (
                      <a href={p.gmb_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--accent-cyan)] hover:underline">
                        <MapPin size={11} /> Fiche
                      </a>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatutBadge statut={p.statut} compact />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">
                    {p.date_rdv ? `RDV ${p.date_rdv}` : p.date_relance ? `Relance ${p.date_relance}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.lien_maquette ? (
                      <a href={p.lien_maquette} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--accent-purple)] hover:underline">
                        <ExternalLink size={11} /> Lien
                      </a>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[220px] truncate" title={p.feedback || ""}>
                    {p.feedback || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-tertiary)] max-w-[200px] truncate" title={p.notes || ""}>
                    {p.notes || "—"}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showImport && <ImportCsvModal onClose={() =