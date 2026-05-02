"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CalendarEvent, CalendarInfo } from "../useCalendarEvents";
import { getEventStart, getEventEnd, isAllDay, formatTime, getEventColor, isSameDay, addDays } from "../useCalendarEvents";
import { useAppStore } from "@/store/useAppStore";

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  calendars: CalendarInfo[];
  onEventClick: (ev: CalendarEvent, rect: { top: number; left: number }) => void;
  onSlotClick: (date: Date) => void;
  onSlotSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (ev: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventDelete?: (ev: CalendarEvent) => void;
  onEventColorChange?: (ev: CalendarEvent, colorId: string) => void;
  onTaskDrop?: (taskText: string, start: Date, end: Date) => void;
}

const GOOGLE_COLORS: Record<string, string> = {
  '1': '#a4bdfc',
  '2': '#7ae7bf',
  '3': '#dbadff',
  '4': '#ff887c',
  '5': '#fbd75b',
  '6': '#ffb878',
  '7': '#46d6db',
  '8': '#e1e1e1',
  '9': '#5484ed',
  '10': '#51b749',
  '11': '#dc2127',
};

const HOUR_HEIGHT = 60; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_EVENT_HEIGHT = 18;

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((ev) => {
    if (isAllDay(ev)) return false;
    const start = getEventStart(ev);
    return isSameDay(start, day);
  });
}

function getAllDayEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((ev) => {
    if (!isAllDay(ev)) return false;
    const start = getEventStart(ev);
    const end = getEventEnd(ev);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return start <= dayEnd && end > dayStart;
  });
}

function timeToY(d: Date): number {
  return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
}

interface LayoutEvent {
  ev: CalendarEvent;
  top: number;
  height: number;
  col: number;
  totalCols: number;
}

function layoutEvents(events: CalendarEvent[]): LayoutEvent[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());
  const layouts: LayoutEvent[] = [];
  const columns: { end: number }[][] = [];
  for (const ev of sorted) {
    const top = timeToY(getEventStart(ev));
    const rawH = timeToY(getEventEnd(ev)) - top;
    const height = Math.max(rawH, MIN_EVENT_HEIGHT);
    let placed = false;
    for (let g = 0; g < columns.length; g++) {
      const group = columns[g];
      let col = -1;
      for (let c = 0; c < group.length; c++) {
        if (group[c].end <= top) { col = c; break; }
      }
      if (col === -1) col = group.length;
      if (col < group.length) group[col] = { end: top + height };
      else group.push({ end: top + height });
      layouts.push({ ev, top, height, col, totalCols: group.length });
      placed = true;
      break;
    }
    if (!placed) {
      columns.push([{ end: top + height }]);
      layouts.push({ ev, top, height, col: 0, totalCols: 1 });
    }
  }
  for (let i = 0; i < layouts.length; i++) {
    let maxCols = layouts[i].totalCols;
    for (let j = 0; j < layouts.length; j++) {
      if (i === j) continue;
      const iEnd = layouts[i].top + layouts[i].height;
      const jEnd = layouts[j].top + layouts[j].height;
      if (layouts[i].top < jEnd && layouts[j].top < iEnd) {
        maxCols = Math.max(maxCols, layouts[j].col + 1, layouts[i].col + 1);
      }
    }
    layouts[i].totalCols = maxCols;
  }
  return layouts;
}

export default function TimeGrid({ days, events, calendars, onEventClick, onSlotClick, onSlotSelect, onEventDrop, onEventDelete, onEventColorChange, onTaskDrop }: TimeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragEvent, setDragEvent] = useState<{ ev: CalendarEvent; offsetY: number; currentY: number; currentX: number; startY: number; startX: number; hasMoved: boolean } | null>(null);
  const [draggedTaskOver, setDraggedTaskOver] = useState<{ dayIndex: number; top: number } | null>(null);
  const [selection, setSelection] = useState<{ startY: number; currentY: number; dayIndex: number; startTop: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ev: CalendarEvent } | null>(null);

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const nowY = useMemo(() => timeToY(new Date()), []);

  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = Math.max(0, nowY - 100);
  }, [nowY]);

  const isMultiDay = days.length > 1;

  const handleGridMouseDown = useCallback((dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".cal-event")) return;
    if (e.button !== 0) return; // Left click only for selection
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setSelection({ startY: e.clientY, currentY: e.clientY, dayIndex, startTop: y });
  }, []);

  const handleEventMouseDown = useCallback((ev: CalendarEvent, e: React.MouseEvent) => {
    if (e.button === 2) return; // Right click handled separately
    if (!onEventDrop) return;
    e.stopPropagation();
    e.preventDefault();
    
    const rect = gridRef.current?.getBoundingClientRect();
    const scrollTop = gridRef.current?.scrollTop || 0;
    const origTop = timeToY(getEventStart(ev));
    const offsetY = rect ? (e.clientY - rect.top + scrollTop - origTop) : 0;
    
    setDragEvent({
      ev,
      offsetY,
      currentY: e.clientY,
      currentX: e.clientX,
      startY: e.clientY,
      startX: e.clientX,
      hasMoved: false
    });
  }, [onEventDrop]);

  const handleContextMenu = useCallback((ev: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, ev });
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragEvent) {
        setDragEvent(prev => {
          if (!prev) return null;
          const moved = prev.hasMoved || Math.abs(e.clientY - prev.startY) > 3 || Math.abs(e.clientX - prev.startX) > 3;
          return { ...prev, currentY: e.clientY, currentX: e.clientX, hasMoved: moved };
        });
      } else if (selection) {
        setSelection(prev => prev ? { ...prev, currentY: e.clientY } : null);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (dragEvent && onEventDrop && gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const gutterWidth = 52;
        const gridWidth = rect.width - gutterWidth;
        const dayWidth = gridWidth / days.length;
        
        const relativeX = e.clientX - rect.left - gutterWidth;
        let newDayIndex = Math.floor(relativeX / dayWidth);
        newDayIndex = Math.max(0, Math.min(days.length - 1, newDayIndex));
        
        const relativeY = e.clientY - rect.top + gridRef.current.scrollTop;
        const newTop = Math.max(0, relativeY - dragEvent.offsetY);
        const hour = Math.floor(newTop / HOUR_HEIGHT);
        const minutes = Math.round(((newTop % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;

        const origStart = getEventStart(dragEvent.ev);
        const origEnd = getEventEnd(dragEvent.ev);
        const duration = origEnd.getTime() - origStart.getTime();

        const newStart = new Date(days[newDayIndex]);
        newStart.setHours(hour, minutes, 0, 0);
        const newEnd = new Date(newStart.getTime() + duration);

        if (origStart.getTime() !== newStart.getTime() && dragEvent.hasMoved) {
          onEventDrop(dragEvent.ev, newStart, newEnd);
        } else if (!dragEvent.hasMoved) {
          // If it didn't move, treat as click manually just in case
          const btn = gridRef.current.querySelector(`[data-event-id="${dragEvent.ev.id}"]`);
          if (btn && onEventClick) {
            const r = btn.getBoundingClientRect();
            onEventClick(dragEvent.ev, { top: r.top, left: r.right });
          }
        }
        setDragEvent(null);
      } else if (selection) {
        const deltaY = e.clientY - selection.startY;
        if (Math.abs(deltaY) < 5) {
          const hour = Math.floor(selection.startTop / HOUR_HEIGHT);
          const minutes = Math.round(((selection.startTop % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
          const d = new Date(days[selection.dayIndex]);
          d.setHours(hour, minutes, 0, 0);
          onSlotClick(d);
        } else if (onSlotSelect) {
          const endTop = selection.startTop + deltaY;
          const top = Math.max(0, Math.min(selection.startTop, endTop));
          const bottom = Math.max(0, Math.max(selection.startTop, endTop));
          const startHour = Math.floor(top / HOUR_HEIGHT);
          const startMin = Math.round(((top % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
          const endHour = Math.floor(bottom / HOUR_HEIGHT);
          const endMin = Math.round(((bottom % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
          const startD = new Date(days[selection.dayIndex]);
          startD.setHours(startHour, startMin, 0, 0);
          const endD = new Date(days[selection.dayIndex]);
          endD.setHours(endHour, endMin, 0, 0);
          if (startD.getTime() !== endD.getTime()) onSlotSelect(startD, endD);
          else onSlotClick(startD);
        }
        setSelection(null);
      }
    };

    if (dragEvent || selection) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragEvent, selection, days, onEventDrop, onSlotClick, onSlotSelect]);

  const allDayRows = days.map((day) => getAllDayEventsForDay(events, day).filter(ev => ev.type !== "task"));
  const hasAllDay = allDayRows.some((r) => r.length > 0);

  const tasksRows = days.map((day) => events.filter(ev => ev.type === "task" && isSameDay(getEventStart(ev), day)));
  const hasTasksRows = tasksRows.some(r => r.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden select-none" onContextMenu={e => e.preventDefault()}>
      {hasTasksRows && (
        <div className="shrink-0 flex border-b bg-[var(--surface-1)]" style={{ borderColor: "var(--border-primary)" }}>
          <div className="shrink-0 w-[52px] text-right pr-2 py-1.5">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Tâches</span>
          </div>
          {days.map((day, di) => (
            <div key={di} className="flex-1 min-w-0 flex flex-col gap-1 p-1 border-l" style={{ borderColor: "var(--border-primary)" }}>
                {tasksRows[di].map((ev) => {
                  const color = getEventColor(ev, calendars);
                  const projectId = useAppStore.getState().googleTaskProjects[ev.id];
                  const project = projectId ? useAppStore.getState().projects.find(p => p.id === projectId) : null;
                  return (
                    <button
                      key={`task-top-${ev.id}`}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onEventClick(ev, { top: rect.top, left: rect.right });
                      }}
                      onContextMenu={(e) => handleContextMenu(ev, e)}
                      className="flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded-[4px] text-[11px] font-semibold truncate max-w-full transition-all hover:opacity-90 border"
                      style={{ background: "var(--card-bg)", color: "var(--text-primary)", borderColor: color }}
                    >
                      {project ? (
                        <span className="text-[10px] shrink-0">{project.emoji}</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      )}
                      <span className="truncate">{ev.summary || "(sans titre)"}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {hasAllDay && (
        <div className="shrink-0 flex border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="shrink-0 w-[52px] text-right pr-2 py-1">
            <span className="text-[10px] text-[var(--text-tertiary)]">j. entier</span>
          </div>
          {days.map((day, di) => (
            <div key={di} className="flex-1 min-w-0 flex flex-wrap gap-1 p-1 border-l" style={{ borderColor: "var(--border-primary)" }}>
              {allDayRows[di].map((ev) => {
                const color = getEventColor(ev, calendars);
                const projectId = useAppStore.getState().googleEventProjects[ev.id];
                const project = projectId ? useAppStore.getState().projects.find(p => p.id === projectId) : null;
                return (
                  <button
                    key={ev.id}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onEventClick(ev, { top: rect.top, left: rect.right });
                    }}
                    onContextMenu={(e) => handleContextMenu(ev, e)}
                    className="cal-event flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded-[4px] text-[11px] font-semibold truncate max-w-full transition-all hover:opacity-90"
                    style={{ background: `${color}30`, color: color }}
                  >
                    {project && <span className="text-[10px] shrink-0">{project.emoji}</span>}
                    <span className="truncate">{ev.summary || "(sans titre)"}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {isMultiDay && (
        <div className="shrink-0 flex border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="shrink-0 w-[52px]" />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className="flex-1 min-w-0 text-center py-2 border-l" style={{ borderColor: "var(--border-primary)" }}>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
                  {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div className={"text-[20px] font-semibold leading-tight mt-0.5 " + (isToday ? "text-white bg-[var(--accent-blue)] w-9 h-9 rounded-full flex items-center justify-center mx-auto" : "text-[var(--text-primary)]")}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div ref={gridRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="shrink-0 w-[52px] relative">
            {HOURS.map((h) => (
              <div key={h} className="absolute right-2 text-[10px] text-[var(--text-tertiary)] tabular-nums" style={{ top: h * HOUR_HEIGHT - 6 }}>
                {h > 0 && `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {days.map((day, di) => {
            const dayEvents = getEventsForDay(events, day);
            const laid = layoutEvents(dayEvents);
            const isToday = isSameDay(day, today);

            return (
              <div key={di} className="flex-1 min-w-0 relative border-l" style={{ borderColor: "var(--border-primary)" }}
                onMouseDown={(e) => handleGridMouseDown(di, e)}
                onDragOver={(e) => { 
                  e.preventDefault(); 
                  e.dataTransfer.dropEffect = "copy";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top + (gridRef.current?.scrollTop || 0);
                  const hour = Math.floor(y / HOUR_HEIGHT);
                  const minutes = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
                  setDraggedTaskOver({ dayIndex: di, top: (hour + minutes / 60) * HOUR_HEIGHT });
                }}
                onDragLeave={() => setDraggedTaskOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDraggedTaskOver(null);
                  const taskText = e.dataTransfer.getData("text/dopatask-name");
                  if (!taskText || !onTaskDrop) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top + (gridRef.current?.scrollTop || 0);
                  const hour = Math.floor(y / HOUR_HEIGHT);
                  const minutes = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
                  const start = new Date(day);
                  start.setHours(hour, minutes, 0, 0);
                  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h default
                  onTaskDrop(taskText, start, end);
                }}
              >
                {HOURS.map((h) => (
                  <div key={h} className="absolute left-0 right-0 border-t pointer-events-none" style={{ top: h * HOUR_HEIGHT, borderColor: "var(--border-primary)" }} />
                ))}
                {HOURS.map((h) => (
                  <div key={`half-${h}`} className="absolute left-0 right-0 border-t pointer-events-none" style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderColor: "var(--border-primary)", opacity: 0.4 }} />
                ))}

                {/* Bloc Sleep */}
                <div className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: 23 * HOUR_HEIGHT, height: HOUR_HEIGHT, background: "rgba(253, 224, 71, 0.3)" }}>
                  <span className="absolute top-1 left-1.5 text-[10px] font-bold text-yellow-600/70">SLEEP</span>
                </div>
                <div className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: 0, height: 7.5 * HOUR_HEIGHT, background: "rgba(253, 224, 71, 0.3)" }} />
                {isToday && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowY }}>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full -ml-1.5" style={{ background: "var(--accent-red)" }} />
                      <div className="flex-1 h-[2px]" style={{ background: "var(--accent-red)" }} />
                    </div>
                  </div>
                )}

                {selection?.dayIndex === di && (
                  <div className="absolute left-0 right-0 z-30 pointer-events-none rounded-[4px]" style={{ background: "color-mix(in srgb, var(--accent-blue) 20%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-blue) 50%, transparent)", top: Math.min(selection.startTop, selection.startTop + (selection.currentY - selection.startY)), height: Math.abs(selection.currentY - selection.startY) }} />
                )}

                {/* External Task Drop Preview */}
                {draggedTaskOver?.dayIndex === di && (
                  <div 
                    className="absolute left-1 right-1 z-20 pointer-events-none rounded-[4px] border-2 border-dashed flex items-center justify-center text-[10px] font-semibold"
                    style={{ 
                      top: draggedTaskOver.top, 
                      height: HOUR_HEIGHT, 
                      borderColor: "var(--accent-blue)", 
                      background: "color-mix(in srgb, var(--accent-blue) 10%, transparent)",
                      color: "var(--accent-blue)"
                    }} 
                  >
                    Déposer ici (1h)
                  </div>
                )}

                {laid.map((l) => {
                  const color = getEventColor(l.ev, calendars);
                  const isTask = l.ev.type === "task";
                  const colWidth = 100 / l.totalCols;
                  const isDragging = dragEvent?.ev.id === l.ev.id && (dragEvent.hasMoved || false);
                  
                  // Calculate horizontal offset and top during drag
                  let dragHorizontalOffset = 0;
                  let top = l.top;
                  if (isDragging && gridRef.current) {
                    const rect = gridRef.current.getBoundingClientRect();
                    const gutterWidth = 52;
                    const gridWidth = rect.width - gutterWidth;
                    const dayWidth = gridWidth / days.length;
                    
                    const relativeX = dragEvent.currentX - rect.left - gutterWidth;
                    let newDayIndex = Math.floor(relativeX / dayWidth);
                    newDayIndex = Math.max(0, Math.min(days.length - 1, newDayIndex));
                    
                    dragHorizontalOffset = (newDayIndex - di) * dayWidth;
                    
                    const relativeY = dragEvent.currentY - rect.top + gridRef.current.scrollTop;
                    top = Math.max(0, relativeY - dragEvent.offsetY);
                  }
                  
                  return (
                    <button
                      key={l.ev.id}
                      data-event-id={l.ev.id}
                      className="cal-event absolute rounded-[4px] text-left overflow-hidden transition-all hover:opacity-90 group cursor-pointer"
                      style={{
                        top: top,
                        height: Math.max(l.height, MIN_EVENT_HEIGHT),
                        left: isDragging ? `calc(${l.col * colWidth}% + 1px + ${dragHorizontalOffset}px)` : `calc(${l.col * colWidth}% + 1px)`,
                        width: `calc(${colWidth}% - 2px)`,
                        background: isTask ? `var(--card-bg)` : `${color}25`,
                        border: isTask ? `1px solid var(--card-border)` : `1px solid ${color}40`,
                        borderLeft: `3px solid ${color}`,
                        zIndex: isDragging ? 50 : 10,
                        opacity: isDragging ? 0.8 : 1,
                        pointerEvents: isDragging ? "none" : "auto",
                      }}
                      onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onEventClick(l.ev, { top: rect.top, left: rect.right }); }}
                      onMouseDown={(e) => handleEventMouseDown(l.ev, e)}
                      onContextMenu={(e) => handleContextMenu(l.ev, e)}
                    >
                      <div className="px-1.5 py-0.5 h-full flex flex-col justify-start min-h-0">
                        <div className="flex items-start gap-1">
                          {(() => {
                            const state = useAppStore.getState();
                            const googleTaskProjects = state.googleTaskProjects || {};
                            const googleEventProjects = state.googleEventProjects || {};
                            const projectId = l.ev.type === "task" 
                              ? googleTaskProjects[l.ev.id] 
                              : googleEventProjects[l.ev.id];
                            const project = projectId ? (state.projects || []).find(p => p.id === projectId) : null;
                            return project && <span className="text-[11px] shrink-0">{project.emoji}</span>;
                          })()}
                          <span className="text-[11.5px] font-semibold leading-tight truncate" style={{ color: isTask ? "var(--text-primary)" : color }}>{l.ev.summary || "(sans titre)"}</span>
                        </div>
                        {l.height > 25 && <span className="text-[10px] opacity-80 mt-0.5 leading-none" style={{ color: isTask ? "var(--text-secondary)" : color }}>{formatTime(getEventStart(l.ev))} – {formatTime(getEventEnd(l.ev))}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} onContextMenu={e => { e.preventDefault(); setContextMenu(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
              className="z-[101] min-w-[160px] bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl shadow-xl p-1.5"
            >
              <button
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] rounded-lg transition-colors text-[var(--accent-red)]"
                onClick={() => { onEventDelete?.(contextMenu.ev); setContextMenu(null); }}
              >
                Supprimer
              </button>
              <div className="h-px bg-[var(--border-primary)] my-1 mx-1" />
              <div className="px-3 py-1.5 text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Couleur</div>
              <div className="grid grid-cols-4 gap-1 p-1">
                {Object.keys(GOOGLE_COLORS).map(cId => (
                  <button
                    key={cId}
                    className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
                    style={{ background: GOOGLE_COLORS[cId] }}
                    onClick={() => { onEventColorChange?.(contextMenu.ev, cId); setContextMenu(null); }}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
