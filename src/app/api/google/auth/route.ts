import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthUrl } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";
const OAUTH_STATE_COOKIE = "g_oauth_state";

export async function GET() {
  // state = anti-CSRF
  const state = Math.random().toString(36).slice(2);
  const url = buildAuthUrl(state);
  const res = NextResponse.redirect(url);
  cookies().set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
