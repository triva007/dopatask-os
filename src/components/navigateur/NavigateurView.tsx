"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { Eye, Target, FolderKanban, ListChecks, Map as MapIcon } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

// --- Types for internal map nodes ---
interface Node {
  id: string;
  type: "vision" | "objective" | "project" | "task";
  title: string;
  color: string;
  parentId?: string;
  progress?: number;
  emoji?: string;
}

export default function NavigateurView() {
  const { lifeGoals, objectives, projects, tasks } = useAppStore();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineCoords, setLineCoords] = useState<{ id: string; from: { x: number; y: number }; to: { x: number; y: number }; active: boolean }[]>([]);

  // 1. Build the flat node structure with relationships
  const nodes = useMemo(() => {
    const list: Node[] = [];

    // Vision (Root)
    lifeGoals.forEach((lg) => {
      list.push({ id: lg.id, type: "vision", title: lg.title, color: lg.color });
    });

    // Objectives (Children of Vision - though currently store doesn't link LG to Obj explicitly, 
    // we assume all objectives flow from vision)
    objectives.forEach((obj) => {
      list.push({ id: obj.id, type: "objective", title: obj.title, color: obj.color, progress: obj.progress });
    });

    // Projects (Children of Objectives)
    projects.forEach((proj) => {
      list.push({ 
        id: proj.id, 
        type: "project", 
        title: proj.name, 
        color: proj.color, 
        emoji: proj.emoji,
        parentId: proj.objectiveId 
      });
    });

    // Tasks (Children of Projects)
    tasks.filter(t => t.status !== "done" && t.status !== "completed").forEach((task) => {
      list.push({ 
        id: task.id, 
        type: "task", 
        title: task.text, 
        color: "var(--accent-blue)", 
        parentId: task.projectId 
      });
    });

    return list;
  }, [lifeGoals, objectives, projects, tasks]);

  // 2. Determine connections
  const connections = useMemo(() => {
    const conn: { from: string; to: string }[] = [];
    
    // Link Objectives to Vision (All objectives link to the first vision for now as a default map flow)
    if (lifeGoals.length > 0) {
      objectives.forEach(obj => {
        conn.push({ from: lifeGoals[0].id, to: obj.id });
      });
    }

    // Link Projects to Objectives
    projects.forEach(p => {
      if (p.objectiveId) conn.push({ from: p.objectiveId, to: p.id });
    });

    // Link Tasks to Projects
    tasks.filter(t => t.status !== "done" && t.status !== "completed").forEach(t => {
      if (t.projectId) conn.push({ from: t.projectId, to: t.id });
    });

    return conn;
  }, [lifeGoals, objectives, projects, tasks]);

  // 3. Update lines on render/resize
  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      
      const newLines = connections.map(c => {
        const fromEl = document.getElementById(`node-${c.from}`);
        const toEl = document.getElementById(`node-${c.to}`);
        
        if (fromEl && toEl) {
          const containerRect = containerRef.current!.getBoundingClientRect();
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          return {
            id: `${c.from}-${c.to}`,
            from: { 
              x: fromRect.right - containerRect.left, 
              y: fromRect.top + fromRect.height / 2 - containerRect.top 
            },
            to: { 
              x: toRect.left - containerRect.left, 
              y: toRect.top + toRect.height / 2 - containerRect.top 
            },
            active: hoveredNodeId === c.from || hoveredNodeId === c.to
          };
        }
        return null;
      }).filter(Boolean) as any[];

      setLineCoords(newLines);
    };

    updateLines();
    window.addEventListener("resize", updateLines);
    return () => window.removeEventListener("resize", updateLines);
  }, [connections, hoveredNodeId, nodes]);

  // Helper for grouping by type (columns)
  const columns = [
    { type: "vision", title: "Vision", Icon: Eye, items: nodes.filter(n => n.type === "vision") },
    { type: "objective", title: "Objectifs", Icon: Target, items: nodes.filter(n => n.type === "objective") },
    { type: "project", title: "Projets", Icon: FolderKanban, items: nodes.filter(n => n.type === "project") },
    { type: "task", title: "Actions", Icon: ListChecks, items: nodes.filter(n => n.type === "task") },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none flex items-center gap-3">
            <MapIcon size={24} className="text-[var(--accent-purple)]" />
            Navigateur de Connexions
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2">
            Visualise ton plan clair de la vision jusqu'aux actions.
          </p>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative overflow-auto p-12 select-none" ref={containerRef}>
        {/* SVG Background Layer for Lines */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full min-h-[1000px]" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--border-primary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--border-primary)" stopOpacity="0.5" />
            </linearGradient>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orientation="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="var(--border-primary)" opacity="0.5" />
            </marker>
          </defs>
          {lineCoords.map(line => (
            <path
              key={line.id}
              d={`M ${line.from.x} ${line.from.y} C ${line.from.x + 50} ${line.from.y}, ${line.to.x - 50} ${line.to.y}, ${line.to.x} ${line.to.y}`}
              fill="none"
              stroke={line.active ? "var(--accent-blue)" : "var(--border-primary)"}
              strokeWidth={line.active ? 2 : 1}
              strokeDasharray={line.active ? "0" : "4 4"}
              className="transition-all duration-300"
              style={{ opacity: line.active ? 1 : 0.4 }}
            />
          ))}
        </svg>

        {/* Columns of Nodes */}
        <div className="relative z-10 flex gap-24 h-full min-w-max items-start">
          {columns.map((col) => (
            <div key={col.type} className="flex flex-col gap-8 w-64">
              <div className="flex items-center gap-2 mb-2 px-2">
                <col.Icon size={14} className="text-[var(--text-tertiary)]" />
                <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--text-tertiary)]">{col.title}</h2>
              </div>
              
              <div className="flex flex-col gap-4">
                {col.items.map((node) => (
                  <motion.div
                    key={node.id}
                    id={`node-${node.id}`}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-4 rounded-xl border bg-[var(--card-bg)] transition-all cursor-default"
                    style={{ 
                      borderColor: hoveredNodeId === node.id ? node.color : "var(--border-primary)",
                      boxShadow: hoveredNodeId === node.id ? `0 8px 24px -8px ${node.color}30` : "none"
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {node.emoji ? (
                          <span className="text-lg">{node.emoji}</span>
                        ) : (
                          <div className="w-2 h-2 rounded-full" style={{ background: node.color }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
                          {node.title}
                        </p>
                        {node.progress !== undefined && (
                          <div className="mt-2 space-y-1">
                            <div className="h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${node.progress}%`, background: node.color }} />
                            </div>
                            <span className="text-[9px] font-bold text-[var(--text-tertiary)] tabular-nums">{node.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {col.items.length === 0 && (
                  <div className="py-8 px-4 rounded-xl border border-dashed border-[var(--border-primary)] text-center">
                    <p className="text-[10px] text-[var(--text-tertiary)] italic">Aucun {col.title.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
