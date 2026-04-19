import dynamic from "next/dynamic";

const ProspectDetail = dynamic(() => import("@/components/crm/ProspectDetail"), { ssr: false });

export default function ProspectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <ProspectDetail id={params.id} />
    </div>
  );
}
