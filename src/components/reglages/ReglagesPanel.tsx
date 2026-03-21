"use client";

import { motion } from "framer-motion";
import {
  Settings, Bell, Palette, Brain, Shield,
  Download, Trash2, ChevronRight, Zap,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

// ─── Setting Row ─────────────────────────────────────────────────────────────

function SettingRow({
  icon: Icon,
  label,
  description,
  badge,
  color = "#52525b",
}: {
  icon: typeof Settings;
  label: string;
  description: string;
  badge?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700/50 group cursor-default" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110"
        style={{ background: `${color}15` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-200">{label}</p>
          {badge && (
            <span className="text-[8px] px-2 py-1 rounded-full font-bold bg-zinc-800/60 text-zinc-400 uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <ChevronRight size={16} className="text-zinc-600 shrink-0 transition-all duration-200 group-hover:text-zinc-400" />
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReglagesPanel() {
  const { xp, streak, tasks, objectives } = useAppStore();
  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "completed").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
          <Settings size={20} className="text-zinc-400" />
          Réglages
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Personnalise ton OS Neuro-Cognitif</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">

          {/* Stats card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border overflow-hidden"
            style={{ background: "linear-gradient(135deg, #06b6d408, #7c3aed08)", borderColor: "rgba(255,255,255,0.04)" }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tes statistiques</p>
            </div>
            <div className="grid grid-cols-4 divide-x" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {[
                { label: "XP total",      value: xp,             icon: Zap,    color: "#f59e0b" },
                { label: "Tâches faites", value: doneTasks,       icon: Brain,  color: "#06b6d4" },
                { label: "Streak",        value: `${streak} 🔥`,  icon: null,   color: "#ef4444" },
                { label: "Objectifs",     value: objectives.length, icon: null, color: "#22c55e" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-4 gap-1">
                  <span className="text-lg font-bold" style={{ color }}>{value}</span>
                  <span className="text-[10px] text-zinc-500 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Settings sections */}
          <Section title="Profil & Préférences">
            <SettingRow
              icon={Bell}
              label="Notifications"
              description="Rappels de tâches, alertes streak, résumé quotidien"
              badge="Bientôt"
              color="#06b6d4"
            />
            <SettingRow
              icon={Palette}
              label="Thème & Couleurs"
              description="Personnalise les couleurs de ton espace de travail"
              badge="Bientôt"
              color="#7c3aed"
            />
            <SettingRow
              icon={Brain}
              label="Profil TDAH"
              description="Ajuste l'expérience selon ton sous-type (inattentif, hyperactif, mixte)"
              badge="Bientôt"
              color="#f59e0b"
            />
          </Section>

          <Section title="Données & Confidentialité">
            <SettingRow
              icon={Download}
              label="Exporter mes données"
              description="Télécharge toutes tes tâches, objectifs et sessions en JSON"
              badge="Bientôt"
              color="#22c55e"
            />
            <SettingRow
              icon={Shield}
              label="Confidentialité"
              description="Tes données restent locales · Aucun tracking · Open source"
              color="#52525b"
            />
            <SettingRow
              icon={Trash2}
              label="Réinitialiser"
              description="Supprimer toutes les données locales et repartir à zéro"
              badge="Danger"
              color="#ef4444"
            />
          </Section>

          {/* Coming soon banner */}
          <div
            className="rounded-2xl border px-6 py-5 text-center transition-all duration-200 hover:border-zinc-700/50"
            style={{ background: "rgba(9,9,11,0.5)", borderColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-sm font-semibold text-zinc-400">⚙️ Page en cours de construction</p>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              Les réglages avancés arrivent prochainement :<br />
              sync cloud, notifications, profils neuro-cognitifs et plus.
            </p>
          </div>

          {/* Version footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-zinc-700 font-medium">DopaTask OS · v0.1.0 · Neuro-Cognitif pour TDAH</p>
          </div>

        </div>
      </div>
    </div>
  );
}