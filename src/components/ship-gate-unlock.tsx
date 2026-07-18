"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Finding, FixPatch, ProofOfFix, ScanReport } from "@/lib/types";
import { cn, gradeColor } from "@/lib/utils";
import { buildPatchDownload } from "@/lib/apply-patches";
import {
  Check,
  Download,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type RecheckApiResult = {
  before: {
    score: { overall: number; grade: string };
    findingCount: number;
    critical: number;
    high: number;
  };
  after: {
    score: { overall: number; grade: string };
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
};

/**
 * Sandbox recheck UI: select patches → server loads report by ID →
 * re-fetch repo → apply in analysis workspace → re-run static rules.
 */
export function ShipGateUnlock({
  report,
  patches,
  findings,
  stackLabel,
}: {
  report: ScanReport;
  patches: FixPatch[];
  proof: ProofOfFix;
  findings: Finding[];
  stackLabel?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(patches.slice(0, 2).map((p) => p.findingId)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecheckApiResult | null>(null);

  const selectedPatches = useMemo(
    () => patches.filter((p) => selected.has(p.findingId)),
    [patches, selected],
  );

  function toggle(id: string) {
    if (loading) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResult(null);
    setError(null);
  }

  async function runSandboxRecheck() {
    if (!selectedPatches.length || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          patches: selectedPatches,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Recheck failed");
        setLoading(false);
        return;
      }
      setResult(data.result as RecheckApiResult);
    } catch {
      setError("Network error during recheck.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPatches() {
    const text = buildPatchDownload(
      selectedPatches.length ? selectedPatches : patches,
      findings,
      `${report.repo.owner}/${report.repo.repo}`,
    );
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `shipcheck-${report.repo.repo}-fixes.txt`;
    a.click();
    URL.revokeObjectURL(href);
  }

  if (!patches.length) return null;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg)]/50 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800 ring-1 ring-amber-200">
              <AlertTriangle className="h-3 w-3" />
              Sandbox recheck
            </div>
            <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
              Apply patches & re-run static analysis
            </h2>
            <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-[var(--fg-secondary)]">
              Server loads your report by ID, re-fetches the repo, applies
              selected patches in a temporary analysis workspace, then re-runs
              rules. This is a second static pass — not a build/test proof.
              {stackLabel ? ` Stack: ${stackLabel}.` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadPatches}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3.5 text-[12.5px] font-medium text-[var(--fg)]"
          >
            <Download className="h-3.5 w-3.5" />
            Download fixes
          </button>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5 sm:px-6">
        <p className="text-[12px] font-medium text-[var(--fg-tertiary)]">
          Select patches to apply in the sandbox
        </p>
        {patches.map((p) => {
          const finding = findings.find((f) => f.id === p.findingId);
          const on = selected.has(p.findingId);
          return (
            <label
              key={p.findingId + p.title}
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition",
                on
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]/40"
                  : "border-[var(--border)] bg-white hover:border-[var(--border-strong)]",
              )}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={on}
                onChange={() => toggle(p.findingId)}
                disabled={loading}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[var(--fg)]">
                  {p.title}
                </p>
                <p className="mt-0.5 text-[12.5px] text-[var(--fg-secondary)]">
                  {p.explanation}
                </p>
                {finding?.file && (
                  <p className="mt-1 font-mono text-[11.5px] text-[var(--fg-tertiary)]">
                    {finding.file}
                    {finding.line ? `:${finding.line}` : ""}
                  </p>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] text-[var(--accent)]">
                    View patch code
                  </summary>
                  <pre className="evidence mt-2 max-h-40 overflow-auto text-[11px]">
                    {p.code}
                  </pre>
                </details>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <button
          type="button"
          onClick={() => void runSandboxRecheck()}
          disabled={loading || selectedPatches.length === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--fg)] px-5 text-[13.5px] font-medium text-white disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Re-fetching repo & re-running rules…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Run sandbox recheck ({selectedPatches.length})
            </>
          )}
        </button>
        {error && <p className="text-[13px] text-[var(--danger)]">{error}</p>}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-[var(--border)] bg-[var(--bg)]/40 px-5 py-5 sm:px-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
              Sandbox recheck result
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ScoreCard
                label="Before"
                grade={result.before.score.grade}
                score={result.before.score.overall}
                meta={`${result.before.critical} critical · ${result.before.high} high · ${result.before.findingCount} total`}
              />
              <ScoreCard
                label="After static re-pass"
                grade={result.after.score.grade}
                score={result.after.score.overall}
                meta={`${result.after.critical} critical · ${result.after.high} high · ${result.after.findingCount} total`}
                highlight
              />
            </div>

            <ul className="mt-4 space-y-2 text-[13px] text-[var(--fg-secondary)]">
              <li>
                <span className="font-medium text-[var(--fg)]">Applied: </span>
                {result.applied.join(" · ") || "—"}
              </li>
              {result.clearedTitles.length > 0 && (
                <li className="text-[var(--accent)]">
                  <span className="font-medium">No longer matched: </span>
                  {result.clearedTitles.join("; ")}
                </li>
              )}
              {result.remainingHighPriority.length > 0 ? (
                <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                  <span className="font-semibold">
                    {result.remainingHighPriority.length === 1
                      ? "1 high-priority issue remains: "
                      : `${result.remainingHighPriority.length} high-priority issues remain: `}
                  </span>
                  {result.remainingHighPriority.join("; ")}
                </li>
              ) : (
                <li className="flex items-center gap-1.5 text-[var(--accent)]">
                  <Check className="h-4 w-4" />
                  No critical/high rule matches after this sandbox pass
                </li>
              )}
            </ul>

            <p className="mt-4 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--fg-tertiary)]">
              {result.disclaimer}
            </p>

            {result.notes.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[12px] text-[var(--fg-tertiary)]">
                  Workspace notes ({result.notes.length})
                </summary>
                <ul className="mt-2 space-y-1 font-mono text-[11px] text-[var(--fg-tertiary)]">
                  {result.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ScoreCard({
  label,
  grade,
  score,
  meta,
  highlight,
}: {
  label: string;
  grade: string;
  score: number;
  meta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        highlight
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-white",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
        {label}
      </p>
      <p className={cn("mt-1 font-display text-[36px] leading-none", gradeColor(grade))}>
        {grade}
      </p>
      <p className="mt-1 tabular-nums text-[14px] text-[var(--fg-secondary)]">
        {score}/100
      </p>
      <p className="mt-2 text-[12px] text-[var(--fg-tertiary)]">{meta}</p>
    </div>
  );
}
