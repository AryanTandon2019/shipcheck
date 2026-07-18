"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  Loader2,
  Lock,
  LogOut,
  Search,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cacheReportClient } from "@/lib/report-cache";
import type { ScanReport } from "@/lib/types";

const PHASES = [
  "Connecting to GitHub",
  "Reading source tree",
  "Running security rules",
  "Scoring production readiness",
  "Writing AI fixes…",
];

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

type GhMe = {
  connected: boolean;
  configured: boolean;
  login: string | null;
};

type RepoItem = {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
  htmlUrl: string;
  defaultBranch: string;
  permissions: { admin: boolean; push: boolean; pull: boolean };
};

/**
 * Primary flow: Connect GitHub → pick repo (public + private) → scan → report.
 * Fallback: paste any public owner/repo without connecting.
 */
export function ScanForm({ large = false }: { large?: boolean }) {
  const router = useRouter();
  const [me, setMe] = useState<GhMe | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "private" | "public" | "push">(
    "all",
  );

  const [url, setUrl] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const [scanningRepo, setScanningRepo] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/github/me", { credentials: "include" });
      const data = (await res.json()) as GhMe;
      setMe(data);
      return data;
    } catch {
      const fallback = { connected: false, configured: false, login: null };
      setMe(fallback);
      return fallback;
    } finally {
      setLoadingMe(false);
    }
  }, []);

  const loadRepos = useCallback(async (pageNum = 1, append = false) => {
    setLoadingRepos(true);
    setRepoError(null);
    try {
      const res = await fetch(`/api/github/repos?page=${pageNum}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "NOT_CONNECTED") {
          setMe({ connected: false, configured: true, login: null });
        }
        setRepoError(data.error ?? "Could not load repos.");
        setLoadingRepos(false);
        return;
      }
      setRepos((prev) =>
        append ? [...prev, ...(data.repos as RepoItem[])] : (data.repos as RepoItem[]),
      );
      setHasMore(Boolean(data.hasMore));
      setPage(pageNum);
    } catch {
      setRepoError("Network error loading repos.");
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadMe();
      if (cancelled) return;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("github") === "connected" || params.get("github_error")) {
          const err = params.get("github_error");
          if (err) {
            queueMicrotask(() => setError(decodeURIComponent(err)));
          }
          params.delete("github");
          params.delete("github_error");
          const qs = params.toString();
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${qs ? `?${qs}` : ""}#scan`,
          );
          document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" });
        }
      }
      if (data.connected) {
        void loadRepos(1, false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe, loadRepos]);

  const filtered = useMemo(() => {
    let list = repos;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q) ||
          (r.language ?? "").toLowerCase().includes(q),
      );
    }
    if (filter === "private") list = list.filter((r) => r.private);
    if (filter === "public") list = list.filter((r) => !r.private);
    if (filter === "push")
      list = list.filter((r) => r.permissions.push || r.permissions.admin);
    return list;
  }, [repos, query, filter]);

  function connectGitHub() {
    // Path only (no hash) so ?github=connected lands correctly after OAuth
    window.location.href = `/api/github/login?returnTo=${encodeURIComponent("/")}`;
  }

  async function disconnect() {
    await fetch("/api/github/logout", {
      method: "POST",
      credentials: "include",
    });
    setMe({ connected: false, configured: me?.configured ?? true, login: null });
    setRepos([]);
    setError(null);
  }

  async function startScan(repoUrl: string, label?: string) {
    if (!repoUrl.trim() || loading) return;
    setLoading(true);
    setError(null);
    setPhase(0);
    setScanningRepo(label ?? repoUrl);

    const timer = setInterval(() => {
      setPhase((p) => Math.min(p + 1, PHASES.length - 1));
    }, 1300);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const data = await res.json();
      clearInterval(timer);

      if (!res.ok) {
        setError(data.error ?? "Scan failed");
        setLoading(false);
        setScanningRepo(null);
        return;
      }

      cacheReportClient(data.report as ScanReport);
      router.push(`/report/${data.report.id}`);
    } catch {
      clearInterval(timer);
      setError("Network error. Please try again.");
      setLoading(false);
      setScanningRepo(null);
    }
  }

  const connected = me?.connected === true;
  const configured = me?.configured !== false;

  // ── Scanning state ──────────────────────────────────
  if (loading) {
    return (
      <div className="w-full">
        <div
          className={cn(
            "rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-md)]",
            large && "sm:p-6",
          )}
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            <div>
              <p className="text-[14px] font-semibold text-[var(--fg)]">
                Auditing {scanningRepo}
              </p>
              <p className="text-[13px] text-[var(--fg-secondary)]">
                {PHASES[phase]}
                <span className="cursor-blink ml-0.5 text-[var(--accent)]">
                  ▊
                </span>
              </p>
            </div>
          </div>
          <div className="score-track mt-4 w-full max-w-sm">
            <motion.div
              className="score-fill"
              initial={{ width: "8%" }}
              animate={{ width: `${18 + phase * 18}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Not connected ───────────────────────────────────
  if (loadingMe) {
    return (
      <div className="flex h-14 items-center gap-2 text-[13px] text-[var(--fg-tertiary)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking GitHub…
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="w-full">
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_1px_2px_rgba(20,20,19,0.04),0_16px_48px_rgba(20,20,19,0.08)]",
            large && "sm:rounded-[20px]",
          )}
        >
          <div className="bg-[#0e0e0d] px-5 py-5 text-white sm:px-6 sm:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/90">
              Start here
            </p>
            <h3 className="mt-1.5 font-display text-[22px] tracking-[-0.02em] sm:text-[24px]">
              Connect GitHub
            </h3>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-white/55">
              See your public and private repos, pick one to audit, then open a
              fix PR when you’re ready. We only request{" "}
              <span className="text-white/80">repo</span> access.
            </p>
            <button
              type="button"
              onClick={connectGitHub}
              disabled={!configured}
              className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[14px] font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-100 disabled:opacity-40"
            >
              <GitHubMark className="h-4 w-4" />
              Connect GitHub
              <ArrowRight className="h-4 w-4" />
            </button>
            {!configured && (
              <p className="mt-3 text-[12px] text-amber-200/90">
                OAuth not configured on this server.
              </p>
            )}
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setShowPaste((v) => !v)}
              className="text-[13px] font-medium text-[var(--fg-secondary)] hover:text-[var(--fg)]"
            >
              {showPaste
                ? "Hide public URL paste"
                : "Or paste a public repo URL (no login)"}
            </button>

            <AnimatePresence>
              {showPaste && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void startScan(url);
                  }}
                >
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1.5">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="owner/repo or github.com/owner/repo"
                      className="min-w-0 flex-1 bg-transparent px-2 text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-tertiary)]"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="submit"
                      disabled={!url.trim()}
                      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--fg)] px-3.5 text-[13px] font-medium text-white disabled:opacity-35"
                    >
                      Audit
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 text-[11.5px] text-[var(--fg-tertiary)]">
                    Public repos only without GitHub. Private needs Connect.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>

            {error && (
              <p className="mt-3 text-[13px] text-[var(--danger)]">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Connected: repo picker ──────────────────────────
  return (
    <div className="w-full">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_1px_2px_rgba(20,20,19,0.04),0_16px_48px_rgba(20,20,19,0.08)]",
          large && "sm:rounded-[20px]",
        )}
      >
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-medium text-emerald-900">
              <GitHubMark className="h-3.5 w-3.5" />
              @{me?.login}
            </span>
            <span className="hidden text-[12px] text-[var(--fg-tertiary)] sm:inline">
              Pick a repo to audit
            </span>
          </div>
          <button
            type="button"
            onClick={() => void disconnect()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-[var(--fg-tertiary)] hover:text-[var(--fg)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>

        {/* search + filters */}
        <div className="space-y-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--fg-tertiary)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your repos…"
              className="h-10 w-full bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-tertiary)]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All"],
                ["push", "Can open PR"],
                ["private", "Private"],
                ["public", "Public"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11.5px] font-medium",
                  filter === id
                    ? "bg-[var(--fg)] text-white"
                    : "border border-[var(--border)] bg-white text-[var(--fg-secondary)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* list */}
        <div className="max-h-[340px] overflow-y-auto">
          {loadingRepos && repos.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[var(--fg-tertiary)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading repositories…
            </div>
          ) : repoError ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13.5px] text-[var(--danger)]">{repoError}</p>
              <button
                type="button"
                onClick={() => void loadRepos(1, false)}
                className="mt-3 text-[13px] font-medium text-[var(--accent)]"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13.5px] text-[var(--fg-tertiary)]">
              No repos match. Try another filter or load more.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => void startScan(r.fullName, r.fullName)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--bg)] sm:px-5"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white">
                      {r.private ? (
                        <Lock className="h-3.5 w-3.5 text-[var(--fg-secondary)]" />
                      ) : (
                        <GitBranch className="h-3.5 w-3.5 text-[var(--fg-secondary)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[14px] font-semibold text-[var(--fg)]">
                          {r.fullName}
                        </span>
                        {r.private && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                            Private
                          </span>
                        )}
                        {(r.permissions.push || r.permissions.admin) && (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                            PR ready
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-[var(--fg-secondary)]">
                          {r.description}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--fg-tertiary)]">
                        {r.language && <span>{r.language}</span>}
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3" />
                          {r.stars}
                        </span>
                        <span>
                          Updated{" "}
                          {new Date(r.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-[var(--fg-tertiary)]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-4 py-3 sm:px-5">
          {hasMore ? (
            <button
              type="button"
              disabled={loadingRepos}
              onClick={() => void loadRepos(page + 1, true)}
              className="text-[13px] font-medium text-[var(--accent)] disabled:opacity-50"
            >
              {loadingRepos ? "Loading…" : "Load more repos"}
            </button>
          ) : (
            <span className="text-[12px] text-[var(--fg-tertiary)]">
              {repos.length} repo{repos.length === 1 ? "" : "s"} loaded
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPaste((v) => !v)}
            className="text-[12.5px] text-[var(--fg-tertiary)] hover:text-[var(--fg)]"
          >
            Paste URL instead
          </button>
        </div>

        <AnimatePresence>
          {showPaste && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[var(--border)] px-4 py-3 sm:px-5"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void startScan(url);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="owner/repo"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[13.5px] outline-none focus:border-[var(--accent)]/40"
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="inline-flex h-10 items-center gap-1 rounded-xl bg-[var(--fg)] px-4 text-[13px] font-medium text-white disabled:opacity-35"
                >
                  Scan
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2.5 text-[13px] text-red-800 sm:px-5">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
