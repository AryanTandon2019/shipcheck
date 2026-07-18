import { NextResponse } from "next/server";
import {
  GH_RETURN_COOKIE,
  GH_STATE_COOKIE,
  GH_TOKEN_COOKIE,
  GH_USER_COOKIE,
  exchangeCodeForToken,
  fetchGitHubLogin,
  getAppUrl,
  sanitizeReturnTo,
} from "@/lib/github-auth";

function readCookie(header: string, name: string): string | undefined {
  return header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function GET(req: Request) {
  const appUrl = getAppUrl(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const err = searchParams.get("error");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const returnRaw = readCookie(cookieHeader, GH_RETURN_COOKIE);
  const returnTo = sanitizeReturnTo(returnRaw) ?? "/";

  const fail = (msg: string) => {
    const base = returnTo.startsWith("/report/")
      ? returnTo.split("?")[0]
      : "/";
    const res = NextResponse.redirect(
      `${appUrl}${base}?github_error=${encodeURIComponent(msg)}`,
    );
    res.cookies.set(GH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(GH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  };

  if (err) return fail(err);
  if (!code || !state) return fail("missing_code");

  const stateCookie = readCookie(cookieHeader, GH_STATE_COOKIE);
  if (!stateCookie || stateCookie !== state) return fail("invalid_state");

  try {
    const token = await exchangeCodeForToken(code, appUrl);
    const login = await fetchGitHubLogin(token);

    const dest =
      returnTo === "/"
        ? `${appUrl}/?github=connected`
        : `${appUrl}${returnTo}${returnTo.includes("?") ? "&" : "?"}github=connected`;

    const res = NextResponse.redirect(dest);
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(GH_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set(GH_USER_COOKIE, login, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set(GH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(GH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth_failed";
    return fail(msg);
  }
}
