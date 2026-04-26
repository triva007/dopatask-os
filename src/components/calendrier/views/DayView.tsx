"use client";

import { useMemo } from "react";
import TimeGrid from "./TimeGrid";
import type { CalendarEvent, CalendarInfo } from "../useCalendarEvents";
import { startOfDay } from "../useCalendarEvents";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: CalendarInfo[];
  onEventClick: (ev: CalendarEvent, rect: { top: number; left: number }) => void;
  onSlotClick: (date: Date) => void;
  onEventDrop?: (ev: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

export default function DayView({ currentDate, events, calendars, onEventClick, onSlotClick, onEventDrop }: DayViewProps) {
  const days = useMemo(() => [startOfDay(currentDate)], [currentDate]);
  return <TimeGrid days={days} events={events} calendars={calendars} onEventClick={onEventClick} onSlotClick={onSlotClick} onEventDrop={onEventDrop} />;
}
