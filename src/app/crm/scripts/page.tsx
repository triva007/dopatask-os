import dynamic from "next/dynamic";

const ScriptsHub = dynamic(() => import("@/components/crm/ScriptsHub"), { ssr: false });

export default function ScriptsPage() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <ScriptsHub />
    </div>
  );
}
