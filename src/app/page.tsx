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

      <div className="flex h-screen overflow-hidden select-none" style={{ background: "var(--bg-base)" }}>
        {/* Timeline — 22% */}
        <aside className="h-full overflow-hidden" style={{ width: "22%", minWidth: 220 }}>
          <TimelineColumn />
        </aside>

        {/* Divider */}
        <div className="divider-column shrink-0" />

        {/* Focus — flexible center */}
        <main className="flex-1 h-full overflow-hidden">
          <FocusColumn />
        </main>

        {/* Divider */}
        <div className="divider-column shrink-0" />

        {/* Dopamine — 28% */}
        <aside className="h-full overflow-hidden" style={{ width: "28%", minWidth: 260 }}>
          <DopamineColumn />
        </aside>
      </div>

      <OnboardingWrapper />
    </>
  );
}
