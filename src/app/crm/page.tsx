import dynamic from "next/dynamic";

const CrmHub = dynamic(() => import("@/components/crm/CrmHub"), { ssr: false });

export default function CrmPage() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <CrmHub />
    </div>
  );
}
