"use client";

import { motion } from "framer-motion";
import type { Finding, IssueCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Record<IssueCategory, string> = {
  secrets: "Secrets",
  auth: "Auth",
  api: "APIs",
  injection: "Injection",
  config: "Config",
  dependencies: "Deps",
  "best-practices": "Hygiene",
  production: "Production",
};

const WEIGHT = { critical: 4, high: 3, medium: 2, low: 1, info: 0.5 };

export function RiskHeatmap({ findings }: { findings: Finding[] }) {
  const scores = new Map<IssueCategory, number>();
  for (const f of findings) {
    scores.set(f.category, (scores.get(f.category) ?? 0) + WEIGHT[f.severity]);
  }

  const cats = (Object.keys(LABELS) as IssueCategory[]).map((c) => ({
    key: c,
    label: LABELS[c],
    score: scores.get(c) ?? 0,
  }));
  const max = Math.max(1, ...cats.map((c) => c.score));

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card h-full p-5 sm:p-6"
    >
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold tracking-[-0.02em]">
          Risk heatmap
        </h2>
        <p className="mt-1 text-[13px] text-[var(--fg-secondary)]">
          Where the scan found pressure — darker means more / worse findings.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cats.map((c, i) => {
          const t = c.score / max;
          const bg =
            c.score === 0
              ? "bg-[var(--bg-muted)]"
              : t > 0.75
                ? "bg-red-500/90 text-white"
                : t > 0.45
                  ? "bg-orange-400/90 text-white"
                  : t > 0.2
                    ? "bg-amber-300/90 text-amber-950"
                    : "bg-emerald-100 text-emerald-900";
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.03 }}
              className={cn(
                "rounded-2xl px-3 py-4 text-center transition",
                bg,
              )}
            >
              <p className="text-[12px] font-medium opacity-90">{c.label}</p>
              <p className="mt-1 font-display text-[22px] tabular-nums leading-none">
                {c.score === 0 ? "—" : c.score.toFixed(c.score % 1 ? 1 : 0)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
