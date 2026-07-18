import { NextResponse } from "next/server";
import { getGitHubTokenFromCookies } from "@/lib/github-auth";
import { runScan } from "@/lib/scanner";
import { z } from "zod";

const bodySchema = z.object({
  repoUrl: z.string().min(3).max(300),
});

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide a valid GitHub repository URL." },
        { status: 400 },
      );
    }

    // Prefer user OAuth token so private repos + higher rate limits work
    const token = await getGitHubTokenFromCookies();
    const report = await runScan(parsed.data.repoUrl, { token });
    return NextResponse.json({ report });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Scan failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
