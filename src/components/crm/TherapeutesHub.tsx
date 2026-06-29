"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  Search, Plus, X, Trash2, LayoutGrid, Table2,
  LayoutDashboard, KanbanSquare, Shuffle,
  CalendarClock, Flame, RotateCcw, Target, TrendingUp,
} from "lucide-react";
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type Statut = "a_contacter" | "contacte" | "chaud" | "rdv_booke" | "rdv_fait" | "client" | "perdu";

type Lead = {
  id: string;
  nom: string;
  spe: string;
  ville: string;
  statut: Statut;
  rdv: string;
  contact: string;
  notes: string;
  source: string;
  caContracte: number;
  caCollecte: number;
  rdvFait?: boolean;
};

const COLS: { key: Statut; label: string; emoji: string; color: string }[] = [
  { key: "a_contacter", label: "À contacter", emoji: "📇", color: "#9898A2" },
  { key: "contacte", label: "Contacté · sans réponse", emoji: "📨", color: "#86B8CC" },
  { key: "chaud", label: "Chaud", emoji: "🔥", color: "#F3B87A" },
  { key: "rdv_booke", label: "RDV booké", emoji: "📅", color: "#818CF8" },
  { key: "rdv_fait", label: "RDV fait · suivi", emoji: "🎥", color: "#A893F0" },
  { key: "client", label: "Client signé", emoji: "✅", color: "#86D4A1" },
  { key: "perdu", label: "Perdu", emoji: "✖️", color: "#F08A72" },
];

const COL_BY: Record<Statut, { label: string; emoji: string; color: string }> = COLS.reduce(
  (acc, c) => { acc[c.key] = { label: c.label, emoji: c.emoji, color: c.color }; return acc; },
  {} as Record<Statut, { label: string; emoji: string; color: string }>
);

const KEY = "triva_crm_therapeutes_v1";
const MIGR_CATHERINE = "triva_crm_migr_catherine_v1";
const MIGR_RDVFAIT = "triva_crm_migr_rdvfait_v1";
const MIGR_NATHALIE = "triva_crm_migr_nathalie_v1";
const OBJECTIF_VENTES = 3;
const OBJECTIF_CA = 6000;

const APP_BG =
  "radial-gradient(1100px 520px at 78% -8%, rgba(168,147,240,0.10), transparent 60%), radial-gradient(820px 460px at -5% 108%, rgba(134,184,204,0.07), transparent 55%), var(--surface-0)";

const SANS_REPONSE = [
  "Christelle Collins (psycho-hypno)", "Pascal Chartrain", "Aneta Olszewska",
  "Pascale Gély Labadie", "Fanni Aquatherapy", "Audrey Boussagol", "Valerie Nelisse",
  "Sandrine Samson", "Débora Primi", "Lisa Tedone", "Frédérique Saumurot",
  "Fanny Alzingre", "Sophie Mauchaussé", "Lili Larose", "Christine Janssens",
  "Jéssica Perera Martínez",
];

const CATHERINE: Lead = {
  id: "catherine",
  nom: "Catherine Arnaud",
  spe: "Cliente — refonte de site + SEO",
  ville: "Bord des Vosges",
  statut: "client",
  rdv: "Onboarding fait (sam.)",
  contact: "WhatsApp",
  notes: "✅ Closée 940 € (acompte 50/50, hébergement offert). Virement de l'acompte à venir cette semaine (son compagnon lui a fait le virement, elle attend de l'avoir). Onboarding fait samedi : accès Wix débloqué (Google Authenticator) ; domaine expire 2027 ; forfait pris en 2 ans qui finit 2026 → couper le renouvellement auto avant l'échéance. Fiche Google = Régis admin → le faire ajouter aaron@triva-media.com. Questionnaire envoyé par WhatsApp → RELANCER. Garder ses textes / images, optimiser le SEO.",
  source: "Inbound",
  caContracte: 940,
  caCollecte: 0,
  rdvFait: true,
};

const SEED: Lead[] = [
  CATHERINE,
  { id: "t1", nom: "Nancy Mas (Nancy Massaoudi)", spe: "Thérapeute · bilingue FR/NL", ville: "Denderleeuw (BE)", statut: "rdv_booke", rdv: "Lundi", contact: "", source: "Post FB", notes: "A réagi avec un coeur. Ne pas relancer.", caContracte: 0, caCollecte: 0 },
  { id: "t2", nom: "Anne Laure Frelon", spe: "Thérapeute", ville: "", statut: "rdv_booke", rdv: "Lundi 13h30", contact: "", source: "Post FB", notes: "RDV confirmé. A accepté que c'est payant / qu'il faut investir.", caContracte: 0, caCollecte: 0 },
  { id: "t3", nom: "Mélanie Baerel", spe: "Thérapeute (Douceur éternelle)", ville: "", statut: "rdv_booke", rdv: "Mardi (visio)", contact: "", source: "Post FB", notes: "Déjà amie FB. Envoyer le lien visio 5 min avant.", caContracte: 0, caCollecte: 0 },
  { id: "t4", nom: "Katie Serenity", spe: "Thérapeute", ville: "", statut: "chaud", rdv: "", contact: "", source: "Post FB", notes: "Signaux d'achat (a demandé le prix + le paiement échelonné). 980 euros donné. RELANCER pour caler le créneau.", caContracte: 0, caCollecte: 0 },
  { id: "t5", nom: "Nathalie Varlet", spe: "Physiothérapeute (fasciathérapie, cranio-sacral)", ville: "Ibiza", statut: "chaud", rdv: "RDV manqué · reprise lundi 29/06", contact: "WhatsApp +33 6 78 70 62 99 · nathalievarlet.com", source: "Post FB", notes: "Inbound chaud (Ibiza). RDV vendredi MANQUÉ (jamais calé) → reprise proposée lundi. Hors niche (physio).", caContracte: 0, caCollecte: 0 },
  { id: "t6", nom: "Rania (Ourania Phénix)", spe: "Thérapie Guérir avec Amour + coaching", ville: "En ligne", statut: "perdu", rdv: "RDV fait", contact: "", source: "Post FB / DM", notes: "Tiède sur le site, veut juste la fiche Google. Haut de gamme mais abandonné pour l'instant.", caContracte: 0, caCollecte: 0, rdvFait: true },
  { id: "t7", nom: "Mélanie Éclairer L'essentiel", spe: "Thérapeute", ville: "En ligne", statut: "perdu", rdv: "Call fait", contact: "", source: "Post FB", notes: "Non pertinent : 100% en ligne + a déjà un prestataire pour son site.", caContracte: 0, caCollecte: 0, rdvFait: true },
  { id: "t8", nom: "Anne Kételair", spe: "Thérapeute", ville: "", statut: "perdu", rdv: "RDV lundi annulé", contact: "", source: "Post FB", notes: "Avait un RDV lundi, l'a annulé (ce ne sera pas nécessaire).", caContracte: 0, caCollecte: 0 },
  { id: "t9", nom: "Daphné Simon", spe: "Massage / hypnose (hors niche)", ville: "", statut: "perdu", rdv: "Call fait (26 min)", contact: "", source: "Post FB", notes: "Pas le budget. Non-acheteuse.", caContracte: 0, caCollecte: 0, rdvFait: true },
  { id: "t10", nom: "Nathy Ohm", spe: "Massage énergétique / Lahochi / sonothérapie", ville: "Forcalquier", statut: "perdu", rdv: "", contact: "", source: "Post FB", notes: "Hors niche coeur. Abandonné.", caContracte: 0, caCollecte: 0 },
  { id: "t11", nom: "Fabienne Buale", spe: "", ville: "", statut: "a_contacter", rdv: "", contact: "", source: "Post FB", notes: "Demande d'ami envoyée. À DM quand elle accepte.", caContracte: 0, caCollecte: 0 },
  { id: "t12", nom: "Celine Bentz", spe: "", ville: "", statut: "a_contacter", rdv: "", contact: "", source: "Post FB", notes: "À contacter.", caContracte: 0, caCollecte: 0 },
  ...SANS_REPONSE.map((n, i): Lead => ({ id: "c" + i, nom: n, spe: "", ville: "", statut: "contacte", rdv: "", contact: "", source: "Post FB", notes: "DM envoyé, pas de réponse.", caContracte: 0, caCollecte: 0 })),
];

const eur = (n: number) => `${(n || 0).toLocaleString("fr-FR")} €`;
const inputCls = "w-full px-3 py-2 rounded-lg text-[13px] outline-none";
const inputStyle: CSSProperties = { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" };

export default function TherapeutesHub() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Lead | null>(null);
  const [tab, setTab] = useState<"dash" | "pipeline">("dash");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    let arr: Lead[];
    try {
      const raw = localStorage.getItem(KEY);
      arr = raw ? (JSON.parse(raw) as Lead[]) : SEED;
    } catch {
      arr = SEED;
    }
    arr = arr.map((l) => ({ caContracte: 0, caCollecte: 0, ...l }));
    // Migration unique : injecter Catherine (cliente closée) une seule fois, même si le CRM existait déjà
    try {
      if (!localStorage.getItem(MIGR_CATHERINE)) {
        if (!arr.some((l) => l.id === "catherine")) arr = [CATHERINE, ...arr];
        localStorage.setItem(MIGR_CATHERINE, "1");
      }
    } catch {}
    // Migration unique : marquer les RDV réellement faits (pour le taux de close)
    try {
      if (!localStorage.getItem(MIGR_RDVFAIT)) {
        const done = new Set(["catherine", "t6", "t7", "t9"]);
        arr = arr.map((l) => (done.has(l.id) ? { ...l, rdvFait: true } : l));
        localStorage.setItem(MIGR_RDVFAIT, "1");
      }
    } catch {}
    // Correctif unique : Nathalie = RDV manqué (pas un RDV fait) → lead chaud à recaler
    try {
      if (!localStorage.getItem(MIGR_NATHALIE)) {
        arr = arr.map((l) => (l.id === "t5" ? { ...l, rdvFait: false, statut: "chaud", rdv: "RDV manqué · reprise lundi 29/06" } : l));
        localStorage.setItem(MIGR_NATHALIE, "1");
      }
    } catch {}
    setLeads(arr);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(leads));
  }, [leads, ready]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return leads;
    return leads.filter((l) => `${l.nom} ${l.spe} ${l.ville} ${l.notes}`.toLowerCase().includes(s));
  }, [leads, q]);

  const onSave = (l: Lead) => {
    setLeads((p) => (p.some((x) => x.id === l.id) ? p.map((x) => (x.id === l.id ? l : x)) : [l, ...p]));
    setEdit(null);
  };
  const onDelete = (id: string) => {
    setLeads((p) => p.filter((x) => x.id !== id));
    setEdit(null);
  };
  const moveTo = (id: string, statut: Statut) => setLeads((p) => p.map((l) => (l.id === id ? { ...l, statut } : l)));

  const newLead = (): Lead => ({ id: `n${Date.now()}`, nom: "", spe: "", ville: "", statut: "a_contacter", rdv: "", contact: "", notes: "", source: "Post FB", caContracte: 0, caCollecte: 0, rdvFait: false });

  const activeLead = activeId ? leads.find((l) => l.id === activeId) || null : null;
  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id;
    if (overId && COLS.some((c) => c.key === overId)) moveTo(String(e.active.id), overId as Statut);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: APP_BG }}>
      <Header tab={tab} setTab={setTab} onAdd={() => setEdit(newLead())} total={leads.length} />

      <div className="flex-1 overflow-auto">
        {tab === "dash" ? (
          <Dashboard leads={leads} onOpen={setEdit} />
        ) : (
          <div className="max-w-[1700px] mx-auto px-8 py-6 space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-tertiary" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un lead…" className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[13px] outline-none" style={inputStyle} />
              </div>
              <div className="inline-flex rounded-lg p-0.5 gap-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border-primary)" }}>
                <ViewBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={<LayoutGrid size={14} />} label="Kanban" />
                <ViewBtn active={view === "table"} onClick={() => setView("table")} icon={<Table2 size={14} />} label="Tableau" />
              </div>
            </div>

            {view === "kanban" ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-6 items-start">
                  {COLS.map((col) => (
                    <DroppableColumn key={col.key} col={col} items={filtered.filter((l) => l.statut === col.key)} onOpen={setEdit} />
                  ))}
                </div>
                <DragOverlay>{activeLead ? <CardInner lead={activeLead} color={COL_BY[activeLead.statut].color} dragging /> : null}</DragOverlay>
              </DndContext>
            ) : (
              <TableView leads={filtered} onOpen={setEdit} />
            )}
          </div>
        )}
      </div>

      {edit && <EditModal lead={edit} onSave={onSave} onDelete={onDelete} onClose={() => setEdit(null)} />}
    </div>
  );
}

function Header({ tab, setTab, onAdd, total }: { tab: "dash" | "pipeline"; setTab: (t: "dash" | "pipeline") => void; onAdd: () => void; total: number }) {
  return (
    <header className="shrink-0 border-b px-6 py-3 flex items-center gap-4" style={{ borderColor: "var(--border-primary)", background: "var(--surface-0)" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))" }}>
          <span className="text-[16px] font-black text-white">T</span>
        </div>
        <div>
          <p className="text-[15px] font-bold leading-none text-t-primary">CRM Triva</p>
          <p className="text-[10.5px] text-t-tertiary mt-1">Pipeline thérapeutes · {total} contacts</p>
        </div>
      </div>

      <div className="mx-auto inline-flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border-primary)" }}>
        <TabBtn active={tab === "dash"} onClick={() => setTab("dash")} icon={<LayoutDashboard size={15} />} label="Tableau de bord" />
        <TabBtn active={tab === "pipeline"} onClick={() => setTab("pipeline")} icon={<KanbanSquare size={15} />} label="Vision globale" />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onAdd} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold" style={{ background: "var(--accent-purple)", color: "#fff" }}>
          <Plus size={15} /> Ajouter
        </button>
        <Link href="/start" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-t-secondary transition-colors hover:text-t-primary" style={{ background: "var(--surface-2)", border: "1px solid var(--border-primary)" }}>
          <Shuffle size={14} /> Changer de mode
        </Link>
      </div>
    </header>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all" style={active ? { background: "var(--accent-purple)", color: "#fff" } : { color: "var(--text-secondary)" }}>
      {icon} {label}
    </button>
  );
}

function Dashboard({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  const count = (k: Statut) => leads.filter((l) => l.statut === k).length;
  const sum = (key: "caContracte" | "caCollecte") => leads.reduce((t, l) => t + (l[key] || 0), 0);
  const collecte = sum("caCollecte");
  const contracte = sum("caContracte");
  const clients = count("client");
  // Taux de close = clients signés ÷ RDV réellement faits (case "RDV fait" cochée, ou déjà client)
  const rdvFaits = leads.filter((l) => l.rdvFait || l.statut === "client").length;
  const taux = rdvFaits > 0 ? Math.round((clients / rdvFaits) * 100) : 0;
  const rdv = leads.filter((l) => l.statut === "rdv_booke");
  const chaud = leads.filter((l) => l.statut === "chaud");
  const relance = leads.filter((l) => l.statut === "contacte");
  const maxCount = Math.max(1, ...COLS.map((c) => count(c.key)));

  const kpis = [
    { label: "CA collecté", value: eur(collecte), color: "#86D4A1", icon: <TrendingUp size={16} />, sub: "encaissé" },
    { label: "CA contracté", value: eur(contracte), color: "#86B8CC", icon: <Target size={16} />, sub: "signé, en attente" },
    { label: "Clients signés", value: clients, color: "#A893F0", icon: <Flame size={16} />, sub: `${leads.length} contacts au total` },
    { label: "Taux de close", value: `${taux}%`, color: "#F3B87A", icon: <TrendingUp size={16} />, sub: `${clients} signé(s) · ${rdvFaits} RDV faits` },
  ];

  return (
    <div className="max-w-[1500px] mx-auto px-8 py-7 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="rounded-2xl glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} style={{ color: "var(--accent-purple)" }} />
          <h2 className="text-[14px] font-bold text-t-primary">Objectif du mois</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Progress label="Ventes" value={clients} max={OBJECTIF_VENTES} color="#A893F0" display={`${clients} / ${OBJECTIF_VENTES}`} />
          <Progress label="CA collecté" value={collecte} max={OBJECTIF_CA} color="#86D4A1" display={`${eur(collecte)} / ${eur(OBJECTIF_CA)}`} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <KanbanSquare size={16} style={{ color: "var(--accent-blue)" }} />
            <h2 className="text-[14px] font-bold text-t-primary">Pipeline — vue d'ensemble</h2>
          </div>
          <div className="space-y-2.5">
            {COLS.map((c) => {
              const n = count(c.key);
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <div className="w-[160px] shrink-0 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: c.color }}>
                    <span>{c.emoji}</span><span className="truncate">{c.label.split(" · ")[0]}</span>
                  </div>
                  <div className="flex-1 h-[26px] rounded-lg overflow-hidden" style={{ background: "var(--surface-2)" }}>
                    <div className="h-full rounded-lg flex items-center justify-end px-2 transition-all" style={{ width: `${Math.max(7, (n / maxCount) * 100)}%`, background: `linear-gradient(90deg, ${c.color}40, ${c.color})` }}>
                      <span className="text-[11px] font-black text-white/90 tabular-nums">{n}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl glass-card p-6 space-y-5">
          <ActionList title="RDV à venir" icon={<CalendarClock size={14} />} color="#818CF8" items={rdv} field="rdv" onOpen={onOpen} empty="Aucun RDV calé" />
          <ActionList title="À closer (chaud)" icon={<Flame size={14} />} color="#F3B87A" items={chaud} field="note" onOpen={onOpen} empty="Personne en chaud" />
          <ActionList title="À relancer" icon={<RotateCcw size={14} />} color="#86B8CC" items={relance} field="spe" onOpen={onOpen} empty="Rien à relancer" max={5} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, icon, sub }: { label: string; value: string | number; color: string; icon: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl glass-card p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}18 0%, var(--surface-1) 70%)` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-[28px] font-black tabular-nums tracking-tight leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-t-tertiary mt-2">{sub}</p>}
    </div>
  );
}

function Progress({ label, value, max, color, display }: { label: string; value: number; max: number; color: string; display: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-t-secondary">{label}</span>
        <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{display}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ActionList({ title, icon, color, items, field, onOpen, empty, max = 6 }: { title: string; icon: ReactNode; color: string; items: Lead[]; field: "rdv" | "note" | "spe"; onOpen: (l: Lead) => void; empty: string; max?: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span style={{ color }}>{icon}</span>
        <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color }}>{title}</h3>
        <span className="ml-auto text-[11px] font-bold tabular-nums px-1.5 rounded" style={{ color, background: `${color}1f` }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[11.5px] text-t-tertiary italic">{empty}</p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, max).map((l) => (
            <button key={l.id} onClick={() => onOpen(l)} className="w-full text-left rounded-lg px-3 py-2 transition-all hover:brightness-125" style={{ background: "var(--surface-2)", border: "1px solid var(--border-primary)" }}>
              <p className="text-[12.5px] font-semibold text-t-primary leading-tight truncate">{l.nom}</p>
              {field === "rdv" && l.rdv && <p className="text-[11px] mt-0.5" style={{ color }}>{l.rdv}</p>}
              {field === "note" && l.notes && <p className="text-[11px] text-t-tertiary mt-0.5 line-clamp-1">{l.notes}</p>}
              {field === "spe" && l.spe && <p className="text-[11px] text-t-tertiary mt-0.5 truncate">{l.spe}</p>}
            </button>
          ))}
          {items.length > max && <p className="text-[11px] text-t-tertiary pl-1">+{items.length - max} autres</p>}
        </div>
      )}
    </div>
  );
}

function ViewBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all" style={active ? { background: "var(--accent-purple-light)", color: "var(--accent-purple)" } : { color: "var(--text-secondary)" }}>
      {icon} {label}
    </button>
  );
}

function DroppableColumn({ col, items, onOpen }: { col: { key: Statut; label: string; emoji: string; color: string }; items: Lead[]; onOpen: (l: Lead) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key });
  return (
    <div ref={setNodeRef} className="flex-[0_0_270px] rounded-xl border p-3 flex flex-col min-h-[220px] transition-shadow" style={{ background: `${col.color}12`, borderColor: isOver ? col.color : `${col.color}33`, boxShadow: isOver ? `0 0 0 2px ${col.color}55` : "none" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: col.color }}>
          <span>{col.emoji}</span>
          <span className="truncate">{col.label}</span>
        </div>
        <span className="text-[12px] font-bold bg-black/20 px-1.5 rounded" style={{ color: col.color }}>{items.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)] pr-0.5">
        {items.length === 0 && <p className="text-[11px] text-t-tertiary italic text-center mt-3">Glisse un lead ici</p>}
        {items.map((l) => <DraggableCard key={l.id} lead={l} color={col.color} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function DraggableCard({ lead, color, onOpen }: { lead: Lead; color: string; onOpen: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style: CSSProperties = { transform: transform ? CSS.Translate.toString(transform) : undefined, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={() => onOpen(lead)} className="cursor-grab active:cursor-grabbing">
      <CardInner lead={lead} color={color} />
    </div>
  );
}

function CardInner({ lead, color, dragging }: { lead: Lead; color: string; dragging?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 border transition-all hover:brightness-125 ${dragging ? "shadow-elevated" : ""}`} style={{ background: "var(--surface-1)", borderColor: `${color}33` }}>
      <p className="text-[12.5px] font-semibold text-t-primary leading-tight">{lead.nom}</p>
      {lead.spe && <p className="text-[10.5px] text-t-tertiary mt-0.5 line-clamp-1">{lead.spe}</p>}
      {(lead.rdv || lead.ville || lead.caContracte > 0) && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {lead.rdv && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}>📅 {lead.rdv}</span>}
          {lead.ville && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>📍 {lead.ville}</span>}
          {lead.caContracte > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}>{eur(lead.caContracte)}</span>}
        </div>
      )}
    </div>
  );
}

function TableView({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  const order = COLS.map((c) => c.key);
  const sorted = [...leads].sort((a, b) => order.indexOf(a.statut) - order.indexOf(b.statut) || a.nom.localeCompare(b.nom));
  return (
    <div className="rounded-2xl glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-t-tertiary" style={{ background: "var(--surface-2)" }}>
              <th className="px-4 py-3 font-bold">Nom</th>
              <th className="px-4 py-3 font-bold">Spécialité</th>
              <th className="px-4 py-3 font-bold">Ville</th>
              <th className="px-4 py-3 font-bold">Statut</th>
              <th className="px-4 py-3 font-bold">RDV</th>
              <th className="px-4 py-3 font-bold text-right">CA contracté</th>
              <th className="px-4 py-3 font-bold text-right">CA collecté</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => {
              const c = COL_BY[l.statut];
              return (
                <tr key={l.id} onClick={() => onOpen(l)} className="cursor-pointer transition-colors hover:bg-surface-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
                  <td className="px-4 py-2.5 text-[13px] font-semibold text-t-primary">{l.nom}</td>
                  <td className="px-4 py-2.5 text-[12px] text-t-secondary">{l.spe || "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] text-t-secondary">{l.ville || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ color: c.color, background: `${c.color}1f` }}>{c.emoji} {c.label.split(" · ")[0]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-t-secondary">{l.rdv || "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] text-right tabular-nums" style={{ color: l.caContracte ? "var(--accent-cyan)" : "var(--text-tertiary)" }}>{l.caContracte ? eur(l.caContracte) : "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] text-right tabular-nums" style={{ color: l.caCollecte ? "var(--accent-green)" : "var(--text-tertiary)" }}>{l.caCollecte ? eur(l.caCollecte) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex-1">
      <label className="block text-[11px] font-semibold text-t-tertiary uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function EditModal({ lead, onSave, onDelete, onClose }: { lead: Lead; onSave: (l: Lead) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [f, setF] = useState<Lead>(lead);
  const patch = (p: Partial<Lead>) => setF((prev) => ({ ...prev, ...p }));
  const isNew = !lead.nom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--backdrop-bg)", backdropFilter: "var(--backdrop-blur)" }} onClick={onClose}>
      <div className="w-[520px] max-w-full max-h-[92vh] overflow-auto rounded-2xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-secondary)", boxShadow: "var(--shadow-elevated)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center px-5 py-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <b className="text-[15px] text-t-primary">{isNew ? "Nouveau lead" : "Fiche lead"}</b>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-t-secondary hover:text-t-primary" style={{ background: "var(--surface-3)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <Field label="Nom"><input value={f.nom} onChange={(e) => patch({ nom: e.target.value })} className={inputCls} style={inputStyle} placeholder="Nom du / de la thérapeute" /></Field>
          <div className="flex gap-3">
            <Field label="Spécialité"><input value={f.spe} onChange={(e) => patch({ spe: e.target.value })} className={inputCls} style={inputStyle} /></Field>
            <Field label="Ville / Mode"><input value={f.ville} onChange={(e) => patch({ ville: e.target.value })} className={inputCls} style={inputStyle} placeholder="ex. Lyon · ou En ligne" /></Field>
          </div>
          <div className="flex gap-3">
            <Field label="Statut">
              <select value={f.statut} onChange={(e) => patch({ statut: e.target.value as Statut })} className={inputCls} style={inputStyle}>
                {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="RDV (date / heure)"><input value={f.rdv} onChange={(e) => patch({ rdv: e.target.value })} className={inputCls} style={inputStyle} placeholder="ex. Mardi 14h (visio)" /></Field>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-lg px-3 py-2.5" style={{ background: "var(--surface-1)", border: "1px solid var(--border-primary)" }}>
            <input type="checkbox" checked={!!f.rdvFait} onChange={(e) => patch({ rdvFait: e.target.checked })} className="w-4 h-4" style={{ accentColor: "var(--accent-purple)" }} />
            <span className="text-[12.5px] text-t-secondary">RDV réellement fait <span className="text-t-tertiary">(compte dans le taux de close)</span></span>
          </label>
          <div className="flex gap-3">
            <Field label="CA contracté (€)"><input type="number" value={f.caContracte} onChange={(e) => patch({ caContracte: Number(e.target.value) || 0 })} className={inputCls} style={inputStyle} /></Field>
            <Field label="CA collecté (€)"><input type="number" value={f.caCollecte} onChange={(e) => patch({ caCollecte: Number(e.target.value) || 0 })} className={inputCls} style={inputStyle} /></Field>
          </div>
          <Field label="Contact (tél / WhatsApp / site)"><input value={f.contact} onChange={(e) => patch({ contact: e.target.value })} className={inputCls} style={inputStyle} /></Field>
          <Field label="Notes"><textarea value={f.notes} onChange={(e) => patch({ notes: e.target.value })} className={`${inputCls} min-h-[90px] resize-y`} style={inputStyle} placeholder="Contexte, objection, prochaine action…" /></Field>
          <Field label="Source"><input value={f.source} onChange={(e) => patch({ source: e.target.value })} className={inputCls} style={inputStyle} /></Field>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
          {!isNew && (
            <button onClick={() => onDelete(f.id)} className="mr-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold" style={{ background: "var(--accent-red-light)", color: "var(--accent-red)" }}>
              <Trash2 size={14} /> Supprimer
            </button>
          )}
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-[13px] font-semibold text-t-secondary" style={{ background: "var(--surface-3)" }}>Annuler</button>
          <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ background: "var(--accent-purple)", color: "#fff" }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
