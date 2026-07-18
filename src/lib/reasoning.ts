import type {
  Confidence,
  Effort,
  Finding,
  FounderBrief,
  ProofOfFix,
  StackInfo,
} from "./types";
import { computeScore } from "./scoring";
import { scoreToGrade } from "./utils";
import { verdictFromScore } from "./verdict";

const ATTACK: Record<string, string> = {
  "secrets.hardcoded":
    "Attacker clones the public repo (or scrapes history), extracts the key, and calls your paid APIs or cloud account as you.",
  "secrets.env-committed":
    "Secrets in git remain recoverable from history. Automated scanners harvest .env files from public repos within minutes of push.",
  "secrets.client-exposed":
    "Anyone opens DevTools → Network/Sources, copies the public key, and reuses privileged access from their own machine.",
  "api.no-rate-limit":
    "A simple script loops against your endpoint. Without throttling, AI bills spike and legitimate users get rate-starved.",
  "api.open-cors":
    "A malicious website makes browser-side requests as the logged-in user, exfiltrating data the API thought was “same-origin only.”",
  "auth.missing-on-api":
    "Unauthenticated clients call the route directly (curl/Postman/bot), reading or writing data that should require a session.",
  "auth.admin-unprotected":
    "Guessable admin URLs are probed; without role checks, admin actions execute for any caller.",
  "auth.webhook-no-verify":
    "Attacker POSTs forged webhook payloads to mark payments complete or provision free accounts.",
  "injection.sql":
    "Crafted input closes the query early and appends attacker SQL — dump tables or bypass auth checks.",
  "injection.eval":
    "If attacker-controlled strings reach eval/Function, they execute arbitrary JS on the server.",
  "injection.xss-dbihtml":
    "Injected script runs in other users’ browsers, steals sessions, or rewrites the UI for phishing.",
  "prod.no-security-headers":
    "Missing frame/CSP headers enable clickjacking and some XSS amplification against your users.",
  "config.env-not-ignored":
    "Developer commits .env by accident on the next feature branch — keys land on GitHub before anyone notices.",
};

const BUSINESS: Record<string, string> = {
  secrets: "Can expose customer data or burn paid API / cloud credits overnight.",
  auth: "Can let strangers access private data or admin actions.",
  api: "Can cause outages or runaway AI/infrastructure spend.",
  injection: "Classic path to data breach and account takeover.",
  config: "Misconfig is how “it worked on my laptop” becomes an incident.",
  production: "Demo-quality hardening fails under real traffic and scanners.",
  dependencies: "Weak base hygiene multiplies risk as you add AI features.",
  "best-practices": "Slow-burn risk: bugs and regressions ship without a safety net.",
};

function effortFor(severity: Finding["severity"], ruleId: string): Effort {
  if (ruleId.includes("env") || ruleId.includes("gitignore") || ruleId.includes("headers"))
    return "15 min";
  if (severity === "critical" || severityIsAuth(ruleId)) return "1 hour";
  if (severity === "high") return "1 hour";
  return "15 min";
}

function severityIsAuth(ruleId: string) {
  return ruleId.includes("auth") || ruleId.includes("rate-limit");
}

function confidenceFor(f: Finding): Confidence {
  if (f.evidence && f.file) return "high";
  if (f.file) return "medium";
  // Heuristic-only (e.g. global “no rate limit”)
  if (!f.file) return "medium";
  return "low";
}

export function enrichReasoningFields(findings: Finding[]): Finding[] {
  return findings.map((f) => ({
    ...f,
    attackPath: f.attackPath ?? ATTACK[f.ruleId] ?? ATTACK[f.category] ??
      "An attacker probes public surfaces and abuses the weakest unverified path.",
    businessImpact:
      f.businessImpact ??
      BUSINESS[f.category] ??
      "Increases chance of a launch-week incident.",
    confidence: f.confidence ?? confidenceFor(f),
    effort: f.effort ?? effortFor(f.severity, f.ruleId),
  }));
}

/** Rules that a “verified path to fix” can clear in a recheck simulation */
const FIXABLE = new Set([
  "api.no-rate-limit",
  "auth.missing-on-api",
  "prod.no-security-headers",
  "config.env-not-ignored",
  "config.no-env-example",
  "secrets.env-committed",
  "api.open-cors",
  "deps.no-validation",
  "deps.express-security",
  "api.weak-error-handling",
]);

/**
 * Project score if top fixable patches were applied.
 * Honest preview — not a live re-scan of a modified repo.
 */
export function computeProofOfFix(findings: Finding[]): ProofOfFix {
  const before = computeScore(findings);
  const criticalBefore = findings.filter((f) => f.severity === "critical").length;
  const highBefore = findings.filter((f) => f.severity === "high").length;

  const ordered = [...findings].sort((a, b) => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return rank[a.severity] - rank[b.severity];
  });

  const resolved: Finding[] = [];
  for (const f of ordered) {
    if (resolved.length >= 3) break;
    if (FIXABLE.has(f.ruleId)) {
      if (!resolved.find((r) => r.ruleId === f.ruleId)) {
        resolved.push(f);
      }
    }
  }

  const resolvedRules = new Set(resolved.map((f) => f.ruleId));
  const afterFindings = findings.filter((f) => !resolvedRules.has(f.ruleId));

  const after = computeScore(afterFindings);
  const criticalAfter = afterFindings.filter((f) => f.severity === "critical").length;
  const highAfter = afterFindings.filter((f) => f.severity === "high").length;

  const remainingPriority = afterFindings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 5);

  const remainingTitles = remainingPriority.map((f) => f.title);

  const summaryLines: string[] = [
    `Projected ship score: ${before.grade} ${before.overall} → ${after.grade} ${after.overall}`,
    `Critical issues: ${criticalBefore} → ${criticalAfter}`,
    `High issues: ${highBefore} → ${highAfter}`,
  ];

  if (remainingTitles.length === 1) {
    summaryLines.push(
      `1 high-priority issue remains: ${remainingTitles[0]}`,
    );
  } else if (remainingTitles.length > 1) {
    summaryLines.push(
      `${remainingTitles.length} high-priority issues remain: ${remainingTitles.join("; ")}`,
    );
  } else {
    summaryLines.push("No critical/high issues left in this projection");
  }

  if (resolved.some((f) => f.ruleId.includes("rate-limit"))) {
    summaryLines.push("Rate limiting: included in projection");
  }
  if (resolved.some((f) => f.ruleId.includes("auth"))) {
    summaryLines.push("Auth gates on open endpoints: included in projection");
  }

  return {
    beforeScore: before.overall,
    beforeGrade: before.grade,
    afterScore: after.overall,
    afterGrade: after.grade,
    criticalBefore,
    criticalAfter,
    highBefore,
    highAfter,
    resolvedTitles: resolved.map((f) => f.title),
    remainingTitles,
    summaryLines,
  };
}

export function buildFounderBrief(
  findings: Finding[],
  score: ReturnType<typeof computeScore>,
  stack?: StackInfo,
): FounderBrief {
  const verdict = verdictFromScore(score, findings);
  const canShip =
    score.overall >= 75 &&
    findings.filter((f) => f.severity === "critical").length === 0;

  const top = [...findings]
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 3);

  const topRisks = top.map(
    (f) =>
      f.businessImpact ||
      f.simpleExplain ||
      f.title,
  );

  const fixFirst = top.map((f) => f.title);
  const efforts = top.map((f) => ({
    title: f.title,
    effort: f.effort ?? ("1 hour" as Effort),
  }));

  const decision = canShip
    ? `Conditional ship: grade ${score.grade} (${score.overall}/100). No critical blockers in this pass — still finish the checklist before paid traffic.`
    : `Do not ship yet: grade ${score.grade} (${score.overall}/100). ${verdict.headline} Fix the top risks first.`;

  const cofounderMessage = [
    `ShipCheck gate on ${stack?.label ? `a ${stack.label} app` : "the repo"}:`,
    ``,
    `Decision: ${canShip ? "ALMOST — not a hard no" : "NOT SHIP-READY"}`,
    `Score: ${score.grade} ${score.overall}/100`,
    ``,
    `Top business risks:`,
    ...topRisks.map((r, i) => `${i + 1}. ${r}`),
    ``,
    `Fix first:`,
    ...fixFirst.map((t, i) => `${i + 1}. ${t} (~${efforts[i]?.effort ?? "1 hour"})`),
    ``,
    decision,
  ].join("\n");

  return {
    canShip,
    decision,
    topRisks,
    fixFirst,
    efforts,
    cofounderMessage,
  };
}

export function scoreToGradePublic(score: number) {
  return scoreToGrade(score);
}
