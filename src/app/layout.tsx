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
  title: "DopaTask OS — Productivity Reimagined",
  description:
    "Conçu pour les cerveaux TDAH. Un espace de travail calme, structuré et beau.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden`}
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="flex h-screen overflow-hidden relative">
          {/* Global ambient mesh gradient */}
          <div className="absolute inset-0 pointer-events-none mesh-gradient opacity-60" />

          {/* Sidebar — Glass */}
          <aside
            className="glass-sidebar shrink-0 h-full overflow-hidden relative z-10"
            style={{ width: "var(--sidebar-width)" }}
          >
            <Sidebar />
          </aside>

          {/* Main content */}
          <div className="flex-1 h-full overflow-hidden relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
