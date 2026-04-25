import dynamic from "next/dynamic";

const ProspectsSplitView = dynamic(
  () => import("@/components/crm/ProspectsSplitView"),
  { ssr: false }
);

export default function ProspectsPage() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <ProspectsSplitView />
    </div>
  );
}
