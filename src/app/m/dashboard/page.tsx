import dynamic from "next/dynamic";

const MobileDashboard = dynamic(
  () => import("@/components/mobile/dashboard/MobileDashboard"),
  { ssr: false }
);

export default function MobileDashboardPage() {
  return <MobileDashboard />;
}
