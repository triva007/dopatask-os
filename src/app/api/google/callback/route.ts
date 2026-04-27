import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, fetchUserEmail, setTokenCookies } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";
const OAUTH_STATE_COOKIE = "g_oauth_state";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const storedState = cookies().get(OAUTH_STATE_COOKIE)?.value;

  if (error) {
    cookies().delete(OAUTH_STATE_COOKIE);
    return NextResponse.redirect(`${origin}/reglages?google=error&reason=${encodeURIComponent(error)}`);
  }
  if (!state || !storedState || state !== storedState) {
    cookies().delete(OAUTH_STATE_COOKIE);
    return NextResponse.redirect(`${origin}/reglages?google=error&reason=invalid_state`);
  }
  if (!code) {
    cookies().delete(OAUTH_STATE_COOKIE);
    return NextResponse.redirect(`${origin}/reglages?google=error&reason=no_code`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email  = await fetchUserEmail(tokens.access_token);
    await setTokenCookies({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      email,
    });
    cookies().delete(OAUTH_STATE_COOKIE);
    return NextResponse.redirect(`${origin}/reglages?google=connected`);
  } catch (e) {
    cookies().delete(OAUTH_STATE_COOKIE);
    console.error("[google/callback]", e);
    const reason = e instanceof Error ? e.message : "unknown";
    return NextResponse.redirect(`${origin}/reglages?google=error&reason=${encodeURIComponent(reason)}`);
  }
}
