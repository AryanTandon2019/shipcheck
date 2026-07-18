"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProofOfFix } from "@/lib/types";
import { ArrowRight, LineChart, Play } from "lucide-react";
import { cn, gradeColor } from "@/lib/utils";

export function ProofOfFixPanel({ proof }: { proof: ProofOfFix }) {
  const [shown, setShown] = useState(false);
  const improved = proof.afterScore > proof.beforeScore;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent-soft)] via-white to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
              Preview projected score
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--fg-secondary)]">
              Estimates the ship score if you apply the top framework-correct
              patches. Not a live re-scan of modified code.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShown(true)}
          disabled={shown}
          className={cn(
            "btn-shine inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition",
            shown
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "bg-[var(--fg)] text-white hover:bg-black",
          )}
        >
          {shown ? (
            <>
              <LineChart className="h-4 w-4" />
              Projection ready
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              Preview projected score
            </>
          )}
        </button>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-6">
        <ScoreBlock
          label="Current"
          grade={proof.beforeGrade}
          score={proof.beforeScore}
          muted={shown}
        />
        <div className="flex justify-center">
          <ArrowRight
            className={cn(
              "h-6 w-6 text-[var(--fg-tertiary)] transition",
              shown && "text-[var(--accent)]",
            )}
          />
        </div>
        <AnimatePresence mode="wait">
          {shown ? (
            <motion.div
              key="after"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScoreBlock
                label="If top patches applied"
                grade={proof.afterGrade}
                score={proof.afterScore}
                highlight={improved}
              />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-5 py-8 text-center text-[13px] text-[var(--fg-tertiary)]"
            >
              Click to preview the projected score
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {shown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 border-t border-[var(--border)] bg-[var(--bg)]/50 px-5 py-4 sm:px-6"
        >
          <ul className="space-y-2">
            {proof.summaryLines.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-[13px] leading-snug text-[var(--fg-secondary)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                {line}
              </li>
            ))}
          </ul>
          {proof.resolvedTitles.length > 0 && (
            <p className="text-[12px] text-[var(--fg-tertiary)]">
              Cleared in projection: {proof.resolvedTitles.join(" · ")}
            </p>
          )}
          {proof.remainingTitles.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-3 text-[13px] text-amber-950">
              <span className="font-semibold">
                {proof.remainingTitles.length === 1
                  ? "1 high-priority issue remains: "
                  : `${proof.remainingTitles.length} high-priority issues remain: `}
              </span>
              {proof.remainingTitles.join("; ")}
            </div>
          )}
        </motion.div>
      )}
    </motion.section>
  );
}

function ScoreBlock({
  label,
  grade,
  score,
  muted,
  highlight,
}: {
  label: string;
  grade: string;
  score: number;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-5 text-center transition",
        highlight
          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow-sm)]"
          : "border-[var(--border)] bg-white",
        muted && "opacity-60",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
        {label}
      </p>
      <p className={cn("mt-2 font-display text-[48px] leading-none", gradeColor(grade))}>
        {grade}
      </p>
      <p className="mt-1 tabular-nums text-[14px] text-[var(--fg-secondary)]">
        {score}/100
      </p>
    </div>
  );
}
