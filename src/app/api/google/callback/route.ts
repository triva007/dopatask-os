import { NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchUserEmail, setTokenCookies } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/reglages?google=error&reason=${encodeURIComponent(error)}`);
  }
  if (!code) {
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
    return NextResponse.redirect(`${origin}/reglages?google=connected`);
  } catch (e) {
    console.error("[google/callback]", e);
    const reason = e instanceof Error ? e.message : "unknown";
    return NextResponse.redirect(`${origin}/reglages?google=error&reason=${encodeURIComponent(reason)}`);
  }
}
