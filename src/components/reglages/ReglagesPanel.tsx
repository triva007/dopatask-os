"use client";

import { motion } from "framer-motion";
import { Settings, Bell, Palette, Brain, Shield, Download, Trash2, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

function SettingRow({ icon: Icon, label, description, badge, color = "#52525b" }: {
  icon: typeof Settings; label: string; description: string; badge?: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group cursor-default"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
        style={{ background: `${color}10` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-200" style={{ fontWeight: 450 }}>{label}</p>
          {badge && (
            <span className="text-[8px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
              style={{ background: "rgba(255,255,255,0.04)", color: "#71717a" }}>{badge}</span>
          )}
        </div>
        <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ChevronRight size={14} className="text-zinc-700 shrink-0 transition-all group-hover:text-zinc-500" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-1">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export default function ReglagesPanel() {
  const { xp, streak, tasks, objectives } = useAppStore();
  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "completed").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <Settings size={18} className="text-zinc-400" /> Réglages
        </h1>
        <p className="text-xs text-zinc-600 mt-1">Personnalise DopaTask OS</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Statistiques</p>
            </div>
            <div className="grid grid-cols-4">
              {[
                { label: "XP total",      value: xp,               color: "#fbbf24" },
                { label: "Tâches faites", value: doneTasks,        color: "#67e8f9" },
                { label: "Streak",        value: `${streak} 🔥`,  color: "#fca5a5" },
                { label: "Objectifs",     value: objectives.length, color: "#4ade80" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-4 gap-1">
                  <span className="text-lg font-semibold tabular-nums" style={{ color }}>{value}</span>
                  <span className="text-[10px] text-zinc-600 text-center">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <Section title="Profil">
            <SettingRow icon={Bell} label="Notifications" description="Rappels, alertes streak, résumé quotidien" badge="Bientôt" color="#67e8f9" />
            <SettingRow icon={Palette} label="Thème" description="Personnalise les couleurs" badge="Bientôt" color="#a78bfa" />
            <SettingRow icon={Brain} label="Profil TDAH" description="Ajuste selon ton sous-type" badge="Bientôt" color="#fbbf24" />
          </Section>

          <Section title="Données">
            <SettingRow icon={Download} label="Exporter" description="Télécharge tes données en JSON" badge="Bientôt" color="#4ade80" />
            <SettingRow icon={Shield} label="Confidentialité" description="Données locales · Aucun tracking" color="#71717a" />
            <SettingRow icon={Trash2} label="Réinitialiser" description="Supprimer toutes les données" badge="Danger" color="#fca5a5" />
          </Section>

          <div className="rounded-2xl px-5 py-4 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-sm text-zinc-500">En construction</p>
            <p className="text-[11px] text-zinc-700 mt-1">Sync cloud, notifications, profils neuro-cognitifs et plus.</p>
          </div>

          <div className="text-center pt-2">
            <p className="text-[10px] text-zinc-700">DopaTask OS · v4.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}