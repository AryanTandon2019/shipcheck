"use client";

import { useEffect, useMemo, useState } from "react";
import type { FixPatch, Finding, ScanReport } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ExternalLink,
  GitPullRequest,
  Loader2,
  Sparkles,
} from "lucide-react";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export type PrResult = {
  prUrl: string;
  prNumber: number;
  branch: string;
  filesChanged: string[];
  applied: string[];
  notes: string[];
};

export async function createShipcheckPr(opts: {
  report: ScanReport;
  patches: FixPatch[];
}): Promise<{ pr?: PrResult; error?: string; code?: string }> {
  const { report, patches } = opts;
  if (!patches.length) {
    return { error: "Select at least one patch." };
  }

  const res = await fetch("/api/github/pr", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId: report.id,
      patchFindingIds: patches.map((p) => p.findingId),
      snapshot: {
        id: report.id,
        repo: {
          owner: report.repo.owner,
          repo: report.repo.repo,
        },
        score: {
          grade: report.score.grade,
          overall: report.score.overall,
        },
        findings: report.findings,
        fixPatches: patches,
      },
    }),
  });

  let data: { error?: string; code?: string; pr?: PrResult } = {};
  try {
    data = await res.json();
  } catch {
    return {
      error: res.ok
        ? "Empty response from server."
        : `PR failed (HTTP ${res.status}).`,
    };
  }

  if (!res.ok) {
    return {
      error: data.error ?? `Failed to create PR (${res.status}).`,
      code: data.code,
    };
  }
  if (!data.pr?.prUrl) {
    return { error: "PR created but no URL returned." };
  }
  return { pr: data.pr };
}

/**
 * Clean Open-PR block for the audit page.
 */
export function OpenPrPanel({
  report,
  patches,
  findings,
  autoFocus,
}: {
  report: ScanReport;
  patches: FixPatch[];
  findings: Finding[];
  autoFocus?: boolean;
}) {
  const [connected, setConnected] = useState(false);
  const [login, setLogin] = useState<string | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        patches.slice(0, Math.min(3, patches.length)).map((p) => p.findingId),
      ),
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pr, setPr] = useState<PrResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/github/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { connected?: boolean; login?: string | null }) => {
        if (cancelled) return;
        setConnected(Boolean(d.connected));
        setLogin(d.login ?? null);
        setLoadingMe(false);
      })
      .catch(() => {
        if (!cancelled) {
          setConnected(false);
          setLoadingMe(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPatches = useMemo(
    () => patches.filter((p) => selected.has(p.findingId)),
    [patches, selected],
  );

  function toggle(id: string) {
    if (creating) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
    setError(null);
  }

  function connectGitHub() {
    window.location.href = `/api/github/login?returnTo=${encodeURIComponent(`/report/${report.id}`)}`;
  }

  async function openPr() {
    if (!selectedPatches.length || creating || pr) return;
    if (!connected) {
      connectGitHub();
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const result = await createShipcheckPr({
        report,
        patches: selectedPatches,
      });
      if (result.code === "NOT_CONNECTED") {
        setConnected(false);
        setError("Session expired — connect GitHub again.");
        return;
      }
      if (result.error || !result.pr) {
        setError(result.error ?? "PR failed.");
        return;
      }
      setPr(result.pr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section
      id="open-pr"
      className={cn(
        "overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_20px_60px_rgba(20,20,19,0.08)]",
        autoFocus && "ring-2 ring-[var(--accent)]/35 ring-offset-4 ring-offset-[var(--bg)]",
      )}
    >
      <div className="relative overflow-hidden bg-[#0e0e0d] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Real GitHub PR
            </div>
            <h2 className="mt-3 font-display text-[28px] leading-tight tracking-[-0.025em] sm:text-[34px]">
              Open PR with fixes
            </h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/55">
              Branch + pull request on{" "}
              <span className="font-medium text-white/90">
                {report.repo.owner}/{report.repo.repo}
              </span>
              . Pick patches below — needs write access on this repo.
            </p>
          </div>

          {!loadingMe && connected && login && (
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 text-[13px] text-white/75 backdrop-blur">
              <GitHubMark className="h-3.5 w-3.5" />@{login}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5 px-5 py-6 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-tertiary)]">
          Include in PR
          {patches.length > 0 ? ` · ${selected.size} selected` : ""}
        </p>

        {patches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-[13.5px] text-[var(--fg-tertiary)]">
            No automated patches for this scan.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {patches.map((p) => {
              const finding = findings.find((f) => f.id === p.findingId);
              const on = selected.has(p.findingId);
              return (
                <label
                  key={p.findingId + p.title}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-2xl border px-4 py-4 transition",
                    on
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]/60 shadow-sm"
                      : "border-[var(--border)] bg-[var(--bg)]/40 hover:border-[var(--border-strong)] hover:bg-white",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-[var(--accent)]"
                    checked={on}
                    onChange={() => toggle(p.findingId)}
                    disabled={creating || !!pr}
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--fg)]">
                      {p.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] text-[var(--fg-secondary)]">
                      {p.explanation}
                    </p>
                    {finding?.file && (
                      <p className="mt-1.5 font-mono text-[11px] text-[var(--fg-tertiary)]">
                        {finding.file}
                        {finding.line ? `:${finding.line}` : ""}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg)]/40 px-5 py-5 sm:px-8">
        <button
          type="button"
          onClick={() => void openPr()}
          disabled={
            creating ||
            !!pr ||
            (connected && selectedPatches.length === 0) ||
            patches.length === 0
          }
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--fg)] px-7 text-[14px] font-semibold text-white shadow-[0_12px_32px_rgba(20,20,19,0.16)] transition hover:bg-black disabled:opacity-40 sm:w-auto"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating pull request…
            </>
          ) : pr ? (
            <>
              <Check className="h-4 w-4" />
              PR opened
            </>
          ) : !connected ? (
            <>
              <GitHubMark className="h-4 w-4" />
              Connect GitHub & open PR
            </>
          ) : (
            <>
              <GitPullRequest className="h-4 w-4" />
              Open PR with {selectedPatches.length} fix
              {selectedPatches.length === 1 ? "" : "es"}
            </>
          )}
        </button>
        <p className="mt-2.5 text-[12px] text-[var(--fg-tertiary)]">
          Review on GitHub before merge. Takes ~5–15 seconds.
        </p>
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-[13px] leading-relaxed text-red-800 sm:px-7">
          {error}
        </div>
      )}

      {pr && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-5 sm:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800">
            Pull request ready
          </p>
          <p className="mt-1 text-[15px] font-semibold text-[var(--fg)]">
            #{pr.prNumber} ·{" "}
            <span className="font-mono text-[13px] font-normal text-[var(--fg-secondary)]">
              {pr.branch}
            </span>
          </p>
          <a
            href={pr.prUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-[13.5px] font-semibold text-white hover:bg-emerald-800"
          >
            View on GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </section>
  );
}
