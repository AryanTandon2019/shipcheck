import {
  generateFixPatches,
  generateNarrative,
  generateShipScenario,
  polishFindingsPlainEnglish,
} from "./ai";
import { fetchRepoFiles, fetchRepoMeta } from "./github";
import {
  buildLaunchChecklist,
  enrichAllFindings,
} from "./plain-english";
import {
  buildFounderBrief,
  computeProofOfFix,
  enrichReasoningFields,
} from "./reasoning";
import { runRules } from "./rules";
import { computeScore } from "./scoring";
import { detectStack } from "./stack";
import { newReportId, getStore } from "./storage";
import type { ScanReport } from "./types";
import { parseGitHubUrl } from "./utils";

export async function runScan(
  repoUrl: string,
  opts?: { token?: string | null },
): Promise<ScanReport> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error(
      "Invalid GitHub URL. Use https://github.com/owner/repo or owner/repo",
    );
  }

  const id = newReportId();
  const createdAt = new Date().toISOString();
  const auth = opts?.token ? { token: opts.token } : undefined;

  const meta = await fetchRepoMeta(parsed.owner, parsed.repo, auth);
  const { files, totalFiles } = await fetchRepoFiles(
    parsed.owner,
    parsed.repo,
    meta.defaultBranch,
    auth,
  );

  meta.scannedFiles = files.length;
  meta.totalFiles = totalFiles;

  const stack = detectStack(files);

  let findings = runRules(files);
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  findings = enrichReasoningFields(enrichAllFindings(findings));

  const score = computeScore(findings);

  const [
    { summary, vibeCoderRoast },
    fixPatches,
    shipScenario,
    polishedFindings,
  ] = await Promise.all([
    generateNarrative(meta, score, findings),
    generateFixPatches(meta, findings, stack),
    generateShipScenario(meta, score, findings),
    polishFindingsPlainEnglish(findings),
  ]);

  findings = enrichReasoningFields(enrichAllFindings(polishedFindings));
  const launchChecklist = buildLaunchChecklist(findings);
  const proofOfFix = computeProofOfFix(findings);
  const founderBrief = buildFounderBrief(findings, score, stack);

  const report: ScanReport = {
    id,
    createdAt,
    repoUrl: meta.htmlUrl,
    repo: meta,
    score,
    findings,
    summary,
    vibeCoderRoast,
    stack,
    fixPatches,
    shipScenario,
    launchChecklist,
    proofOfFix,
    founderBrief,
    status: "completed",
  };

  await getStore().save(report);
  return report;
}
