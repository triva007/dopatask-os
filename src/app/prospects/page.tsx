import dynamic from "next/dynamic";

const ProspectsTable = dynamic(() => import("@/components/crm/ProspectsTable"), { ssr: false });

export default function ProspectsPage() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <ProspectsTable />
    </div>
  );
}
