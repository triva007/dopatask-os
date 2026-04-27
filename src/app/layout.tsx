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
  const themeInitScript = `
    (function () {
      try {
        var raw = localStorage.getItem("dopatask-storage");
        var theme = "dark";
        if (raw) {
          var parsed = JSON.parse(raw);
          var persistedTheme = parsed && parsed.state && parsed.state.theme;
          if (persistedTheme === "light" || persistedTheme === "dark") {
            theme = persistedTheme;
          }
        }
        var root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
      } catch (_e) {
        document.documentElement.classList.add("dark");
      }
    })();
  `;

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-t-primary h-screen overflow-hidden`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
