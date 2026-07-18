import type { Finding, ScanScore, Severity } from "./types";

export function verdictFromScore(score: ScanScore, findings: Finding[]) {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;
  const priority = critical + high;

  if (score.overall >= 85 && critical === 0 && high === 0) {
    return {
      label: "Ship-ready",
      tone: "good" as const,
      headline: "No high-priority risks in this pass.",
      body: "Looks production-viable from ShipCheck’s checks. Re-run after the next AI-generated feature.",
    };
  }
  if (score.overall >= 85 && critical === 0) {
    return {
      label: "Near ship-ready",
      tone: "good" as const,
      headline: `Nearly ready — ${high} high-priority risk${high === 1 ? "" : "s"} remain.`,
      body: "Grade is strong, but clear the remaining high items before calling it production.",
    };
  }
  if (priority > 0) {
    return {
      label: "Not production-ready",
      tone: critical > 0 ? ("bad" as const) : ("warn" as const),
      headline: `Not production-ready — ${priority} high-priority risk${priority === 1 ? "" : "s"} remain.`,
      body:
        critical > 0
          ? `${critical} critical and ${high} high issue${high === 1 ? "" : "s"} need attention before real users or paid traffic.`
          : `${high} high-severity issue${high === 1 ? "" : "s"} should be fixed before you treat this as production.`,
    };
  }
  if (score.overall < 60) {
    return {
      label: "Not production-ready",
      tone: "bad" as const,
      headline: "Not production-ready — too many production gaps.",
      body: "Hygiene and config issues would create launch friction. Work the priority list first.",
    };
  }
  return {
    label: "Polish required",
    tone: "ok" as const,
    headline: "Demo-ready, not fully production-hardened.",
    body: "No critical/high blockers, but remaining medium/low items still matter before scale.",
  };
}

export function severityCounts(findings: Finding[]) {
  const base: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of findings) base[f.severity] += 1;
  return base;
}

export function priorityFixes(findings: Finding[], limit = 3): Finding[] {
  const order: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  return [...findings]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, limit);
}

export function gradeMeaning(grade: string): string {
  switch (grade) {
    case "A":
      return "Excellent production hygiene";
    case "B":
      return "Good — minor polish left";
    case "C":
      return "Usable demo, not full prod";
    case "D":
      return "Risky to expose publicly";
    default:
      return "High risk — fix before launch";
  }
}
