"use client";

import { Shell } from "@/components/shell";
import { PageHero } from "@/components/page-hero";
import Link from "next/link";

export default function AboutPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="About"
        title="We care about what ships after the demo."
        description="ShipCheck started as a simple observation: AI makes building easy, and makes production mistakes easy to overlook. The product is the second pair of eyes."
      />

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-5 text-[15.5px] leading-relaxed text-[var(--fg-secondary)]">
              <p>
                Thousands of apps are now assembled with copilots and agents.
                Features appear in hours. Security review often never appears at
                all.
              </p>
              <p>
                We built ShipCheck for that exact workflow: paste a public
                repository, get a production-readiness audit that is fast enough
                for a hackathon and serious enough for a launch checklist.
              </p>
              <p className="text-[var(--fg)]">
                The long-term product is a SaaS: private repos, CI, team
                baselines, and fix automation — still grounded in deterministic
                analysis.
              </p>
            </div>
            <div className="card p-7 sm:p-8">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
                Principles
              </p>
              <ul className="mt-5 space-y-5">
                {[
                  {
                    t: "Clarity over theatrics",
                    d: "No neon dashboards. Findings should read like a careful engineer wrote them.",
                  },
                  {
                    t: "Trustworthy detection",
                    d: "Rules first. Models explain. Never invent vulnerabilities for drama.",
                  },
                  {
                    t: "Founder-usable",
                    d: "If you can paste a GitHub URL, you can use ShipCheck.",
                  },
                ].map((item) => (
                  <li key={item.t}>
                    <p className="text-[15px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                      {item.t}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--fg-secondary)]">
                      {item.d}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="max-w-xl">
            <h2 className="font-display text-[30px] tracking-[-0.02em]">
              Contact
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--fg-secondary)]">
              Building in public for the OpenAI × NamasteDev Codex Hackathon.
              For waitlist, feedback, or collaboration, reach out via your team
              contact or open an issue on the public repository after submission.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#scan"
                className="inline-flex h-11 items-center rounded-full bg-[var(--fg)] px-5 text-[13.5px] font-medium text-white transition hover:bg-black"
              >
                Run an audit
              </Link>
              <Link
                href="/product"
                className="inline-flex h-11 items-center rounded-full border border-[var(--border)] bg-white px-5 text-[13.5px] font-medium text-[var(--fg)] transition hover:border-[var(--border-strong)]"
              >
                Product overview
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
