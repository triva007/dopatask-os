import dynamic from "next/dynamic";

const DashboardPage = dynamic(() => import("@/components/dashboard/DashboardPage"), { ssr: false });

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <DashboardPage />
    </div>
  );
}
