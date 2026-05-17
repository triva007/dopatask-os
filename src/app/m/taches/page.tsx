import dynamic from "next/dynamic";

const MobileTasksView = dynamic(
  () => import("@/components/mobile/tasks/MobileTasksView"),
  { ssr: false }
);

export default function MobileTasksPage() {
  return <MobileTasksView />;
}
