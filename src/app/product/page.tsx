"use client";

import { Shell } from "@/components/shell";
import { PageHero } from "@/components/page-hero";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Repository ingestion",
    body: "Public GitHub URLs are resolved, the default branch is read, and high-value source files are selected for analysis — configs, API routes, auth modules, and manifests first.",
  },
  {
    title: "Deterministic rule engine",
    body: "Findings come from explicit checks, not model guessing. Secrets patterns, rate-limit absence, open CORS, missing auth, injection risks, and production hygiene are scored consistently.",
  },
  {
    title: "Ship score",
    body: "An overall grade with security, production, and best-practice breakdowns. Designed to be shareable with non-security stakeholders in a single glance.",
  },
  {
    title: "Actionable report",
    body: "Every finding includes severity, file context when available, evidence, and a recommended fix. AI writes the narrative — the rules own the truth.",
  },
  {
    title: "Built for AI-era apps",
    body: "Optimized for the stacks people actually vibe-code: Next.js APIs, Express, env-heavy SaaS, webhooks, and client/server secret boundaries.",
  },
  {
    title: "Path to production SaaS",
    body: "Architecture already anticipates Cloudflare D1 persistence, private repos, CI badges, and team workspaces — without bloating the MVP.",
  },
];

export default function ProductPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="Product"
        title="An audit layer for software that was generated, not reviewed."
        description="ShipCheck turns a public repository into a production-readiness report — prioritized, explainable, and fast enough to run before every demo."
      />

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.04 }}
                className="card p-6"
              >
                <p className="font-mono text-[11px] text-[var(--fg-tertiary)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-[16px] font-medium tracking-[-0.02em]">
                  {f.title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--fg-secondary)]">
                  {f.body}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-[30px] leading-tight tracking-[-0.02em] sm:text-[34px]">
                Who it’s for
              </h2>
              <ul className="mt-6 space-y-4 text-[15px] leading-relaxed text-[var(--fg-secondary)]">
                <li>
                  <strong className="font-medium text-[var(--fg)]">Founders</strong>{" "}
                  shipping MVP SaaS with AI copilots who need a second pair of
                  eyes before real users.
                </li>
                <li>
                  <strong className="font-medium text-[var(--fg)]">Hackathon teams</strong>{" "}
                  who want judges to see craft, not just a working demo.
                </li>
                <li>
                  <strong className="font-medium text-[var(--fg)]">Mentors & incubators</strong>{" "}
                  reviewing dozens of student or portfolio projects weekly.
                </li>
              </ul>
            </div>
            <div className="card bg-[var(--bg)] p-8">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
                Track fit
              </p>
              <p className="mt-3 font-display text-[24px] leading-snug tracking-[-0.015em] text-[var(--fg)]">
                Developer tools · AI fluency · real product quality
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-[var(--fg-secondary)]">
                ShipCheck sits in the developer-tools lane: the model explains
                risk in plain English, while deterministic analysis keeps the
                product honest.
              </p>
              <Link
                href="/#scan"
                className="mt-8 inline-flex items-center gap-2 text-[13.5px] font-medium text-[var(--fg)]"
              >
                Try it on a public repo
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
