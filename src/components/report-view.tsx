"use client";

import { motion } from "framer-motion";
import type { ScanReport, Severity } from "@/lib/types";
import { FindingCard } from "./finding-card";
import { ScoreRing } from "./score-ring";
import { Logo } from "./logo";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileSearch,
  GitPullRequest,
  Lock,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  gradeMeaning,
  priorityFixes,
  severityCounts,
  verdictFromScore,
} from "@/lib/verdict";
import { OpenPrPanel } from "./open-pr-panel";

const SEVERITIES: Array<Severity | "all"> = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

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

const gateStyle = {
  good: {
    pill: "bg-emerald-600 text-white shadow-emerald-600/25",
    label: "Can ship",
    glow: "rgba(11,110,79,0.22)",
    soft: "bg-emerald-50 text-emerald-900 border-emerald-100",
  },
  ok: {
    pill: "bg-sky-600 text-white shadow-sky-600/25",
    label: "Hold — polish first",
    glow: "rgba(23,92,211,0.18)",
    soft: "bg-sky-50 text-sky-900 border-sky-100",
  },
  warn: {
    pill: "bg-amber-600 text-white shadow-amber-600/25",
    label: "Hold — not production-ready",
    glow: "rgba(180,71,8,0.18)",
    soft: "bg-amber-50 text-amber-950 border-amber-100",
  },
  bad: {
    pill: "bg-red-600 text-white shadow-red-600/25",
    label: "Hold — do not ship",
    glow: "rgba(180,35,24,0.2)",
    soft: "bg-red-50 text-red-900 border-red-100",
  },
};

export function ReportView({ report }: { report: ScanReport }) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [copied, setCopied] = useState(false);
  const [highlightPr, setHighlightPr] = useState(false);
  const [activeNav, setActiveNav] = useState("decision");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected" || params.get("github_error")) {
      queueMicrotask(() => {
        document
          .getElementById("open-pr")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        setHighlightPr(true);
        setActiveNav("fix");
      });
      params.delete("github");
      params.delete("github_error");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${qs ? `?${qs}` : ""}`,
      );
    }
  }, []);

  const verdict = useMemo(
    () => verdictFromScore(report.score, report.findings),
    [report.score, report.findings],
  );
  const gate = gateStyle[verdict.tone];
  const sev = useMemo(() => severityCounts(report.findings), [report.findings]);
  const top = useMemo(
    () => priorityFixes(report.findings, 3),
    [report.findings],
  );
  const topIds = useMemo(() => new Set(top.map((f) => f.id)), [top]);
  const patchCount = report.fixPatches?.length ?? 0;
  const priorityCount = sev.critical + sev.high;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: report.findings.length };
    for (const f of report.findings) c[f.severity] = (c[f.severity] ?? 0) + 1;
    return c;
  }, [report.findings]);

  const filtered = useMemo(() => {
    if (filter === "all") return report.findings;
    return report.findings.filter((f) => f.severity === filter);
  }, [filter, report.findings]);

  function goTo(id: string) {
    setActiveNav(id);
    if (id === "fix") setHighlightPr(true);
    document
      .getElementById(id === "decision" ? "report-top" : id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function copyDecision() {
    const text = [
      `ShipCheck · ${report.repo.owner}/${report.repo.repo}`,
      `Gate: ${gate.label}`,
      `Score: ${report.score.grade} ${report.score.overall}/100`,
      ``,
      verdict.headline,
      report.summary,
      ``,
      "Top risks:",
      ...top.map(
        (f, i) =>
          `${i + 1}. ${f.title}${f.file ? ` (${f.file}${f.line ? `:${f.line}` : ""})` : ""}`,
      ),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const nav = [
    { id: "decision", label: "Decision" },
    { id: "risks", label: "Risks" },
    { id: "open-pr", label: "Open PR" },
    { id: "all-issues", label: "Issues" },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)]">
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="hero-mesh absolute inset-0 opacity-50" />
        <div
          className="aurora -left-20 top-0 h-[420px] w-[420px]"
          style={{
            background: gate.glow,
            animationDelay: "0s",
          }}
        />
        <div
          className="aurora right-[-10%] top-[20%] h-[360px] w-[360px] bg-[rgba(23,92,211,0.1)]"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="aurora bottom-[10%] left-[30%] h-[280px] w-[380px] bg-[rgba(11,110,79,0.08)]"
          style={{ animationDelay: "-12s" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)]/80 bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-white/70 p-1 shadow-sm backdrop-blur md:flex">
            {nav.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => goTo(n.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition",
                  activeNav === n.id
                    ? "bg-[var(--fg)] text-white shadow-sm"
                    : "text-[var(--fg-secondary)] hover:text-[var(--fg)]",
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <Link
            href="/#scan"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/90 px-3.5 text-[13px] font-medium text-[var(--fg)] shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New audit</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </header>

      <main
        id="report-top"
        className="relative z-10 mx-auto max-w-6xl scroll-mt-20 px-5 pb-32 pt-8 sm:px-6 sm:pt-10"
      >
        {/* ═══ HERO: asymmetric decision stage ═══════════ */}
        <motion.section
          id="decision"
          initial="initial"
          animate="animate"
          variants={{
            animate: { transition: { staggerChildren: 0.08 } },
          }}
          className="scroll-mt-24"
        >
          <div className="grid items-stretch gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left: narrative */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white/90 p-6 shadow-[var(--shadow-md)] backdrop-blur sm:p-8 lg:p-9"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl"
                style={{ background: gate.glow }}
              />

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[12px] font-semibold shadow-lg",
                      gate.pill,
                    )}
                  >
                    {gate.label}
                  </span>
                  {report.stack && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg)]/80 px-2.5 py-0.5 text-[11.5px] text-[var(--fg-secondary)]">
                      {report.stack.label}
                    </span>
                  )}
                  {report.repo.private && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900">
                      <Lock className="h-3 w-3" />
                      Private
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-[13.5px] text-[var(--fg-secondary)]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1">
                    <GitHubMark className="h-3.5 w-3.5" />
                    <a
                      href={report.repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[var(--fg)] hover:underline"
                    >
                      {report.repo.owner}/{report.repo.repo}
                    </a>
                    <ExternalLink className="h-3 w-3 opacity-40" />
                  </span>
                </div>

                <h1 className="mt-5 max-w-xl font-display text-[32px] leading-[1.08] tracking-[-0.03em] text-[var(--fg)] sm:text-[40px] lg:text-[44px]">
                  {verdict.headline}
                </h1>
                <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[var(--fg-secondary)] sm:text-[16px]">
                  {report.summary}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => goTo("open-pr")}
                    className="group inline-flex h-12 items-center gap-2 rounded-full bg-[var(--fg)] px-6 text-[14px] font-semibold text-white shadow-[0_12px_40px_rgba(20,20,19,0.18)] transition hover:bg-black"
                  >
                    <GitPullRequest className="h-4 w-4" />
                    Open PR with fixes
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyDecision()}
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-[13.5px] font-medium text-[var(--fg)] shadow-sm transition hover:border-[var(--border-strong)]"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[var(--accent)]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy decision"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right: score stage */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[#0e0e0d] p-6 text-white shadow-[var(--shadow-lg)] sm:p-8"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 left-0 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

              <div className="relative flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Ship score
                </p>
                <div className="mt-4 [&_span]:!text-white/50">
                  <div className="score-ring-dark">
                    <ScoreRing
                      score={report.score.overall}
                      grade={report.score.grade}
                      size={168}
                    />
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-white/55">
                  {gradeMeaning(report.score.grade)}
                </p>

                <div className="mt-8 grid w-full grid-cols-3 gap-2">
                  {(
                    [
                      ["Sec", report.score.breakdown.security, Shield],
                      ["Prod", report.score.breakdown.production, Wrench],
                      ["Prac", report.score.breakdown.bestPractices, Sparkles],
                    ] as const
                  ).map(([label, val, Icon]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 backdrop-blur"
                    >
                      <Icon className="mx-auto h-3.5 w-3.5 text-white/35" />
                      <p className="mt-1.5 font-display text-[22px] tabular-nums leading-none tracking-tight">
                        {val}
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/35">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stat chips row */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              {
                label: "High priority",
                value: String(priorityCount),
                hint: `${sev.critical} critical · ${sev.high} high`,
              },
              {
                label: "Issues found",
                value: String(report.findings.length),
                hint: "Across scanned sources",
              },
              {
                label: "Files scanned",
                value: String(report.repo.scannedFiles),
                hint: `of ${report.repo.totalFiles} in tree`,
              },
              {
                label: "Ready patches",
                value: String(patchCount),
                hint: patchCount ? "Stack-aware fixes" : "None this pass",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-4 shadow-[var(--shadow-sm)] backdrop-blur"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
                  {s.label}
                </p>
                <p className="mt-1 font-display text-[28px] leading-none tracking-tight text-[var(--fg)]">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[12px] text-[var(--fg-secondary)]">
                  {s.hint}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ═══ RISKS + STORY bento ═══════════════════════ */}
        <section id="risks" className="mt-10 scroll-mt-24 sm:mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                What blocks ship
              </p>
              <h2 className="mt-1 font-display text-[28px] tracking-[-0.025em] text-[var(--fg)] sm:text-[32px]">
                Priority risks
              </h2>
            </div>
            <button
              type="button"
              onClick={() => goTo("all-issues")}
              className="hidden text-[13.5px] font-medium text-[var(--accent)] hover:underline sm:inline"
            >
              See all issues →
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {/* Risk list — spans 3 */}
            <div className="space-y-3 lg:col-span-3">
              {top.length === 0 ? (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-[24px] border border-[var(--border)] bg-white/80 px-6 text-center text-[14px] text-[var(--fg-secondary)] shadow-sm">
                  No high-signal issues in this pass.
                </div>
              ) : (
                top.map((f, i) => (
                  <motion.article
                    key={f.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.06, duration: 0.45 }}
                    className="group relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] sm:p-6"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--fg)] font-display text-[18px] text-white shadow-lg shadow-black/10">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              f.severity === "critical" &&
                                "bg-red-100 text-red-800",
                              f.severity === "high" &&
                                "bg-amber-100 text-amber-900",
                              f.severity !== "critical" &&
                                f.severity !== "high" &&
                                "bg-[var(--bg-muted)] text-[var(--fg-secondary)]",
                            )}
                          >
                            {f.severity}
                          </span>
                          {f.effort && (
                            <span className="text-[11.5px] text-[var(--fg-tertiary)]">
                              ~{f.effort}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                          {f.title}
                        </h3>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--fg-secondary)]">
                          {f.simpleExplain ?? f.description}
                        </p>
                        {f.file && (
                          <a
                            href={`${report.repo.htmlUrl}/blob/${report.repo.defaultBranch}/${f.file}${f.line ? `#L${f.line}` : ""}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--accent)] hover:underline"
                          >
                            <FileSearch className="h-3.5 w-3.5" />
                            {f.file}
                            {f.line ? `:${f.line}` : ""}
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))
              )}
            </div>

            {/* Story / proof side column */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {report.shipScenario ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] bg-[#0e0e0d] p-6 text-white shadow-[var(--shadow-md)]"
                >
                  <div className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-red-500/20 blur-3xl" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    If you ship tonight
                  </p>
                  <p className="mt-3 font-display text-[22px] leading-snug tracking-[-0.02em]">
                    {report.shipScenario.headline}
                  </p>
                  <p className="mt-3 flex-1 text-[14px] leading-relaxed text-white/60">
                    {report.shipScenario.story}
                  </p>
                  {report.shipScenario.founderMove && (
                    <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-[13px] leading-relaxed text-white/80">
                      <span className="font-semibold text-white">
                        Founder move —{" "}
                      </span>
                      {report.shipScenario.founderMove}
                    </p>
                  )}
                </motion.div>
              ) : (
                <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-tertiary)]">
                    Context
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--fg-secondary)]">
                    {verdict.body}
                  </p>
                </div>
              )}

              {report.proofOfFix && (
                <div className="rounded-[24px] border border-[var(--border)] bg-gradient-to-br from-white to-[var(--accent-soft)]/40 p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                    Proof of fix
                  </p>
                  <div className="mt-3 flex items-end gap-3">
                    <div>
                      <p className="text-[12px] text-[var(--fg-tertiary)]">
                        Before
                      </p>
                      <p className="font-display text-[32px] leading-none tracking-tight text-[var(--fg)]">
                        {report.proofOfFix.beforeGrade}
                      </p>
                      <p className="text-[12px] tabular-nums text-[var(--fg-tertiary)]">
                        {report.proofOfFix.beforeScore}/100
                      </p>
                    </div>
                    <ArrowRight className="mb-3 h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-[12px] text-[var(--fg-tertiary)]">
                        After top fixes
                      </p>
                      <p className="font-display text-[32px] leading-none tracking-tight text-[var(--accent)]">
                        {report.proofOfFix.afterGrade}
                      </p>
                      <p className="text-[12px] tabular-nums text-[var(--fg-tertiary)]">
                        {report.proofOfFix.afterScore}/100
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--fg-secondary)]">
                    Projected if priority patches land — not a verified deploy.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => goTo("open-pr")}
                className="group flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-white p-5 text-left shadow-sm transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--fg)] text-white">
                    <GitPullRequest className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--fg)]">
                      Fix it on GitHub
                    </p>
                    <p className="text-[12.5px] text-[var(--fg-secondary)]">
                      Open a real PR with selected patches
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--fg-tertiary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--fg)]" />
              </button>
            </div>
          </div>
        </section>

        {/* ═══ OPEN PR ═══════════════════════════════════ */}
        <section className="mt-12 scroll-mt-24 sm:mt-14">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              Hero action
            </p>
            <h2 className="mt-1 font-display text-[28px] tracking-[-0.025em] text-[var(--fg)] sm:text-[32px]">
              Ship the fix
            </h2>
          </div>
          <OpenPrPanel
            report={report}
            patches={report.fixPatches ?? []}
            findings={report.findings}
            autoFocus={highlightPr}
          />
        </section>

        {/* ═══ ALL ISSUES ════════════════════════════════ */}
        <section id="all-issues" className="mt-14 scroll-mt-24 sm:mt-16">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                Full pass
              </p>
              <h2 className="mt-1 font-display text-[28px] tracking-[-0.025em] text-[var(--fg)] sm:text-[32px]">
                All issues
              </h2>
              <p className="mt-1 text-[14px] text-[var(--fg-secondary)]">
                Expand any card for attack path, fix, and evidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SEVERITIES.map((s) => {
                if (s !== "all" && !counts[s]) return null;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter(s)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[12px] capitalize transition",
                      filter === s
                        ? "bg-[var(--fg)] text-white shadow-sm"
                        : "border border-[var(--border)] bg-white/90 text-[var(--fg-secondary)] hover:border-[var(--border-strong)]",
                    )}
                  >
                    {s}
                    {counts[s] != null && (
                      <span className="ml-1 opacity-50">{counts[s]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] bg-white/50 py-14 text-center text-[14px] text-[var(--fg-tertiary)]">
                Nothing in this filter.
              </p>
            ) : (
              filtered.map((f, i) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  index={i}
                  priority={topIds.has(f.id) && filter === "all"}
                  mode="founder"
                  githubBase={report.repo.htmlUrl}
                  defaultBranch={report.repo.defaultBranch}
                />
              ))
            )}
          </div>
        </section>

        {/* Footer stage */}
        <div className="mt-20 overflow-hidden rounded-[28px] border border-[var(--border)] bg-white/70 px-6 py-10 text-center shadow-sm backdrop-blur sm:px-10">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--fg-tertiary)]">
            Audit complete
          </p>
          <p className="mx-auto mt-2 max-w-md font-display text-[24px] tracking-[-0.02em] text-[var(--fg)] sm:text-[28px]">
            Rules found the evidence. AI wrote the path to ship.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goTo("open-pr")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--fg)] px-5 text-[13.5px] font-semibold text-white"
            >
              <GitPullRequest className="h-4 w-4" />
              Back to Open PR
            </button>
            <Link
              href="/#scan"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-[13.5px] font-medium text-[var(--fg)]"
            >
              Audit another repo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Mobile bottom dock */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] p-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg gap-1 rounded-2xl border border-[var(--border)] bg-white/90 p-1 shadow-lg">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => goTo(n.id)}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-[11.5px] font-medium",
                activeNav === n.id
                  ? "bg-[var(--fg)] text-white"
                  : "text-[var(--fg-secondary)]",
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
