import dynamic from "next/dynamic";

// ─── Chargement client-only (SSR désactivé → localStorage Zustand) ────────────

const OnboardingWrapper = dynamic(
  () => import("@/components/onboarding/OnboardingWrapper"),
  { ssr: false }
);

const TimelineColumn = dynamic(
  () => import("@/components/dashboard/TimelineColumn"),
  { ssr: false }
);

const FocusColumn = dynamic(
  () => import("@/components/dashboard/FocusColumn"),
  { ssr: false }
);

const DopamineColumn = dynamic(
  () => import("@/components/dashboard/DopamineColumn"),
  { ssr: false }
);

const BreadcrumbBanner = dynamic(
  () => import("@/components/dashboard/BreadcrumbBanner"),
  { ssr: false }
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* Fil d'Ariane — flottant en haut de page */}
      <BreadcrumbBanner />

      {/* Layout immersif 3 colonnes — h-screen, overflow-hidden */}
      <div className="flex h-screen overflow-hidden bg-[#09090b] select-none">

        {/* ── Colonne GAUCHE — Timeline (25%) ── */}
        <aside className="w-[25%] min-w-[200px] h-full border-r border-zinc-900 overflow-hidden">
          <TimelineColumn />
        </aside>

        {/* ── Colonne CENTRALE — Focus Area (50%) ── */}
        <main className="flex-1 h-full border-r border-zinc-900 overflow-hidden">
          <FocusColumn />
        </main>

        {/* ── Colonne DROITE — Dopamine Zone (25%) ── */}
        <aside className="w-[25%] min-w-[220px] h-full overflow-hidden">
          <DopamineColumn />
        </aside>
      </div>

      {/* Onboarding overlay */}
      <OnboardingWrapper />
    </>
  );
}
