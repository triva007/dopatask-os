import dynamic from "next/dynamic";

const OnboardingWrapper = dynamic(() => import("@/components/onboarding/OnboardingWrapper"), { ssr: false });
const TimelineColumn = dynamic(() => import("@/components/dashboard/TimelineColumn"), { ssr: false });
const FocusColumn = dynamic(() => import("@/components/dashboard/FocusColumn"), { ssr: false });
const DopamineColumn = dynamic(() => import("@/components/dashboard/DopamineColumn"), { ssr: false });
const BreadcrumbBanner = dynamic(() => import("@/components/dashboard/BreadcrumbBanner"), { ssr: false });

export default function Home() {
  return (
    <>
      <BreadcrumbBanner />

      <div className="flex h-screen overflow-hidden select-none relative" style={{ background: "var(--surface-0)" }}>
        {/* Ambient orbs */}
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.03), transparent 70%)", filter: "blur(60px)" }}
        />
        <div className="absolute bottom-[-20%] right-[15%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.025), transparent 70%)", filter: "blur(60px)" }}
        />

        {/* Timeline — 22% */}
        <aside
          className="h-full overflow-hidden relative z-10"
          style={{ width: "22%", minWidth: 220, borderRight: "1px solid rgba(255,255,255,0.04)" }}
        >
          <TimelineColumn />
        </aside>

        {/* Focus — flexible center */}
        <main
          className="flex-1 h-full overflow-hidden relative z-10"
          style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}
        >
          <FocusColumn />
        </main>

        {/* Dopamine — 28% */}
        <aside className="h-full overflow-hidden relative z-10" style={{ width: "28%", minWidth: 260 }}>
          <DopamineColumn />
        </aside>
      </div>

      <OnboardingWrapper />
    </>
  );
}
