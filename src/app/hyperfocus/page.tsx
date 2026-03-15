import dynamic from "next/dynamic";

const HyperfocusLab = dynamic(
  () => import("@/components/hyperfocus/HyperfocusLab"),
  { ssr: false }
);

export default function HyperfocusPage() {
  return <HyperfocusLab />;
}
