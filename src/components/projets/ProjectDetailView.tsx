"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Circle, FileText, CalendarDays } from "lucide-react";
import type { Project } from "@/store/useAppStore";

export default function ProjectDetailView({ project, onBack }: { project: Project; onBack: () => void }) {
  const tasks = useAppStore(s => s.tasks.filter(t => t.projectId === project.id));
  const notes = useAppStore(s => s.notes.filter(n => n.projectId === project.id));
  const events = useAppStore(s => s.timelineEvents.filter(e => e.linkedProjectId === project.id));
  const toggleTask = useAppStore(s => s.updateTaskStatus);

  const activeTasks = tasks.filter(t => t.status !== "done" && t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "done" || t.status === "completed");

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)]">
        <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-4 transition-colors">
          <ArrowLeft size={14} /> Retour aux projets
        </button>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{project.emoji}</span>
          <div>
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              {project.name}
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2">
              Espace projet
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 space-y-8">
        
        {/* Tâches */}
        <section>
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--accent-blue)]" /> 
            Tâches ({activeTasks.length})
          </h2>
          {activeTasks.length > 0 ? (
            <div className="space-y-2">
              {activeTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-1)]">
                  <button onClick={() => toggleTask(task.id, "completed")} className="mt-0.5 text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] transition-colors">
                    <Circle size={16} />
                  </button>
                  <span className="text-[14px] text-[var(--text-primary)]">{task.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-tertiary)] italic">Aucune tâche en cours.</p>
          )}

          {completedTasks.length > 0 && (
            <div className="mt-4 opacity-60">
              <h3 className="text-[12px] font-medium text-[var(--text-secondary)] mb-2">Terminées ({completedTasks.length})</h3>
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-1)] opacity-70">
                    <button onClick={() => toggleTask(task.id, "today")} className="mt-0.5 text-[var(--accent-green)]">
                      <CheckCircle2 size={16} />
                    </button>
                    <span className="text-[14px] text-[var(--text-primary)] line-through">{task.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Notes */}
        <section>
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FileText size={16} className="text-[var(--accent-purple)]" /> 
            Notes ({notes.length})
          </h2>
          {notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <div key={note.id} className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-1)]">
                  <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">{note.title}</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] line-clamp-3">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-tertiary)] italic">Aucune note liée à ce projet.</p>
          )}
        </section>

        {/* Agenda / Events */}
        <section>
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-[var(--accent-red)]" /> 
            Agenda ({events.length})
          </h2>
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-1)]">
                  <div className="w-2 h-2 rounded-full" style={{ background: ev.color }} />
                  <span className="text-[14px] text-[var(--text-primary)]">{ev.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-tertiary)] italic">Aucun événement lié à ce projet.</p>
          )}
        </section>

      </div>
    </motion.div>
  );
}
