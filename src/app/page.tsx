import dynamic from "next/dynamic";

const FocusHero = dynamic(() => import("@/components/dashboard/FocusHero"), { ssr: false });
const DayPanel = dynamic(() => import("@/components/dashboard/DayPanel"), { ssr: false });
const ProgressPanel = dynamic(() => import("@/components/dashboard/ProgressPanel"), { ssr: false });
const OnboardingWrapper = dynamic(() => import("@/components/onboarding/OnboardingWrapper"), { ssr: false });

export default function Home() {
  return (
    <>
      <div className="flex h-screen overflow-hidden select-none bg-background ambient-bg">
        {/* Jour — panneau gauche discret */}
        <aside
          className="h-full overflow-hidden relative z-10"
          style={{ width: 300, minWidth: 280 }}
        >
          <DayPanel />
        </aside>

        {/* Focus — hero central */}
        <main className="flex-1 h-full overflow-hidden relative z-10 border-l border-r border-b-primary">
          <FocusHero />
        </main>

        {/* Progression — panneau droite */}
        <aside
          className="h-full overflow-hidden relative z-10"
          style={{ width: 300, minWidth: 280 }}
        >
          <ProgressPanel />
        </aside>
      </div>

      <OnboardingWrapper />
    </>
  );
}
