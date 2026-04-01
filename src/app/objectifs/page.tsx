import dynamic from "next/dynamic";

const ObjectivesTimeline = dynamic(
  () => import("@/components/objectifs/ObjectivesTimeline"),
  { ssr: false }
);

export default function ObjectifsPage() {
  return <ObjectivesTimeline />;
}
