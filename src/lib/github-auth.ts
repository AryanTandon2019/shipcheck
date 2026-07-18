import { cookies } from "next/headers";

export const GH_TOKEN_COOKIE = "shipcheck_gh_token";
export const GH_STATE_COOKIE = "shipcheck_gh_oauth_state";
export const GH_USER_COOKIE = "shipcheck_gh_user";
/** Relative path to land on after OAuth (e.g. /report/abc?tab=fix) */
export const GH_RETURN_COOKIE = "shipcheck_gh_return";

export function getAppUrl(req?: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

/** Only allow same-origin relative paths — blocks open redirects. */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    // Drop hash — query flags must stay on the path, not inside #fragment
    const noHash = decoded.split("#")[0] || "/";
    if (!noHash.startsWith("/") || noHash.startsWith("//")) return null;
    if (noHash.includes("://") || noHash.includes("\\")) return null;
    return noHash.slice(0, 512);
  } catch {
    return null;
  }
}

export function githubOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );
}

export async function getGitHubTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GH_TOKEN_COOKIE)?.value ?? null;
}

export async function getGitHubUserFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GH_USER_COOKIE)?.value ?? null;
}

export function oauthAuthorizeUrl(state: string, appUrl: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const redirect = `${appUrl}/api/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    scope: "repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  appUrl: string,
): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${appUrl}/api/github/callback`,
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(
      data.error_description || data.error || "GitHub OAuth token exchange failed",
    );
  }
  return data.access_token;
}

export async function fetchGitHubLogin(token: string): Promise<string> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "ShipCheck",
    },
  });
  if (!res.ok) throw new Error("Failed to load GitHub user");
  const data = (await res.json()) as { login: string };
  return data.login;
}
