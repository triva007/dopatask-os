import dynamic from "next/dynamic";

const TherapeutesHub = dynamic(() => import("@/components/crm/TherapeutesHub"), { ssr: false });

export default function TherapeutesPage() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <TherapeutesHub />
    </div>
  );
}
