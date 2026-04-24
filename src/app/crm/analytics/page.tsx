import dynamic from "next/dynamic";

const AnalyticsPanel = dynamic(
  () => import("@/components/crm/AnalyticsPanel"),
  { ssr: false }
);

export default function AnalyticsPage() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <AnalyticsPanel />
    </div>
  );
}
