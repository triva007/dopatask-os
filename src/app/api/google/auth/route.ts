import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  // state = anti-CSRF basique
  const state = Math.random().toString(36).slice(2);
  const url = buildAuthUrl(state);
  return NextResponse.redirect(url);
}
