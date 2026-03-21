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

      {/* Layout immersif 3 colonnes — optimisé desktop */}
      <div className="flex h-screen overflow-hidden bg-[#09090b] select-none">

        {/* ── Colonne GAUCHE — Timeline (22%) ── */}
        <aside
          className="h-full overflow-hidden"
          style={{
            width: "22%",
            minWidth: 220,
            borderRight: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <TimelineColumn />
        </aside>

        {/* ── Colonne CENTRALE — Focus Area (50%) ── */}
        <main
          className="flex-1 h-full overflow-hidden"
          style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}
        >
          <FocusColumn />
        </main>

        {/* ── Colonne DROITE — Dopamine Zone (28%) ── */}
        <aside
          className="h-full overflow-hidden"
          style={{ width: "28%", minWidth: 260 }}
        >
          <DopamineColumn />
        </aside>
      </div>

      {/* Onboarding overlay */}
      <OnboardingWrapper />
    </>
  );
}