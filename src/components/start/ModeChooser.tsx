"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, HeartHandshake } from "lucide-react";

function remember(mode: string) {
  try { localStorage.setItem("aaron_os_mode", mode); } catch (_e) {}
}

export default function ModeChooser() {
  const router = useRouter();
  const pick = (mode: "dopatask" | "crm") => {
    remember(mode);
    router.push(mode === "crm" ? "/crm/therapeutes" : "/");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-auto" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-3xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))" }}>
            <span className="text-[22px] text-white font-bold">A</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-t-primary">Bienvenue, Aaron</h1>
          <p className="text-[14px] text-t-tertiary mt-2">Choisis ton espace de travail</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ModeCard
            onClick={() => pick("dopatask")}
            icon={<LayoutDashboard size={26} />}
            color="#818CF8"
            title="DopaTask OS"
            desc="Ton app complète : tâches, calendrier, projets, CRM cold-call, sport, journal…"
            cta="Mode complet"
          />
          <ModeCard
            onClick={() => pick("crm")}
            icon={<HeartHandshake size={26} />}
            color="#A893F0"
            title="CRM Triva"
            desc="Espace prospection focalisé : pipeline thérapeutes, scripts, RDV. Zéro distraction."
            cta="Mode CRM"
          />
        </div>

        <p className="text-center text-[12px] text-t-tertiary mt-8">Tu pourras changer de mode à tout moment.</p>
      </div>
    </div>
  );
}

function ModeCard({ onClick, icon, color, title, desc, cta }: { onClick: () => void; icon: ReactNode; color: string; title: string; desc: string; cta: string }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-3xl p-7 glass-card-3d transition-all hover:-translate-y-1 group"
      style={{ background: `linear-gradient(135deg, ${color}14 0%, var(--surface-1) 100%)`, border: `1px solid ${color}33` }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110" style={{ background: color, color: "var(--surface-0)" }}>
        {icon}
      </div>
      <h2 className="text-[20px] font-bold text-t-primary mb-2">{title}</h2>
      <p className="text-[13px] text-t-secondary leading-relaxed mb-5">{desc}</p>
      <span className="inline-flex items-center gap-2 text-[13px] font-semibold px-3 py-2 rounded-lg" style={{ background: `${color}1f`, color }}>{cta} →</span>
    </button>
  );
}
