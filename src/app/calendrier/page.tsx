import dynamic from "next/dynamic";

const WeekCalendar = dynamic(
  () => import("@/components/calendrier/WeekCalendar"),
  { ssr: false }
);

export default function CalendrierPage() {
  return <WeekCalendar />;
}
