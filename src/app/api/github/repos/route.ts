import { NextResponse } from "next/server";
import { getGitHubTokenFromCookies } from "@/lib/github-auth";
import { listUserRepos } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = await getGitHubTokenFromCookies();
  if (!token) {
    return NextResponse.json(
      { error: "Connect GitHub first.", code: "NOT_CONNECTED" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const q = searchParams.get("q") || undefined;

  try {
    const { repos, hasMore } = await listUserRepos(token, {
      page,
      perPage: 50,
      query: q,
    });
    return NextResponse.json({ repos, hasMore, page });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list repositories.";
    const status = /expired|401/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
