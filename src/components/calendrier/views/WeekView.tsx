"use client";

import { useMemo } from "react";
import TimeGrid from "./TimeGrid";
import type { CalendarEvent, CalendarInfo } from "../useCalendarEvents";
import { startOfWeek, addDays } from "../useCalendarEvents";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: CalendarInfo[];
  onEventClick: (ev: CalendarEvent, rect: { top: number; left: number }) => void;
  onSlotClick: (date: Date) => void;
  onSlotSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (ev: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventDelete?: (ev: CalendarEvent) => void;
  onEventColorChange?: (ev: CalendarEvent, colorId: string) => void;
}

export default function WeekView({ currentDate, events, calendars, onEventClick, onSlotClick, onSlotSelect, onEventDrop, onEventDelete, onEventColorChange }: WeekViewProps) {
  const days = useMemo(() => {
    const ws = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [currentDate]);

  return <TimeGrid days={days} events={events} calendars={calendars} onEventClick={onEventClick} onSlotClick={onSlotClick} onSlotSelect={onSlotSelect} onEventDrop={onEventDrop} onEventDelete={onEventDelete} onEventColorChange={onEventColorChange} />;
}
