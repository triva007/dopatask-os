import dynamic from "next/dynamic";

const MobileProspectList = dynamic(
  () => import("@/components/mobile/crm/MobileProspectList"),
  { ssr: false }
);

export default function MobileProspectsPage() {
  return <MobileProspectList />;
}
