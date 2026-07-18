import { NextResponse } from "next/server";
import {
  getGitHubTokenFromCookies,
  getGitHubUserFromCookies,
  githubOAuthConfigured,
} from "@/lib/github-auth";

export async function GET() {
  const configured = githubOAuthConfigured();
  const token = await getGitHubTokenFromCookies();
  const login = await getGitHubUserFromCookies();

  if (!token) {
    return NextResponse.json({
      connected: false,
      configured,
      login: null,
    });
  }

  return NextResponse.json({
    connected: true,
    configured,
    login: login ?? "github-user",
  });
}
