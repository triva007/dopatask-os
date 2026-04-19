import dynamic from "next/dynamic";

const CrmDashboard = dynamic(() => import("@/components/crm/CrmDashboard"), { ssr: false });

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <CrmDashboard />
    </div>
  );
}
