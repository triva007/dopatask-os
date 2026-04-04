import dynamic from "next/dynamic";

const TimelineColumn = dynamic(() => import("@/components/dashboard/TimelineColumn"), { ssr: false });
const FocusColumn = dynamic(() => import("@/components/dashboard/FocusColumn"), { ssr: false });
const DopamineColumn = dynamic(() => import("@/components/dashboard/DopamineColumn"), { ssr: false });
const OnboardingWrapper = dynamic(() => import("@/components/onboarding/OnboardingWrapper"), { ssr: false });

export default function Home() {
  return (
    <>
      <div className="flex h-screen overflow-hidden select-none bg-background">
        {/* Timeline — 22% */}
        <aside className="h-full overflow-hidden border-r border-b-primary" style={{ width: "24%", minWidth: 260 }}>
          <TimelineColumn />
        </aside>

        {/* Focus — flexible center */}
        <main className="flex-1 h-full overflow-hidden border-r border-b-primary">
          <FocusColumn />
        </main>

        {/* Dopamine — 28% */}
        <aside className="h-full overflow-hidden" style={{ width: "26%", minWidth: 300 }}>
          <DopamineColumn />
        </aside>
      </div>

      <OnboardingWrapper />
    </>
  );
}
