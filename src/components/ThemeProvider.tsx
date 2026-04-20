"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark mode forced — light mode temporarily disabled
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
  }, []);

  return <>{children}</>;
}
