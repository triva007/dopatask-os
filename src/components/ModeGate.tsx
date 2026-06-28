"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ModeGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const chosen = sessionStorage.getItem("aaron_mode_session");
      if (!chosen && pathname === "/") router.replace("/start");
    } catch (_e) {}
  }, [pathname, router]);

  return null;
}
