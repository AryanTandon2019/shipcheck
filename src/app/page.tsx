"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { ScanForm } from "@/components/scan-form";
import { HeroVisual } from "@/components/hero-visual";
import { Bento } from "@/components/bento";
import { MarqueeChecks } from "@/components/marquee-checks";
import { CountUp } from "@/components/count-up";
import { ArrowRight, Check, Play } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Connect GitHub",
    body: "Opt in once. We list your public and private repos you can access.",
  },
  {
    n: "02",
    title: "Pick a repo & audit",
    body: "Rules find proof → AI maps attack paths → ship / don’t ship score.",
  },
  {
    n: "03",
    title: "Open a fix PR",
    body: "Stack-aware patches as a real pull request on repos you can write to.",
  },
];

export default function HomePage() {
  return (
    <Shell>
      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        {/* aurora atmosphere */}
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-mesh absolute inset-0" />
          <div
            className="aurora left-[-10%] top-[-20%] h-[480px] w-[480px] bg-[rgba(11,110,79,0.22)]"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="aurora right-[-5%] top-[10%] h-[380px] w-[380px] bg-[rgba(23,92,211,0.12)]"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="aurora bottom-[-10%] left-[30%] h-[300px] w-[420px] bg-[rgba(180,71,8,0.08)]"
            style={{ animationDelay: "-12s" }}
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-[12px] text-[var(--fg-secondary)] shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-dot absolute inset-0 rounded-full bg-[var(--accent)] text-[var(--accent)]" />
                  <span className="relative h-2 w-2 rounded-full bg-[var(--accent)]" />
                </span>
                AI Ship Gate · public & private · under 60s
              </div>

              <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.03em] text-[var(--fg)] sm:text-[52px] lg:text-[56px]">
                AI helped you build it.
                <br />
                <span className="text-gradient">Should you ship it?</span>
              </h1>

              <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-[var(--fg-secondary)] sm:text-[17px]">
                Connect GitHub, pick any of your repos, get a ship score — then
                open a real fix PR. Evidence, attack path, stack-aware patches.
              </p>
            </motion.div>

            <motion.div
              id="scan"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.55 }}
              className="mt-8 max-w-lg scroll-mt-28"
            >
              <ScanForm large />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--fg-tertiary)]"
            >
              {[
                "Public + private repos",
                "Real fix PR on GitHub",
                "Evidence + file:line",
              ].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <Check
                      className="h-3.5 w-3.5 text-[var(--accent)]"
                      strokeWidth={2.5}
                    />
                    {t}
                  </span>
                ),
              )}
            </motion.div>
          </div>

          {/* product visual */}
          <div className="lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </section>

      <MarqueeChecks />

      {/* ── STATS ──────────────────────────────────────── */}
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-4">
          {[
            { n: 14, suffix: "+", label: "High-signal checks" },
            { n: 5, suffix: "", label: "Severity levels", display: "A–F" },
            { n: 60, suffix: "s", prefix: "< ", label: "Typical audit" },
            { n: 100, suffix: "%", label: "Your repos free" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white px-5 py-9 text-center sm:py-11"
            >
              <p className="font-display text-[36px] tracking-[-0.03em] text-[var(--fg)] sm:text-[42px]">
                {"display" in s && s.display ? (
                  s.display
                ) : (
                  <CountUp
                    to={s.n}
                    suffix={s.suffix}
                    prefix={"prefix" in s ? s.prefix : ""}
                  />
                )}
              </p>
              <p className="mt-1.5 text-[12.5px] text-[var(--fg-tertiary)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM + VISUAL ───────────────────────────── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
                The gap
              </p>
              <h2 className="mt-3 font-display text-[36px] leading-[1.1] tracking-[-0.025em] text-[var(--fg)] sm:text-[44px]">
                AI ships features.
                <br />
                <span className="text-[var(--fg-secondary)]">
                  It rarely ships safety.
                </span>
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-[var(--fg-secondary)]">
                Weekend SaaS looks finished in the demo. Under the surface:
                secrets in git, open admin routes, and APIs that will burn your
                OpenAI bill by Tuesday.
              </p>
              <p className="mt-4 text-[16px] leading-relaxed text-[var(--fg)]">
                ShipCheck is the moment between{" "}
                <em className="font-display not-italic">“it works”</em> and{" "}
                <em className="font-display not-italic">“it’s ready.”</em>
              </p>
              <Link
                href="/#scan"
                className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--fg)] transition hover:gap-3"
              >
                Connect & audit a repo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* stacked risk cards */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-4 rounded-[28px] bg-[radial-gradient(circle_at_30%_20%,rgba(180,35,24,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(11,110,79,0.1),transparent_45%)]" />
              {[
                {
                  sev: "CRITICAL",
                  title: "Service role key in client bundle",
                  file: "lib/supabase.ts",
                  color: "border-red-200 bg-red-50/80",
                  badge: "bg-red-100 text-red-700",
                  rot: "-rotate-2",
                  z: "z-30",
                },
                {
                  sev: "HIGH",
                  title: "POST /api/generate — no auth",
                  file: "app/api/generate/route.ts",
                  color: "border-amber-200 bg-amber-50/90",
                  badge: "bg-amber-100 text-amber-800",
                  rot: "rotate-1 translate-y-3",
                  z: "z-20",
                },
                {
                  sev: "MEDIUM",
                  title: "CORS allows any origin",
                  file: "middleware.ts",
                  color: "border-[var(--border)] bg-white",
                  badge: "bg-[var(--bg-muted)] text-[var(--fg-secondary)]",
                  rot: "-rotate-1 translate-y-6",
                  z: "z-10",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 24, rotate: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`relative ${card.z} ${i > 0 ? "-mt-8" : ""} ${card.rot}`}
                >
                  <div
                    className={`rounded-2xl border p-5 shadow-[var(--shadow-md)] backdrop-blur ${card.color}`}
                  >
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${card.badge}`}
                    >
                      {card.sev}
                    </span>
                    <p className="mt-2 text-[15px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                      {card.title}
                    </p>
                    <p className="mt-1 font-mono text-[11.5px] text-[var(--fg-tertiary)]">
                      {card.file}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO ──────────────────────────────────────── */}
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
                Product
              </p>
              <h2 className="mt-3 font-display text-[34px] leading-[1.1] tracking-[-0.025em] sm:text-[42px]">
                Built to feel expensive.
                <br />
                <span className="text-[var(--fg-secondary)]">
                  Engineered to be useful.
                </span>
              </h2>
            </div>
            <Link
              href="/#scan"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--fg)]"
            >
              Try it live
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Bento />
        </div>
      </section>

      {/* ── STEPS ──────────────────────────────────────── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
              Workflow
            </p>
            <h2 className="mt-3 font-display text-[34px] tracking-[-0.025em] sm:text-[42px]">
              Three steps. One ship score.
            </h2>
          </div>

          <div className="relative mt-14">
            {/* connector line */}
            <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-8 hidden h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent md:block" />
            <ol className="grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <motion.li
                  key={s.n}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-md)]">
                    <span className="font-display text-[28px] text-[var(--fg)]">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-medium tracking-[-0.02em]">
                    {s.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-[260px] text-[14px] leading-relaxed text-[var(--fg-secondary)]">
                    {s.body}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── DEMO STRIP ─────────────────────────────────── */}
      <section className="border-b border-[var(--border)] bg-[#0e0e0d] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-6 sm:py-20 md:flex-row md:items-center">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/60">
              <Play className="h-3 w-3 fill-current" />
              Judge-ready demo flow
            </div>
            <h2 className="font-display text-[32px] leading-[1.12] tracking-[-0.02em] sm:text-[40px]">
              Connect. Pick a repo. Open the fix PR.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">
              The live path judges will click: GitHub OAuth → your repos → ship
              score → real pull request with patches.
            </p>
          </div>
          <Link
            href="/#scan"
            className="btn-shine inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-7 text-[14px] font-medium text-[var(--fg)] transition hover:bg-[var(--bg)]"
          >
            Connect & audit
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="aurora left-1/4 top-0 h-[300px] w-[300px] bg-[rgba(11,110,79,0.15)]" />
          <div
            className="aurora right-1/4 bottom-0 h-[260px] w-[260px] bg-[rgba(23,92,211,0.1)]"
            style={{ animationDelay: "-8s" }}
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-6 sm:py-32">
          <h2 className="font-display text-[36px] leading-[1.1] tracking-[-0.025em] sm:text-[48px]">
            Your repos are one
            <br />
            connect away from a ship score.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16px] text-[var(--fg-secondary)]">
            Public and private. Connect GitHub, pick a repo, get a ship score,
            open a fix PR before launch.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#scan"
              className="btn-shine inline-flex h-12 items-center gap-2 rounded-full bg-[var(--fg)] px-7 text-[14px] font-medium text-white transition hover:bg-black"
            >
              Connect GitHub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
