import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/components/sidebar/Sidebar"), {
  ssr: false,
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DopaTask — Prothèse Neuro-Cognitive",
  description:
    "Conçu pour les cerveaux TDAH. Moins de friction, plus de focus, zéro culpabilité.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#09090b] text-zinc-50 h-screen overflow-hidden`}
      >
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar fixe ~17% */}
          <aside
            className="shrink-0 h-full border-r overflow-hidden"
            style={{
              width: "clamp(180px, 17vw, 220px)",
              borderColor: "rgba(255,255,255,0.04)",
              background: "#050507",
            }}
          >
            <Sidebar />
          </aside>

          {/* Contenu principal */}
          <div className="flex-1 h-full overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
