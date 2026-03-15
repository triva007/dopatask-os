import dynamic from "next/dynamic";

const SprintsBoard = dynamic(
  () => import("@/components/sprints/SprintsBoard"),
  { ssr: false }
);

export default function SprintsPage() {
  return <SprintsBoard />;
}
