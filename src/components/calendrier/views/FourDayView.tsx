"use client";

import { useMemo } from "react";
import TimeGrid from "./TimeGrid";
import type { CalendarEvent, CalendarInfo } from "../useCalendarEvents";
import { startOfDay, addDays } from "../useCalendarEvents";

interface FourDayViewProps {
  currentDate: Date;
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

export default function FourDayView({ currentDate, events, calendars, onEventClick, onSlotClick, onSlotSelect, onEventDrop, onEventDelete, onEventColorChange, onTaskDrop }: FourDayViewProps) {
  const days = useMemo(() => {
    const d = startOfDay(currentDate);
    return Array.from({ length: 4 }, (_, i) => addDays(d, i));
  }, [currentDate]);

  return <TimeGrid days={days} events={events} calendars={calendars} onEventClick={onEventClick} onSlotClick={onSlotClick} onSlotSelect={onSlotSelect} onEventDrop={onEventDrop} onEventDelete={onEventDelete} onEventColorChange={onEventColorChange} onTaskDrop={onTaskDrop} />;
}
