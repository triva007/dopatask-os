import dynamic from "next/dynamic";

const VisionBoard = dynamic(
  () => import("@/components/vision/VisionBoard"),
  { ssr: false }
);

export default function VisionPage() {
  return <VisionBoard />;
}