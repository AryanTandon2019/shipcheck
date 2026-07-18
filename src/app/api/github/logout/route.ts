import { NextResponse } from "next/server";
import {
  GH_TOKEN_COOKIE,
  GH_USER_COOKIE,
  getAppUrl,
} from "@/lib/github-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(GH_USER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: Request) {
  const appUrl = getAppUrl(req);
  const res = NextResponse.redirect(`${appUrl}/`);
  res.cookies.set(GH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(GH_USER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
