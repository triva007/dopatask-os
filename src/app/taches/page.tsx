import dynamic from "next/dynamic";

const GoogleTasksKanban = dynamic(
  () => import("@/components/taches/GoogleTasksKanban"),
  { ssr: false }
);

export default function TachesPage() {
  return <GoogleTasksKanban />;
}
