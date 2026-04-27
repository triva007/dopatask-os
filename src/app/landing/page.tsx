import { Metadata } from "next";
import dynamic from "next/dynamic";

const LandingPage = dynamic(() => import("@/components/landing/LandingPage"), { ssr: false });

export const metadata: Metadata = {
  title: "Aaron-OS - Organisez votre vie, atteignez vos objectifs.",
  description: "L'espace de travail conçu pour les cerveaux hyperactifs. Combinez tâches, CRM, calendrier et notes dans une interface calme et minimaliste.",
};

export default function Page() {
  return <LandingPage />;
}
