import dynamic from "next/dynamic";

const BoutiqueDopamine = dynamic(
  () => import("@/components/boutique/BoutiqueDopamine"),
  { ssr: false }
);

export default function BoutiquePage() {
  return <BoutiqueDopamine />;
}
