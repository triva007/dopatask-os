import dynamic from "next/dynamic";

const MobileCrmDashboard = dynamic(
  () => import("@/components/mobile/crm/MobileCrmDashboard"),
  { ssr: false }
);

export default function MobileCrmPage() {
  return <MobileCrmDashboard />;
}
