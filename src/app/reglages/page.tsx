import dynamic from "next/dynamic";

const ReglagesPage = dynamic(
  () => import("@/components/reglages/ReglagesPanel"),
  { ssr: false }
);

export default function Reglages() {
  return <ReglagesPage />;
}
