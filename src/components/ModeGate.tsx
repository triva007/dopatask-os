"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ModeGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const mode = localStorage.getItem("aaron_os_mode");
      if (!mode && pathname === "/") router.replace("/start");
    } catch (_e) {}
  }, [pathname, router]);

  return null;
}
