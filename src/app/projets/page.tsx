import dynamic from "next/dynamic";

const ProjectsView = dynamic(
  () => import("@/components/projets/ProjectsView"),
  { ssr: false }
);

export default function ProjetsPage() {
  return <ProjectsView />;
}
