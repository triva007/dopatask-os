"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Download, Upload, Trash2, ChevronRight,
  Volume2, VolumeX, AlertCircle, Sun, Moon
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import GoogleSyncSection from "./GoogleSyncSection";

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
      className={`flex items-center gap-4 px-4 py-3.5 rounded-3xl transition-all group ${isClickable ? "cursor-pointer hover:bg-[var(--surface-2)]" : "cursor-default"} bg-surface border-b-primary`}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
        style={{ background: `${color}12` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[17px] text-[var(--text-primary)]" style={{ fontWeight: 450 }}>{label}</p>
          {badge && (
            <span className="text-[8px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
              style={badgeStyle}>{badge}</span>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{description}</p>
      </div>
      {isClickable && <ChevronRight size={14} className="text-b-hover shrink-0 transition-all group-hover:text-[var(--text-secondary)]" />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest px-1">{title}</p>
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
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ background: "var(--backdrop-bg)" }}
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
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{message}</p>
            </div>
          </div>

          {requiresInput && (
            <input
              type="text"
              placeholder={`Type "${confirmText}" to confirm`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-xl bg-empty-bg border border-b-primary text-[var(--text-primary)] text-sm mt-4 mb-4 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm bg-empty-bg text-[var(--text-primary)] transition-all hover:bg-[var(--surface-2)]"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={requiresInput && inputValue !== confirmText}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
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
    tasks, objectives, projects, journalEntries, settings, updateSettings, theme, toggleTheme
  } = useAppStore();

  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        settings,
      },
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dopatask-backup-${new Date().toISOString().split("T")[0]}.json`;
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
          const { tasks: importedTasks, projects: importedProjects, objectives: importedObjectives, journalEntries: importedEntries, settings: importedSettings } = importedData.data;

          useAppStore.setState({
            tasks: importedTasks || [],
            projects: importedProjects || [],
            objectives: importedObjectives || [],
            journalEntries: importedEntries || [],
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
    });
    setShowResetModal(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4 border border-b-primary" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
          <Settings size={18} className="text-accent-blue" /> Réglages
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Personnalise Aaron-OS</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">

          <Section title="Synchronisation">
            <GoogleSyncSection />
          </Section>

          {/* Apparence */}
          <Section title="Apparence">
            <SettingRow
              icon={theme === "dark" ? Moon : Sun}
              label={theme === "dark" ? "Mode sombre" : "Mode clair"}
              description="Basculer entre le mode sombre et le mode clair (style Notion)"
              color="var(--accent-purple)"
              onClick={toggleTheme}
              isClickable
            />
          </Section>

          {/* Preferences */}
          <Section title="Préférences">
            <SettingRow
              icon={settings.enableSounds ? Volume2 : VolumeX}
              label="Effets sonores"
              description="Activer ou désactiver les sons d'interface"
              color={settings.enableSounds ? "var(--accent-blue)" : "var(--text-secondary)"}
              onClick={() => updateSettings({ enableSounds: !settings.enableSounds })}
              isClickable
            />
          </Section>

          {/* Data */}
          <Section title="Données & Sécurité">
            <SettingRow
              icon={Download} label="Sauvegarder les données" description="Exporter un fichier JSON de backup" color="var(--accent-green)"
              onClick={handleExportData} isClickable
            />
            <SettingRow
              icon={Upload} label="Restaurer une sauvegarde" description="Importer un fichier JSON" color="var(--accent-blue)"
              onClick={() => fileInputRef.current?.click()} isClickable
            />
            <SettingRow
              icon={Trash2} label="Réinitialiser l'application" description="Effacer toutes vos données" badge="Danger" color="var(--accent-red)"
              onClick={() => setShowResetModal(true)} isClickable
            />
          </Section>

        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportData}
        accept=".json"
        className="hidden"
      />

      {showResetModal && (
        <ConfirmationModal
          title="Réinitialisation totale"
          message="Cette action effacera toutes vos tâches, projets et objectifs. Tapez 'RESET' pour confirmer."
          confirmText="RESET"
          onConfirm={handleResetData}
          onCancel={() => setShowResetModal(false)}
          isDangerous
        />
      )}
    </div>
  );
}