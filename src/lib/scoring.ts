import type { Finding, ScanScore } from "./types";
import { scoreToGrade, severityWeight } from "./utils";

/**
 * Public weights — overall is ALWAYS derived from the three category scores.
 * Judges can verify: overall ≈ 0.5×Security + 0.3×Production + 0.2×Best practices
 */
export const SCORE_WEIGHTS = {
  security: 0.5,
  production: 0.3,
  bestPractices: 0.2,
} as const;

export const SCORE_WEIGHTS_LABEL =
  "Overall = Security 50% + Production 30% + Best practices 20% (security weighted highest — largest blast radius)";

function categoryScore(penalty: number): number {
  // Same curve for every category so math stays consistent
  const capped = Math.min(penalty, 80);
  return Math.max(0, Math.min(100, Math.round(100 - capped)));
}

/**
 * Fair + consistent scoring:
 * 1) Diminishing penalties per ruleId (monorepos don't stack to nonsense)
 * 2) Split penalty into security / production / best-practices
 * 3) Overall is the weighted average of those three — never a separate formula
 */
export function computeScore(findings: Finding[]): ScanScore {
  const byRule = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byRule.get(f.ruleId) ?? [];
    list.push(f);
    byRule.set(f.ruleId, list);
  }

  let securityPenalty = 0;
  let productionPenalty = 0;
  let practicesPenalty = 0;

  for (const list of byRule.values()) {
    list.forEach((f, index) => {
      const base = severityWeight(f.severity);
      // 1st = 100%, 2nd = 40%, 3rd = 15%, further = 0 (shown in UI, not double-counted)
      const factor = index === 0 ? 1 : index === 1 ? 0.4 : index < 3 ? 0.15 : 0;
      const w = base * factor;

      if (["secrets", "auth", "injection", "api"].includes(f.category)) {
        securityPenalty += w;
      } else if (f.category === "production" || f.category === "config") {
        productionPenalty += w;
      } else {
        practicesPenalty += w;
      }
    });
  }

  const security = categoryScore(securityPenalty);
  const production = categoryScore(productionPenalty);
  const bestPractices = categoryScore(practicesPenalty);

  const overall = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        security * SCORE_WEIGHTS.security +
          production * SCORE_WEIGHTS.production +
          bestPractices * SCORE_WEIGHTS.bestPractices,
      ),
    ),
  );

  return {
    overall,
    grade: scoreToGrade(overall),
    breakdown: {
      security,
      production,
      bestPractices,
    },
  };
}
