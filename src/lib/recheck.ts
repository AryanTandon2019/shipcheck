import { applyPatchesToFiles } from "./apply-patches";
import { fetchRepoFiles, fetchRepoMeta } from "./github";
import { enrichAllFindings } from "./plain-english";
import { enrichReasoningFields } from "./reasoning";
import { runRules } from "./rules";
import { computeScore } from "./scoring";
import { detectStack } from "./stack";
import { newReportId, getStore } from "./storage";
import type { FixPatch, Finding, ScanReport, ScanScore } from "./types";
import { parseGitHubUrl } from "./utils";

export interface RecheckResult {
  before: {
    score: ScanScore;
    findingCount: number;
    critical: number;
    high: number;
  };
  after: {
    score: ScanScore;
    findingCount: number;
    critical: number;
    high: number;
    findings: Finding[];
  };
  applied: string[];
  notes: string[];
  clearedTitles: string[];
  remainingHighPriority: string[];
  recheckReportId: string;
  disclaimer: string;
}

/**
 * Sandbox recheck: re-fetch repo → apply patches in an analysis workspace
 * → re-run static rules. This is NOT compile/test verification.
 */
export async function runRecheck(opts: {
  reportId: string;
  repoUrl: string;
  patches: FixPatch[];
  baselineFindings: Finding[];
  baselineScore: ScanScore;
  token?: string | null;
}): Promise<RecheckResult> {
  const parsed = parseGitHubUrl(opts.repoUrl);
  if (!parsed) {
    throw new Error("Invalid repository URL for recheck.");
  }
  if (!opts.patches.length) {
    throw new Error("Select at least one patch to apply before rechecking.");
  }

  const auth = opts.token ? { token: opts.token } : undefined;
  const meta = await fetchRepoMeta(parsed.owner, parsed.repo, auth);
  const { files, totalFiles } = await fetchRepoFiles(
    parsed.owner,
    parsed.repo,
    meta.defaultBranch,
    auth,
  );

  const { files: patchedFiles, applied, notes } = applyPatchesToFiles(
    files,
    opts.patches,
    opts.baselineFindings,
  );

  let findings = runRules(patchedFiles);
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  findings = enrichReasoningFields(enrichAllFindings(findings));

  const afterScore = computeScore(findings);
  const stack = detectStack(patchedFiles);

  const beforeCritical = opts.baselineFindings.filter(
    (f) => f.severity === "critical",
  ).length;
  const beforeHigh = opts.baselineFindings.filter((f) => f.severity === "high").length;
  const afterCritical = findings.filter((f) => f.severity === "critical").length;
  const afterHigh = findings.filter((f) => f.severity === "high").length;

  const afterRules = new Set(findings.map((f) => f.ruleId));
  const clearedTitles = opts.baselineFindings
    .filter(
      (f) =>
        (f.severity === "critical" || f.severity === "high") &&
        !afterRules.has(f.ruleId),
    )
    .map((f) => f.title);

  const remainingHighPriority = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .map((f) => f.title);

  const disclaimer =
    "Sandbox analysis only: patches were applied to a temporary file tree and static rules were re-run. This does not prove the project compiles, tests pass, or production traffic is safe.";

  const recheckId = newReportId();
  meta.scannedFiles = patchedFiles.filter(
    (f) => !f.path.startsWith(".shipcheck/"),
  ).length;
  meta.totalFiles = totalFiles;

  const recheckReport: ScanReport = {
    id: recheckId,
    createdAt: new Date().toISOString(),
    repoUrl: meta.htmlUrl,
    repo: meta,
    score: afterScore,
    findings,
    summary: `Sandbox recheck after ${applied.length} patch(es): grade ${opts.baselineScore.grade} ${opts.baselineScore.overall} → ${afterScore.grade} ${afterScore.overall}. ${disclaimer}`,
    vibeCoderRoast: `Second static pass in a sandbox workspace. ${clearedTitles.length} high-priority rule(s) no longer matched; ${remainingHighPriority.length} remain. Not a build/test verification.`,
    stack,
    status: "completed",
  };
  await getStore().save(recheckReport);

  return {
    before: {
      score: opts.baselineScore,
      findingCount: opts.baselineFindings.length,
      critical: beforeCritical,
      high: beforeHigh,
    },
    after: {
      score: afterScore,
      findingCount: findings.length,
      critical: afterCritical,
      high: afterHigh,
      findings,
    },
    applied,
    notes,
    clearedTitles,
    remainingHighPriority,
    recheckReportId: recheckId,
    disclaimer,
  };
}
