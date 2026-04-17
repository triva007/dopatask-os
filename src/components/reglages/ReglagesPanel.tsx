"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Brain, Shield, Download, Upload, Trash2, ChevronRight,
  Volume2, VolumeX, Users, Zap, Target, BarChart3, AlertCircle
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

function SettingRow({ icon: Icon, label, description, badge, color = "var(--text-secondary)", onClick, isClickable = false }: {
  icon: typeof Settings; label: string; description: string; badge?: string; color?: string; onClick?: () => void; isClickable?: boolean;
}) {
  let badgeStyle = { background: "var(--surface-4)", color: "var(--text-secondary)" };
  if (badge === "Danger") {
    badgeStyle = { background: "var(--accent-red-light)", color: "var(--accent-red)" };
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-3xl transition-all group ${isClickable ? "cursor-pointer hover:bg-surface-2" : "cursor-default"} bg-surface border-b-primary`}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
        style={{ background: `${color}12` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>{label}</p>
          {badge && (
            <span className="text-[8px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
              style={badgeStyle}>{badge}</span>
          )}
        </div>
        <p className="text-[11px] text-t-secondary mt-0.5 leading-relaxed">{description}</p>
      </div>
      {isClickable && <ChevronRight size={14} className="text-b-hover shrink-0 transition-all group-hover:text-t-secondary" />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-medium text-t-secondary uppercase tracking-widest px-1">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ConfirmationModal({ title, message, confirmText, onConfirm, onCancel, isDangerous = false }: {
  title: string; message: string; confirmText?: string; onConfirm: () => void; onCancel: () => void; isDangerous?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const requiresInput = confirmText === "RESET";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface rounded-3xl max-w-sm w-full border border-b-primary p-6 shadow-lg"
        >
          <div className="flex items-start gap-3 mb-4">
            {isDangerous && <AlertCircle size={20} className="text-accent-red shrink-0 mt-0.5" />}
            <div>
              <h2 className="text-lg font-semibold text-t-primary">{title}</h2>
              <p className="text-sm text-t-secondary mt-2">{message}</p>
            </div>
          </div>

          {requiresInput && (
            <input
              type="text"
              placeholder={`Type "${confirmText}" to confirm`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-2xl bg-empty-bg border border-b-primary text-t-primary text-sm mt-4 mb-4 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-2xl font-medium text-sm bg-empty-bg text-t-primary transition-all hover:bg-surface-2"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={requiresInput && inputValue !== confirmText}
              className={`flex-1 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all ${
                isDangerous
                  ? "bg-accent-red text-white disabled:opacity-50"
                  : "bg-accent-blue text-white disabled:opacity-50"
              }`}
            >
              {confirmText || "Confirmer"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ReglagesPanel() {
  const {
    xp, streak, tasks, objectives, projects, journalEntries, hyperfocusSessions, theme, setTheme,
    bossLevel, totalTasksCompleted, totalFocusMinutes, unlockedAchievements,
    settings, updateSettings
  } = useAppStore();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showTdahModal, setShowTdahModal] = useState(false);
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);
  const [showMaxTasksModal, setShowMaxTasksModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "completed").length;

  // Data export function
  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      data: {
        tasks,
        projects,
        objectives,
        journalEntries,
        hyperfocusSessions,
        stats: {
          xp,
          streak,
          bossLevel,
          totalTasksCompleted,
          totalFocusMinutes,
          unlockedAchievements: unlockedAchievements?.length || 0,
        },
        settings,
      },
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dopat ask-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Data import function
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData.data) {
          const { tasks: importedTasks, projects: importedProjects, objectives: importedObjectives, journalEntries: importedEntries, hyperfocusSessions: importedSessions, settings: importedSettings } = importedData.data;

          useAppStore.setState({
            tasks: importedTasks || [],
            projects: importedProjects || [],
            objectives: importedObjectives || [],
            journalEntries: importedEntries || [],
            hyperfocusSessions: importedSessions || [],
            settings: { ...settings, ...importedSettings },
          });

          alert("Données importées avec succès!");
        }
      } catch {
        alert("Erreur lors de l'import. Vérifiez le format du fichier JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Reset data function
  const handleResetData = () => {
    useAppStore.setState({
      tasks: [],
      projects: [],
      objectives: [],
      journalEntries: [],
      hyperfocusSessions: [],
      xp: 0,
      streak: 0,
      bossLevel: 0,
      totalTasksCompleted: 0,
      totalFocusMinutes: 0,
      unlockedAchievements: [],
    });
    setShowResetModal(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4 border border-b-primary" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        <h1 className="text-2xl font-semibold text-t-primary tracking-tight flex items-center gap-2.5">
          <Settings size={18} className="text-accent-blue" /> Réglages
        </h1>
        <p className="text-xs text-t-secondary mt-1">Personnalise DopaTask OS</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">

          {/* Enhanced Stats Dashboard */}
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl overflow-hidden bg-surface border border-b-primary"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div className="px-5 py-3 border border-b-primary flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-primary)" }}>
              <BarChart3 size={14} className="text-accent-blue" />
              <p className="text-[10px] font-medium text-t-secondary uppercase tracking-wider">Statistiques</p>
            </div>
            <div className="grid grid-cols-4 gap-px bg-border-b-primary p-px">
              {[
                { label: "XP total",      value: xp,               color: "var(--accent-orange)" },
                { label: "Tâches faites", value: doneTasks,        color: "var(--accent-blue)" },
                { label: "Streak",        value: `${streak} 🔥`,  color: "var(--accent-red)" },
                { label: "Boss Level",    value: bossLevel,        color: "var(--accent-purple)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center py-4 gap-1 bg-surface">
                  <span className="text-lg font-semibold tabular-nums" style={{ color }}>{value}</span>
                  <span className="text-[10px] text-t-secondary text-center">{label}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t-primary" style={{ borderTop: "1px solid var(--border-primary)" }}>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Focus total", value: `${totalFocusMinutes}m`, icon: Zap, color: "var(--accent-orange)" },
                  { label: "Journal", value: journalEntries.length, icon: Target, color: "var(--accent-green)" },
                  { label: "Achievements", value: unlockedAchievements?.length || 0, icon: Target, color: "var(--accent-purple)" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <Icon size={12} style={{ color }} />
                    <span className="text-[10px] text-t-secondary">{label}</span>
                    <span className="text-sm font-semibold text-t-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Theme Switcher */}
          <Section title="Thème">
            <div className="flex gap-2 p-3 rounded-3xl bg-surface border border-b-primary">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all ${theme === "light" ? "bg-accent-blue text-white" : "bg-empty-bg text-t-primary"}`}
              >
                🌞 Apple Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all ${theme === "dark" ? "bg-accent-blue text-white" : "bg-empty-bg text-t-primary"}`}
              >
                🌙 Dark OLED
              </button>
            </div>
          </Section>

          {/* TDAH Profile Section */}
          <Section title="Profil TDAH">
            <button
              onClick={() => setShowTdahModal(true)}
              className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary transition-all hover:bg-surface-2 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{ background: "var(--accent-orange)12" }}>
                  <Brain size={15} style={{ color: "var(--accent-orange)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Profil TDAH</p>
                  <p className="text-[11px] text-t-secondary mt-0.5 leading-relaxed">
                    Sélectionné: {settings.tdahSubtype || "Non défini"}
                  </p>
                </div>
                <ChevronRight size={14} className="text-b-hover shrink-0" />
              </div>
            </button>
          </Section>

          {/* Pomodoro & Daily Tasks Settings */}
          <Section title="Paramètres de productivité">
            <button
              onClick={() => setShowPomodoroModal(true)}
              className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary transition-all hover:bg-surface-2 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-red)12" }}>
                  <Zap size={15} style={{ color: "var(--accent-red)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Durée Pomodoro</p>
                  <p className="text-[11px] text-t-secondary mt-0.5">{settings.pomodoroDefault || 25} minutes</p>
                </div>
                <ChevronRight size={14} className="text-b-hover shrink-0" />
              </div>
            </button>

            <button
              onClick={() => setShowMaxTasksModal(true)}
              className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary transition-all hover:bg-surface-2 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-green)12" }}>
                  <Target size={15} style={{ color: "var(--accent-green)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Tâches par jour max</p>
                  <p className="text-[11px] text-t-secondary mt-0.5">{settings.maxDailyTasks || 5} tâches</p>
                </div>
                <ChevronRight size={14} className="text-b-hover shrink-0" />
              </div>
            </button>
          </Section>

          {/* Sound & Body Doubling Settings */}
          <Section title="Audio et focus">
            <div className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-purple)12" }}>
                  {settings.enableSounds ? (
                    <Volume2 size={15} style={{ color: "var(--accent-purple)" }} />
                  ) : (
                    <VolumeX size={15} style={{ color: "var(--accent-purple)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Sons activés</p>
                  <p className="text-[11px] text-t-secondary mt-0.5">Notifications sonores et timers</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ enableSounds: !settings.enableSounds })}
                className={`w-12 h-7 rounded-full transition-all flex items-center ${
                  settings.enableSounds ? "bg-accent-blue" : "bg-empty-bg"
                } p-1`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${settings.enableSounds ? "translate-x-5" : ""}`} />
              </button>
            </div>

            <div className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-blue)12" }}>
                  <Users size={15} style={{ color: "var(--accent-blue)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Body Doubling</p>
                  <p className="text-[11px] text-t-secondary mt-0.5">Afficher l&apos;indicateur de productivité</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ showBodyDoubling: !settings.showBodyDoubling })}
                className={`w-12 h-7 rounded-full transition-all flex items-center ${
                  settings.showBodyDoubling ? "bg-accent-blue" : "bg-empty-bg"
                } p-1`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${settings.showBodyDoubling ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </Section>

          {/* Data Management Section */}
          <Section title="Données">
            <button
              onClick={handleExportData}
              className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary transition-all hover:bg-surface-2 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-green)12" }}>
                  <Download size={15} style={{ color: "var(--accent-green)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Exporter</p>
                  <p className="text-[11px] text-t-secondary mt-0.5 leading-relaxed">Télécharge tes données en JSON</p>
                </div>
                <ChevronRight size={14} className="text-b-hover shrink-0" />
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary transition-all hover:bg-surface-2 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-purple)12" }}>
                  <Upload size={15} style={{ color: "var(--accent-purple)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Importer</p>
                  <p className="text-[11px] text-t-secondary mt-0.5 leading-relaxed">Restaure tes données depuis un fichier JSON</p>
                </div>
                <ChevronRight size={14} className="text-b-hover shrink-0" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />

            <SettingRow icon={Shield} label="Confidentialité" description="Données locales · Aucun tracking" color="var(--text-secondary)" />

            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-3.5 rounded-3xl bg-surface border border-b-primary transition-all hover:bg-surface-2 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-red)12" }}>
                  <Trash2 size={15} style={{ color: "var(--accent-red)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] text-t-primary" style={{ fontWeight: 450 }}>Réinitialiser</p>
                  <p className="text-[11px] text-t-secondary mt-0.5 leading-relaxed">Supprimer toutes les données</p>
                </div>
                <ChevronRight size={14} className="text-b-hover shrink-0" />
              </div>
            </button>
          </Section>

          <div className="rounded-3xl px-5 py-4 text-center bg-empty-bg border border-b-primary">
            <p className="text-sm text-t-secondary">En construction</p>
            <p className="text-[11px] text-t-secondary mt-1">Sync cloud, notifications avancées, intégrations et plus.</p>
          </div>

          <div className="text-center pt-2">
            <p className="text-[10px] text-t-ghost">DopaTask OS · v4.0</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTdahModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTdahModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-3xl max-w-sm w-full border border-b-primary p-6 shadow-lg"
            >
              <div className="flex items-start gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-t-primary">Profil TDAH</h2>
                  <p className="text-sm text-t-secondary mt-2">Sélectionne ton sous-type TDAH pour des conseils personnalisés</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Inattentif", value: "inattentif" as const },
                  { label: "Hyperactif-Impulsif", value: "hyperactif" as const },
                  { label: "Combiné", value: "mixte" as const }
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => {
                      updateSettings({ tdahSubtype: value });
                      setShowTdahModal(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-sm font-medium transition-all ${
                      settings.tdahSubtype === value
                        ? "bg-accent-orange text-white"
                        : "bg-empty-bg text-t-primary hover:bg-surface-2"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTdahModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-2xl font-medium text-sm bg-empty-bg text-t-primary transition-all hover:bg-surface-2"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {showPomodoroModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPomodoroModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl max-w-sm w-full border border-b-primary p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-t-primary mb-4">Durée Pomodoro</h2>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={settings.pomodoroDefault || 25}
                onChange={(e) => updateSettings({ pomodoroDefault: parseInt(e.target.value) })}
                className="flex-1 h-2 rounded-full bg-empty-bg accent-accent-blue"
              />
              <span className="text-2xl font-semibold text-accent-blue w-16 text-right">{settings.pomodoroDefault || 25}m</span>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPomodoroModal(false)}
                className="flex-1 px-4 py-2.5 rounded-2xl font-medium text-sm bg-accent-blue text-white transition-all hover:bg-accent-blue/90"
              >
                Valider
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showMaxTasksModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMaxTasksModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl max-w-sm w-full border border-b-primary p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-t-primary mb-4">Tâches par jour</h2>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    updateSettings({ maxDailyTasks: num });
                    setShowMaxTasksModal(false);
                  }}
                  className={`py-3 rounded-2xl font-medium transition-all ${
                    settings.maxDailyTasks === num
                      ? "bg-accent-green text-white"
                      : "bg-empty-bg text-t-primary hover:bg-surface-2"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMaxTasksModal(false)}
              className="w-full px-4 py-2.5 rounded-2xl font-medium text-sm bg-accent-blue text-white transition-all hover:bg-accent-blue/90 mt-4"
            >
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}

      {showResetModal && (
        <ConfirmationModal
          title="Réinitialiser les données"
          message="Cette action ne peut pas être annulée. Tapez 'RESET' pour confirmer."
          confirmText="RESET"
          isDangerous
          onConfirm={handleResetData}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}