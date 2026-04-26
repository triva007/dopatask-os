import { NextResponse } from "next/server";
import { clearTokenCookies } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearTokenCookies();
  return NextResponse.json({ ok: true });
}
