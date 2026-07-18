import { NextResponse } from "next/server";
import { getGitHubTokenFromCookies } from "@/lib/github-auth";
import { runRecheck } from "@/lib/recheck";
import { getStore } from "@/lib/storage";
import type { FixPatch } from "@/lib/types";
import { z } from "zod";

export const maxDuration = 60;

const bodySchema = z.object({
  /** Load baseline from server storage — never trust client findings/score */
  reportId: z.string().min(4).max(64),
  patches: z
    .array(
      z.object({
        findingId: z.string(),
        title: z.string(),
        language: z.string(),
        code: z.string(),
        explanation: z.string(),
        stackLabel: z.string().optional(),
      }),
    )
    .min(1)
    .max(5),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid recheck payload. Provide reportId and at least one patch.",
        },
        { status: 400 },
      );
    }

    const baseline = await getStore().get(parsed.data.reportId);
    if (!baseline || baseline.status !== "completed") {
      return NextResponse.json(
        {
          error:
            "Baseline report not found on server. Re-run the audit, then try again (same session helps on serverless).",
        },
        { status: 404 },
      );
    }

    const token = await getGitHubTokenFromCookies();
    const result = await runRecheck({
      reportId: baseline.id,
      repoUrl: baseline.repoUrl || `${baseline.repo.owner}/${baseline.repo.repo}`,
      patches: parsed.data.patches as FixPatch[],
      baselineFindings: baseline.findings,
      baselineScore: baseline.score,
      token,
    });

    return NextResponse.json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Recheck failed. Try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
