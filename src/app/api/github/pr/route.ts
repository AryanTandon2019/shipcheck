import { NextResponse } from "next/server";
import { getGitHubTokenFromCookies } from "@/lib/github-auth";
import { createFixPullRequest } from "@/lib/github-pr";
import type { FixPatch, Finding } from "@/lib/types";
import { z } from "zod";

export const maxDuration = 60;
export const runtime = "nodejs";

const patchSchema = z.object({
  findingId: z.string(),
  title: z.string(),
  language: z.string().default("text"),
  code: z.string(),
  explanation: z.string().default(""),
  stackLabel: z.string().optional(),
});

const bodySchema = z.object({
  reportId: z.string().min(4).max(64),
  patchFindingIds: z.array(z.string()).min(1).max(5),
  /** Always preferred on Vercel — client has the full report */
  snapshot: z.object({
    id: z.string().min(4).max(64),
    repo: z.object({
      owner: z.string().min(1).max(100),
      repo: z.string().min(1).max(100),
    }),
    score: z
      .object({
        grade: z.string(),
        overall: z.number(),
      })
      .optional(),
    findings: z.array(z.any()).optional(),
    fixPatches: z.array(patchSchema).min(1).max(20),
  }),
});

export async function POST(req: Request) {
  try {
    const token = await getGitHubTokenFromCookies();
    if (!token) {
      return NextResponse.json(
        { error: "Connect GitHub first.", code: "NOT_CONNECTED" },
        { status: 401 },
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Missing report snapshot or patches. Re-run the audit, stay on this page, then open the PR.",
          code: "BAD_PAYLOAD",
        },
        { status: 400 },
      );
    }

    const { reportId, patchFindingIds, snapshot } = parsed.data;

    if (snapshot.id !== reportId) {
      return NextResponse.json(
        { error: "Report id mismatch." },
        { status: 400 },
      );
    }

    // Prefer snapshot patches (always available client-side)
    let patches: FixPatch[] = snapshot.fixPatches.filter((p) =>
      patchFindingIds.includes(p.findingId),
    );
    if (!patches.length) {
      // Fallback: use all snapshot patches that were sent
      patches = snapshot.fixPatches.slice(0, 5) as FixPatch[];
    }
    if (!patches.length) {
      return NextResponse.json(
        { error: "No patches selected. Select at least one fix." },
        { status: 400 },
      );
    }

    const findings = (snapshot.findings ?? []) as Finding[];

    const result = await createFixPullRequest({
      token,
      owner: snapshot.repo.owner,
      repo: snapshot.repo.repo,
      patches: patches as FixPatch[],
      findings,
      scoreLabel: snapshot.score
        ? `${snapshot.score.grade} ${snapshot.score.overall}/100`
        : undefined,
    });

    return NextResponse.json({ pr: result });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    const message =
      anyErr?.response?.data?.message ||
      (err instanceof Error ? err.message : "Failed to create pull request.");
    const status =
      /write access|No write|Cannot access|Resource not accessible|Not Found|403|401|permission/i.test(
        message,
      )
        ? 403
        : 400;
    console.error("[github/pr]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
