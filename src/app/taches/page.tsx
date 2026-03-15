import dynamic from "next/dynamic";

const KanbanBoard = dynamic(
  () => import("@/components/taches/KanbanBoard"),
  { ssr: false }
);

export default function TachesPage() {
  return <KanbanBoard />;
}
