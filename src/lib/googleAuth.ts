import { cookies } from "next/headers";

// ─── Constantes ───────────────────────────────────────────────────────────────

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/keep",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

const COOKIE_ACCESS  = "g_access_token";
const COOKIE_REFRESH = "g_refresh_token";
const COOKIE_EXPIRY  = "g_expires_at";
const COOKIE_EMAIL   = "g_email";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // 30 jours pour le refresh token, le reste sera rafraîchi
  maxAge: 60 * 60 * 24 * 30,
};

// ─── Helpers env ──────────────────────────────────────────────────────────────

export function getGoogleConfig() {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl      = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth env vars manquantes (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)");
  }
  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/google/callback`,
  };
}

// ─── URL de consentement ──────────────────────────────────────────────────────

export function buildAuthUrl(state: string) {
  const { clientId, redirectUri } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ─── Échange code → tokens ────────────────────────────────────────────────────

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec échange code: ${res.status} ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
  };
}

// ─── Refresh token ────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleConfig();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec refresh: ${res.status} ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

// ─── Récupérer email Google ──────────────────────────────────────────────────

export async function fetchUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

// ─── Cookies ──────────────────────────────────────────────────────────────────

export async function setTokenCookies(opts: {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  email?: string | null;
}) {
  const c = cookies();
  const expiresAt = Date.now() + opts.expiresIn * 1000;
  c.set(COOKIE_ACCESS, opts.accessToken, COOKIE_OPTS);
  c.set(COOKIE_EXPIRY, String(expiresAt), COOKIE_OPTS);
  if (opts.refreshToken) {
    c.set(COOKIE_REFRESH, opts.refreshToken, COOKIE_OPTS);
  }
  if (opts.email) {
    c.set(COOKIE_EMAIL, opts.email, { ...COOKIE_OPTS, httpOnly: false });
  }
}

export async function clearTokenCookies() {
  const c = cookies();
  c.delete(COOKIE_ACCESS);
  c.delete(COOKIE_REFRESH);
  c.delete(COOKIE_EXPIRY);
  c.delete(COOKIE_EMAIL);
}

export async function getStoredEmail(): Promise<string | null> {
  const c = cookies();
  return c.get(COOKIE_EMAIL)?.value ?? null;
}

/**
 * Récupère un access token valide. Refresh automatique si expiré.
 * Retourne null si l'utilisateur n'est pas connecté.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const c = cookies();
  const access  = c.get(COOKIE_ACCESS)?.value;
  const refresh = c.get(COOKIE_REFRESH)?.value;
  const expiry  = Number(c.get(COOKIE_EXPIRY)?.value || 0);

  if (!refresh && !access) return null;

  // Encore valide (avec 60s de marge)
  if (access && expiry && Date.now() < expiry - 60_000) {
    return access;
  }

  // Refresh
  if (!refresh) return null;
  try {
    const data = await refreshAccessToken(refresh);
    await setTokenCookies({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    });
    return data.access_token;
  } catch (e) {
    console.error("[google] refresh échoué", e);
    return null;
  }
}

// ─── Fetch authentifié vers l'API Google ─────────────────────────────────────

export async function googleFetch(path: string, init?: RequestInit) {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }
  const url = path.startsWith("http") ? path : `https://www.googleapis.com${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res;
}
