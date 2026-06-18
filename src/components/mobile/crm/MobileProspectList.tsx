"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Phone,
  ChevronDown,
  Loader2,
  Globe,
  MapPin,
  StickyNote,
  ExternalLink,
  X,
  ChevronUp,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { STATUT_LABEL, STATUT_COLORS, STATUTS_ORDRE } from "@/lib/crmLabels";
import type { Prospect, StatutProspect } from "@/lib/crmTypes";
import { formatWebsiteUrl } from "@/lib/crmLogic";

const QUICK_FILTERS: { label: string; filter: (p: Prospect) => boolean; accent: string }[] = [
  {
    label: "À appeler",
    filter: (p) => !p.archived && p.statut === "A_APPELER",
    accent: "var(--accent-blue)",
  },
  {
    label: "Répondeurs",
    filter: (p) => !p.archived && p.statut === "REPONDEUR",
    accent: "var(--accent-orange)",
  },
  {
    label: "WhatsApp",
    filter: (p) => !p.archived && p.statut === "MESSAGE_VOCAL_WHATSAPP",
    accent: "var(--accent-green)",
  },
  {
    label: "RDV",
    filter: (p) =>
      !p.archived &&
      ["RDV_BOOKE", "MAQUETTE_PRETE", "R1_EFFECTUE"].includes(p.statut),
    accent: "var(--accent-purple)",
  },
  {
    label: "Vendus",
    filter: (p) => p.statut === "VENDU",
    accent: "var(--accent-green)",
  },
  {
    label: "Archivés",
    filter: (p) => p.archived,
    accent: "var(--text-tertiary)",
  },
];

export default function MobileProspectList() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const prospects = useCrmStore((s) => s.prospects);
  const calls = useCrmStore((s) => s.calls);
  const loadAll = useCrmStore((s) => s.loadAll);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  const filtered = useMemo(() => {
    let list = prospects.filter(QUICK_FILTERS[activeFilter].filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.entreprise.toLowerCase().includes(q) ||
          p.telephone?.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prospects, activeFilter, search]);

  // Count per filter
  const counts = useMemo(
    () => QUICK_FILTERS.map((f) => prospects.filter(f.filter).length),
    [prospects]
  );

  if (!loaded && loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-[var(--text-tertiary)]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[13px]">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <h1 className="text-[20px] font-bold tracking-tight text-[var(--text-primary)] mb-3">
          Prospects
        </h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-[13px] bg-[var(--surface-2)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {QUICK_FILTERS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => {
                setActiveFilter(i);
                setExpandedId(null);
              }}
              className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background:
                  activeFilter === i
                    ? f.accent
                    : "var(--surface-2)",
                color:
                  activeFilter === i
                    ? "#fff"
                    : "var(--text-secondary)",
                border: `1px solid ${
                  activeFilter === i
                    ? f.accent
                    : "var(--border-primary)"
                }`,
              }}
            >
              {f.label}
              <span className="ml-1 opacity-70">{counts[i]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
            <Search size={32} className="mb-3 opacity-30" />
            <p className="text-[13px]">Aucun prospect trouvé</p>
          </div>
        ) : (
          <ul className="space-y-1.5 mt-2">
            {filtered.map((p) => {
              const isExpanded = expandedId === p.id;
              const statutColor = STATUT_COLORS[p.statut];
              const callCount = calls.filter(
                (c) => c.prospect_id === p.id
              ).length;

              return (
                <li key={p.id}>
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : p.id)
                    }
                    className="w-full text-left rounded-xl p-3 transition-all active:scale-[0.99]"
                    style={{
                      background: isExpanded
                        ? "var(--surface-2)"
                        : "var(--surface-1)",
                      border: `1px solid ${
                        isExpanded
                          ? "var(--border-secondary)"
                          : "var(--border-primary)"
                      }`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                          {p.entreprise}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              background: statutColor.bg,
                              color: statutColor.text,
                              border: `1px solid ${statutColor.border}`,
                            }}
                          >
                            {STATUT_LABEL[p.statut].split("(")[0].trim()}
                          </span>
                          {callCount > 0 && (
                            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                              {callCount} appel{callCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.telephone && (
                          <a
                            href={`tel:${p.telephone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              background: "var(--accent-green-light)",
                              color: "var(--accent-green)",
                            }}
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {isExpanded ? (
                          <ChevronUp
                            size={14}
                            className="text-[var(--text-tertiary)]"
                          />
                        ) : (
                          <ChevronDown
                            size={14}
                            className="text-[var(--text-tertiary)]"
                          />
                        )}
                      </div>
                    </div>

                    {/* ── Expanded detail ── */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
                        {p.telephone && (
                          <InfoRow
                            icon={<Phone size={12} />}
                            label="Téléphone"
                            value={p.telephone}
                            href={`tel:${p.telephone}`}
                          />
                        )}
                        {p.site_url && (
                          <InfoRow
                            icon={<Globe size={12} />}
                            label="Site web"
                            value={p.site_url.replace(/^https?:\/\//, "").slice(0, 30)}
                            href={formatWebsiteUrl(p.site_url)}
                            external
                          />
                        )}
                        {p.gmb_url && (
                          <InfoRow
                            icon={<MapPin size={12} />}
                            label="Google Maps"
                            value="Voir la fiche"
                            href={p.gmb_url}
                            external
                          />
                        )}
                        {p.date_rdv && (
                          <InfoRow
                            icon={<MapPin size={12} />}
                            label="RDV"
                            value={new Date(p.date_rdv).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          />
                        )}
                        {p.feedback && (
                          <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--surface-3)] rounded-lg px-3 py-2 mt-1">
                            {p.feedback}
                          </div>
                        )}
                        {p.notes && (
                          <div className="flex gap-1.5 mt-1">
                            <StickyNote size={11} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                            <p className="text-[11px] text-[var(--text-tertiary)] leading-snug whitespace-pre-wrap line-clamp-4">
                              {p.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function InfoRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[var(--text-tertiary)]">{icon}</span>
      <span className="text-[10px] text-[var(--text-tertiary)] w-[60px] shrink-0">
        {label}
      </span>
      <span className="text-[12px] text-[var(--text-primary)] font-medium truncate flex-1">
        {value}
      </span>
      {external && <ExternalLink size={10} className="text-[var(--text-tertiary)] shrink-0" />}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={(e) => e.stopPropagation()}
        className="block active:bg-[var(--surface-3)] rounded-lg -mx-1 px-1"
      >
        {content}
      </a>
    );
  }
  return content;
}
