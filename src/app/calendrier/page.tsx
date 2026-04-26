import dynamic from "next/dynamic";

const CalendarApp = dynamic(
  () => import("@/components/calendrier/CalendarApp"),
  { ssr: false }
);

export default function CalendrierPage() {
  return <CalendarApp />;
}
