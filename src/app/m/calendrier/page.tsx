import dynamic from "next/dynamic";

const MobileCalendarView = dynamic(
  () => import("@/components/mobile/calendar/MobileCalendarView"),
  { ssr: false }
);

export default function MobileCalendarPage() {
  return <MobileCalendarView />;
}
