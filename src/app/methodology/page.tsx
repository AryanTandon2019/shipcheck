"use client";

import { Shell } from "@/components/shell";
import { PageHero } from "@/components/page-hero";
import { motion } from "framer-motion";

const rules = [
  { id: "secrets.hardcoded", title: "Hardcoded credentials & API keys", sev: "Critical" },
  { id: "secrets.env-committed", title: "Environment files committed to git", sev: "Critical" },
  { id: "secrets.client-exposed", title: "Secret-like NEXT_PUBLIC_ values", sev: "Critical" },
  { id: "injection.sql", title: "SQL string construction risks", sev: "Critical" },
  { id: "injection.eval", title: "eval / Function constructor", sev: "Critical" },
  { id: "api.no-rate-limit", title: "Missing API rate limiting", sev: "High" },
  { id: "api.open-cors", title: "Overly permissive CORS", sev: "High" },
  { id: "auth.missing-on-api", title: "API routes without auth signals", sev: "High" },
  { id: "auth.admin-unprotected", title: "Admin surfaces without role checks", sev: "High" },
  { id: "auth.webhook-no-verify", title: "Webhooks without signature verification", sev: "High" },
  { id: "injection.xss-dbihtml", title: "dangerouslySetInnerHTML usage", sev: "High" },
  { id: "prod.no-security-headers", title: "Missing security headers config", sev: "Medium" },
  { id: "api.weak-error-handling", title: "Weak API error handling coverage", sev: "Medium" },
  { id: "deps.no-validation", title: "No input validation library signals", sev: "Medium" },
];

export default function MethodologyPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="Methodology"
        title="Rules own the truth. Models write the story."
        description="ShipCheck is intentionally hybrid: deterministic static checks produce findings; an LLM only summarizes and frames them. That keeps audits explainable under scrutiny."
      />

      <section id="scoring" className="border-b border-[var(--border)] scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[28px] tracking-[-0.02em] sm:text-[32px]">
                Scoring model
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--fg-secondary)]">
                Every finding carries a severity weight. Critical issues subtract
                the most from the overall ship score. Grades map as A (≥90), B
                (≥75), C (≥60), D (≥40), F (below 40).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
              {[
                { g: "A", r: "90–100" },
                { g: "B", r: "75–89" },
                { g: "C", r: "60–74" },
                { g: "D", r: "40–59" },
                { g: "F", r: "0–39" },
              ].map((row) => (
                <div key={row.g} className="card px-4 py-4 text-center">
                  <p className="font-display text-[28px] text-[var(--fg)]">{row.g}</p>
                  <p className="mt-1 text-[11px] text-[var(--fg-tertiary)]">{row.r}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                t: "Security",
                d: "Secrets, auth, injection, and API exposure drive this axis.",
              },
              {
                t: "Production",
                d: "Headers, debug flags, config hygiene, and deploy-facing risk.",
              },
              {
                t: "Best practices",
                d: "Validation, quality scripts, env templates, and maintainability signals.",
              },
            ].map((c) => (
              <div key={c.t} className="card p-5">
                <h3 className="text-[15px] font-medium">{c.t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--fg-secondary)]">
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rules" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-[28px] tracking-[-0.02em] sm:text-[32px]">
              Core rule catalog
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--fg-secondary)]">
              A non-exhaustive list of high-signal checks in the current MVP.
              Coverage expands without changing the product surface.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="grid grid-cols-[1fr_auto] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--fg-tertiary)] sm:grid-cols-[140px_1fr_100px] sm:px-5">
              <span className="hidden sm:inline">Rule ID</span>
              <span>Check</span>
              <span className="text-right">Severity</span>
            </div>
            {rules.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className="grid grid-cols-[1fr_auto] items-center border-b border-[var(--border)] bg-white px-4 py-3.5 last:border-b-0 sm:grid-cols-[140px_1fr_100px] sm:px-5"
              >
                <code className="hidden font-mono text-[11px] text-[var(--fg-tertiary)] sm:block">
                  {r.id}
                </code>
                <span className="text-[14px] text-[var(--fg)]">{r.title}</span>
                <span className="text-right text-[12px] font-medium text-[var(--fg-secondary)]">
                  {r.sev}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <div className="card bg-[var(--bg)] p-8 sm:p-10">
            <h2 className="font-display text-[26px] tracking-[-0.02em]">
              Limitations (said plainly)
            </h2>
            <ul className="mt-5 space-y-3 text-[14.5px] leading-relaxed text-[var(--fg-secondary)]">
              <li>
                Static analysis cannot prove runtime behavior. Absence of a pattern
                is a signal, not a formal guarantee.
              </li>
              <li>
                Public repositories only in the MVP. Private repo support is on the
                SaaS roadmap via GitHub OAuth.
              </li>
              <li>
                File sampling prioritizes high-value paths (API, auth, config).
                Very large monorepos may not be fully walked in one pass.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Shell>
  );
}
