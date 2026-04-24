import dynamic from "next/dynamic";

const RelancesList = dynamic(() => import("@/components/crm/RelancesList"), { ssr: false });

export default function RelancesPage() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <RelancesList />
    </div>
  );
}
