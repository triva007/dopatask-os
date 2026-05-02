"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { Project } from "@/store/useAppStore";
import { useEffect } from "react";

export default function ProjectDetailView({ project, onBack }: { project: Project; onBack: () => void }) {
  const localTasksCount = useAppStore(s => (s.tasks || []).filter(t => t && t.projectId === project?.id).length);
  const notesCount = useAppStore(s => (s.notes || []).filter(n => n && n.projectId === project?.id).length);

  useEffect(() => {
    console.log("ProjectDetailView Rendered", project);
  }, [project]);

  if (!project) return <div className="p-8">Projet manquant <button onClick={onBack}>Retour</button></div>;

  return (
    <div className="flex flex-col h-full bg-[var(--card-bg)] p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-6">
        <ArrowLeft size={16} /> Retour
      </button>
      
      <div className="flex items-center gap-4 mb-10">
        <span className="text-4xl">{project.emoji || "📁"}</span>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">{project.name || "Sans nom"}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-primary)]">
          <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-2">Tâches</h3>
          <p className="text-3xl font-bold">{localTasksCount}</p>
        </div>
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-primary)]">
          <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-2">Notes</h3>
          <p className="text-3xl font-bold">{notesCount}</p>
        </div>
      </div>

      <div className="mt-10 p-10 border-2 border-dashed rounded-3xl text-center">
        <p className="text-[var(--text-tertiary)]">Vue simplifiée pour diagnostic...</p>
      </div>
    </div>
  );
}
