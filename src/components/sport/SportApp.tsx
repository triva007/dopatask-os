"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Circle, Flame, Timer, Trophy, CalendarDays } from "lucide-react";
import { useCalendarEvents, addDays, startOfDay, getEventStart, CalendarEvent } from "@/components/calendrier/useCalendarEvents";
import { useAppStore } from "@/store/useAppStore";

const SPORT_KEYWORDS = ["sport", "muscu", "course", "gym", "séance", "seance", "workout", "training", "vélo", "velo", "swim", "natation", "fitness", "crossfit", "run"];

export default function SportApp() {
  const { calendars, events, fetchCalendars, fetchEvents, loading, connected } = useCalendarEvents();
  const completedSportSessions = useAppStore((s) => s.completedSportSessions || []);
  const toggleSportSession = useAppStore((s) => s.toggleSportSession);

  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    if (!initDone) {
      setInitDone(true);
      fetchCalendars().then((cals) => {
        if (cals.length > 0) {
          const ids = cals.map(c => c.id);
          const today = startOfDay(new Date());
          const timeMin = addDays(today, -14).toISOString();
          const timeMax = addDays(today, 30).toISOString();
          fetchEvents(ids, timeMin, timeMax);
        }
      });
    }
  }, [initDone, fetchCalendars, fetchEvents]);

  const sportEvents = useMemo(() => {
    return events.filter(ev => {
      const summary = (ev.summary || "").toLowerCase();
      const desc = (ev.description || "").toLowerCase();
      return SPORT_KEYWORDS.some(kw => summary.includes(kw) || desc.includes(kw));
    }).sort((a, b) => getEventStart(b).getTime() - getEventStart(a).getTime());
  }, [events]);

  const upcomingSessions = sportEvents.filter(ev => getEventStart(ev).getTime() >= startOfDay(new Date()).getTime()).reverse();
  const pastSessions = sportEvents.filter(ev => getEventStart(ev).getTime() < startOfDay(new Date()).getTime());

  const totalThisWeek = sportEvents.filter(ev => {
    const time = getEventStart(ev).getTime();
    const now = Date.now();
    return time > now - 7 * 24 * 3600 * 1000 && time < now + 7 * 24 * 3600 * 1000;
  });
  const completedThisWeek = totalThisWeek.filter(ev => completedSportSessions.includes(ev.id));
  const progress = totalThisWeek.length > 0 ? Math.round((completedThisWeek.length / totalThisWeek.length) * 100) : 0;

  const EventCard = ({ ev }: { ev: CalendarEvent }) => {
    const isCompleted = completedSportSessions.includes(ev.id);
    const date = getEventStart(ev);
    const isPast = date.getTime() < Date.now();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 group cursor-pointer
          ${isCompleted 
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20" 
            : "bg-[var(--surface-1)] border-white/5 hover:border-orange-500/30"}`}
        onClick={() => toggleSportSession(ev.id)}
      >
        <div className="flex items-center gap-4 relative z-10">
          <button 
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
              ${isCompleted 
                ? "bg-green-500/20 text-green-400" 
                : "bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20"}`}
          >
            {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold truncate transition-colors ${isCompleted ? "text-green-400 line-through opacity-70" : "text-white"}`}>
              {ev.summary || "Séance de sport"}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="opacity-70" />
                {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              {!isPast && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5">
                  <Timer size={14} className="text-orange-400" />
                  {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none"
            >
              <CheckCircle2 size={120} className="text-green-500" />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Connectez votre Google Calendar pour synchroniser vos séances de sport.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[var(--surface-0)] pb-24">
      {/* Header Banner */}
      <div className="relative pt-16 pb-12 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/5 to-transparent opacity-50" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end gap-8 justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold mb-4">
              <Flame size={16} />
              <span>Espace Sport</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
              Activité Sportive
            </h1>
            <p className="text-[var(--text-secondary)] mt-3 text-lg max-w-xl">
              Coche tes séances au fur et à mesure. Reste discipliné, la constance est la clé.
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-black/20 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
            <div className="flex-1">
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">Progression hebdo</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{completedThisWeek.length}</span>
                <span className="text-lg text-white/40">/ {totalThisWeek.length}</span>
              </div>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-white/10" strokeWidth="8" fill="none" />
                <motion.circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-orange-500" 
                  strokeWidth="8" fill="none" strokeLinecap="round"
                  initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * progress) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy size={20} className={progress === 100 && totalThisWeek.length > 0 ? "text-orange-400" : "text-white/20"} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 relative z-10">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Upcoming */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Timer size={16} />
                </div>
                <h2 className="text-xl font-bold text-white">À venir</h2>
              </div>
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map(ev => <EventCard key={ev.id} ev={ev} />)
                  ) : (
                    <p className="text-[var(--text-secondary)] italic p-4">Aucune séance prévue dans le calendrier.</p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Past */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <CheckCircle2 size={16} />
                </div>
                <h2 className="text-xl font-bold text-white">Précédentes</h2>
              </div>
              <div className="flex flex-col gap-3 opacity-80">
                <AnimatePresence mode="popLayout">
                  {pastSessions.length > 0 ? (
                    pastSessions.map(ev => <EventCard key={ev.id} ev={ev} />)
                  ) : (
                    <p className="text-[var(--text-secondary)] italic p-4">Aucun historique récent.</p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
