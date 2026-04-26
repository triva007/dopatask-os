import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/next";

const AppShell = dynamic(() => import("@/components/AppShell"), {
  ssr: false,
});
const ThemeProvider = dynamic(() => import("@/components/ThemeProvider"), {
  ssr: false,
});

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Aaron-OS — Productivity Reimagined",
  description:
    "Conçu pour les cerveaux TDAH. Un espace de travail calme, structuré et beau.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-t-primary h-screen overflow-hidden`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
