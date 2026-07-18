import { NextResponse } from "next/server";
import {
  GH_RETURN_COOKIE,
  GH_STATE_COOKIE,
  getAppUrl,
  githubOAuthConfigured,
  oauthAuthorizeUrl,
  sanitizeReturnTo,
} from "@/lib/github-auth";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  if (!githubOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }

  const appUrl = getAppUrl(req);
  const { searchParams } = new URL(req.url);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const state = randomBytes(16).toString("hex");
  const url = oauthAuthorizeUrl(state, appUrl);

  const res = NextResponse.redirect(url);
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(GH_STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  if (returnTo) {
    res.cookies.set(GH_RETURN_COOKIE, returnTo, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  } else {
    res.cookies.set(GH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}
