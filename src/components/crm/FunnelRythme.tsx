"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Phone, CheckCircle2, Calendar, Banknote, TrendingUp, AlertTriangle, Flame } from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { isToday, isThisMonth, computeStreak } from "@/lib/crmLogic";

// Ratios typiques BTP cold-call. Servent de base si Aaron n'a pas encore 100+ calls.
// Une fois qu'il a assez de data, on utilise ses vrais taux perso.
const MIN_CALLS_FOR_PERSO_RATIO = 50;

type Ratios = {
  tauxDecroche: number; // décrochés / calls
  tauxRdvParDecroche: number; // RDV / décrochés
  tauxClosing: number; // ventes / RDV
  source: "perso" | "typique";
};

const RATIOS_TYPIQUES: Omit<Ratios, "source"> = {
  tauxDecroche: 0.58,
  tauxRdvParDecroche: 0.12,
  tauxClosing: 0.28,
};

function businessDaysUntil(target: Date, from: Date = new Date()): number {
  let count = 0;
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  cur.setDate(cur.getDate() + 1); // exclure aujourd'hui
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  while (cur < end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function isWeekend(d: Date = new Date()) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export default function FunnelRythme() {
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const config = useCrmStore((s) => s.config);

  const objectif = config?.objectif_mensuel ?? 3000;
  const prixSite = config?.prix_site ?? 980;
  const dailyTarget = config?.mission_daily_target ?? 10;
  const deadlineStr = config?.deadline_date ?? "2026-06-01";

  const data = useMemo(() => {
    const callsAuj = calls.filter((c) => isToday(c.date));
    const callsMois = calls.filter((c) => isThisMonth(c.date));
    const revenusMois = revenus.filter((r) => isThisMonth(r.date_signature));

    const callsAujTotal = callsAuj.length;
    const callsAujMission = callsAuj.filter((c) => c.compte_mission).length;
    const decrochesAuj = callsAuj.filter((c) =>
      ["DECROCHE", "RDV", "REFUS", "EXISTE_PAS"].includes(c.resultat)
    ).length;
    const rdvAuj = callsAuj.filter((c) => c.resultat === "RDV").length;
    const revenuAuj = revenus
      .filter((r) => new Date(r.date_signature).toDateString() === new Date().toDateString())
      .reduce((s, r) => s + Number(r.montant || 0), 0);

    // Ratios perso si assez de data, sinon typique
    const decrochesMois = callsMois.filter((c) =>
      ["DECROCHE", "RDV", "REFUS", "EXISTE_PAS"].includes(c.resultat)
    ).length;
    const rdvMois = callsMois.filter((c) => c.resultat === "RDV").length;
    const ventesMois = revenusMois.length;

    let ratios: Ratios;
    if (callsMois.length >= MIN_CALLS_FOR_PERSO_RATIO) {
      ratios = {
        tauxDecroche: decrochesMois / Math.max(1, callsMois.length),
        tauxRdvParDecroche: rdvMois / Math.max(1, decrochesMois),
        tauxClosing: ventesMois / Math.max(1, rdvMois),
        source: "perso",
      };
    } else {
      ratios = { ...RATIOS_TYPIQUES, source: "typique" };
    }

    const revenuMois = revenusMois.reduce((s, r) => s + Number(r.montant || 0), 0);

    return {
      callsAujTotal,
      callsAujMission,
      decrochesAuj,
      rdvAuj,
      revenuAuj,
      callsMoisTotal: callsMois.length,
      rdvMois,
      ventesMois,
      revenuMois,
      ratios,
    };
  }, [calls, revenus]);

  const streak = useMemo(() => computeStreak(calls), [calls]);

  const deadline = useMemo(() => new Date(deadlineStr + "T00:00:00"), [deadlineStr]);
  const joursOuvresRestants = useMemo(() => businessDaysUntil(deadline), [deadline]);

  // Projection : si Aaron continue à ce rythme de calls/jour ouvré
  // rythme moyen = callsMois / jours ouvrés écoulés dans le mois
  const joursOuvresEcoulesMois = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    let count = 0;
    const cur = new Date(start);
    while (cur <= now) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  }, []);

  const rythmeMoyen = data.callsMoisTotal / joursOuvresEcoulesMois; // calls/jour ouvré
  const joursOuvresFinMois = useMemo(() => {
    const now = new Date();
    const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    let count = 0;
    const cur = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cur <= fin) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, []);

  const callsProjetesFinMois = Math.round(rythmeMoyen * joursOuvresFinMois);
  const rdvProjetes = callsProjetesFinMois * data.ratios.tauxDecroche * data.ratios.tauxRdvParDecroche;
  const ventesProjetees = rdvProjetes * data.ratios.tauxClosing;
  const revenuProjete = Math.round(ventesProjetees * prixSite);
  const manqueProjete = Math.max(0, objectif - revenuProjete);

  // Rythme nécessaire pour atteindre objectif à deadline
  const ventesManquantes = Math.max(0, (objectif - data.revenuMois) / prixSite);
  const rdvNecessaires = ventesManquantes / data.ratios.tauxClosing;
  const decrochesNecessaires = rdvNecessaires / data.ratios.tauxRdvParDecroche;
  const callsNecessaires = decrochesNecessaires / data.ratios.tauxDecroche;
  const callsParJourNecessaires = joursOuvresRestants > 0
    ? Math.ceil(callsNecessaires / joursOuvresRestants)
    : Math.ceil(callsNecessaires);

  const progressPct = Math.min(100, Math.round((data.callsAujMission / dailyTarget) * 100));
  const dailyDone = data.callsAujMission >= dailyTarget;
  const weekend = isWeekend();

  // Message principal
  let projectionMessage: string;
  let projectionColor = "var(--text-secondary)";
  if (data.revenuMois >= objectif) {
    projectionMessage = `Objectif ${objectif}€ déjà atteint. Tout ce qui vient est du bonus.`;
    projectionColor = "var(--accent-green)";
  } else if (data.callsMoisTotal === 0) {
    projectionMessage = `Lance les hostilités : ${dailyTarget} calls / jour pour rester dans la course.`;
    projectionColor = "var(--accent-orange)";
  } else if (manqueProjete > 0) {
    projectionMessage = `À ce rythme → ~${ventesProjetees.toFixed(1)} ventes = ${revenuProjete.toLocaleString("fr-FR")} € fin du mois. Manque ${manqueProjete.toLocaleString("fr-FR")} €.`;
    projectionColor = "var(--accent-red)";
  } else {
    projectionMessage = `À ce rythme → ~${ventesProjetees.toFixed(1)} ventes = ${revenuProjete.toLocaleString("fr-FR")} € fin du mois. Objectif tenu.`;
    projectionColor = "var(--accent-green)";
  }

  return (
    <div className="rounded-2xl border p-6 bg-[var(--surface-1)]"
      style={{ borderColor: "var(--border-primary)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--accent-cyan)]" />
          <h2 className="text-[14px] font-semibold">Rythme du jour</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}>
            ratios {data.ratios.source === "perso" ? "persos" : "typiques BTP"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 text-[var(--accent-orange)] font-semibold">
              <Flame size={12} /> streak {streak}j
            </span>
          )}
          <span>J-{joursOuvresRestants} jours ouvrés</span>
        </div>
      </div>

      {/* Funnel 4 colonnes — aujourd'hui */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <FunnelCell
          icon={<Phone size={13} />}
          label="Calls"
          value={data.callsAujMission}
          target={dailyTarget}
          color="var(--accent-orange)"
          primary
        />
        <FunnelCell
          icon={<CheckCircle2 size={13} />}
          label="Décrochés"
          value={data.decrochesAuj}
          sub={`${data.callsAujTotal > 0 ? Math.round((data.decrochesAuj / data.callsAujTotal) * 100) : 0}%`}
          color="var(--accent-blue)"
        />
        <FunnelCell
          icon={<Calendar size={13} />}
          label="RDV"
          value={data.rdvAuj}
          sub={`${data.decrochesAuj > 0 ? Math.round((data.rdvAuj / data.decrochesAuj) * 100) : 0}% des décr.`}
          color="var(--accent-purple)"
        />
        <FunnelCell
          icon={<Banknote size={13} />}
          label="Revenu"
          value={`${data.revenuAuj.toLocaleString("fr-FR")} €`}
          sub="aujourd'hui"
          color="var(--accent-green)"
        />
      </div>

      {/* Progress bar objectif du jour */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-[var(--text-secondary)] font-medium">
            {data.callsAujMission} / {dailyTarget} calls
          </span>
          <span className="font-semibold tabular-nums" style={{
            color: dailyDone ? "var(--accent-green)" : data.callsAujMission > 0 ? "var(--accent-orange)" : "var(--text-tertiary)",
          }}>
            {progressPct}%
            {dailyDone && " ✓ mission faite"}
          </span>
        </div>
        <div className="relative h-[6px] rounded-full overflow-hidden bg-[var(--surface-2)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: dailyDone
                ? "var(--accent-green)"
                : data.callsAujMission > 0 ? "var(--accent-orange)" : "var(--text-tertiary)",
            }}
          />
        </div>
      </div>

      {/* Projection */}
      <div className="p-3 rounded-lg text-[12.5px] flex items-start gap-2 mb-3"
        style={{ background: "var(--surface-2)" }}>
        <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: projectionColor }} />
        <div className="flex-1">
          <p style={{ color: projectionColor }} className="font-semibold leading-snug">
            {projectionMessage}
          </p>
          {manqueProjete > 0 && !weekend && (
            <p className="text-[var(--text-secondary)] mt-1 leading-relaxed">
              Pour finir à {objectif.toLocaleString("fr-FR")} € → passe{" "}
              <span className="font-bold text-[var(--text-primary)]">
                {callsParJourNecessaires} calls / jour ouvré
              </span>{" "}
              d&apos;ici le {new Date(deadlineStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}.
              {data.callsAujMission < callsParJourNecessaires && (
                <>
                  {" "}Aujourd&apos;hui il te reste{" "}
                  <span className="font-bold text-[var(--accent-red)]">
                    {callsParJourNecessaires - data.callsAujMission} calls
                  </span>.
                </>
              )}
            </p>
          )}
          {weekend && (
            <p className="text-[var(--text-tertiary)] mt-1 leading-relaxed italic">
              Week-end — pas d&apos;objectif imposé. Reprise lundi.
            </p>
          )}
        </div>
      </div>

      {/* Mini-stats mois */}
      <div className="grid grid-cols-4 gap-2 text-[11px]">
        <MiniPill label="Mois" value={`${data.callsMoisTotal}`} sub="calls" />
        <MiniPill label="RDV mois" value={`${data.rdvMois}`} sub={`taux ${data.callsMoisTotal > 0 ? Math.round((data.rdvMois / data.callsMoisTotal) * 100) : 0}%`} />
        <MiniPill label="Ventes" value={`${data.ventesMois}`} sub={`${data.revenuMois.toLocaleString("fr-FR")} €`} />
        <MiniPill
          label="Restant"
          value={`${Math.max(0, objectif - data.revenuMois).toLocaleString("fr-FR")} €`}
          sub={`sur ${objectif.toLocaleString("fr-FR")} €`}
        />
      </div>
    </div>
  );
}

/* ───── sous-composants ───── */

function FunnelCell({
  icon, label, value, sub, target, color, primary,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  target?: number;
  color: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${primary ? "border-2" : "border"}`}
      style={{
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} ${primary ? 45 : 20}%, transparent)`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <p className="text-[10px] uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className="text-[22px] font-black tabular-nums leading-none" style={{ color }}>
        {value}
        {target !== undefined && (
          <span className="text-[11px] font-semibold text-[var(--text-tertiary)] ml-1">
            / {target}
          </span>
        )}
      </p>
      {sub && <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">{sub}</p>}
    </div>
  );
}

function MiniPill({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-2.5 py-2 rounded-md" style={{ background: "var(--surface-2)" }}>
      <p className="text-[9px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">{label}</p>
      <p className="text-[13px] font-bold tabular-nums text-[var(--text-primary)] leading-tight">{value}</p>
      <p className="text-[10px] text-[var(--text-tertiary)]">{sub}</p>
    </div>
  );
}
