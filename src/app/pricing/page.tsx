"use client";

import { Shell } from "@/components/shell";
import { PageHero } from "@/components/page-hero";
import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Public",
    price: "Free",
    blurb: "For founders and hackathon teams validating a public MVP.",
    cta: "Run an audit",
    href: "/#scan",
    featured: false,
    features: [
      "Unlimited public repo audits*",
      "Ship score + severity findings",
      "AI narrative summary",
      "Shareable report link (session)",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    blurb: "For builders who ship weekly and want history plus private access.",
    cta: "Join waitlist",
    href: "/about#contact",
    featured: true,
    features: [
      "Everything in Public",
      "Private repository support",
      "Scan history & re-runs",
      "Exportable PDF report",
      "Priority model narrative",
    ],
  },
  {
    name: "Team",
    price: "$79",
    period: "/mo",
    blurb: "For incubators, agencies, and small eng teams reviewing many apps.",
    cta: "Talk to us",
    href: "/about#contact",
    featured: false,
    features: [
      "Everything in Pro",
      "Shared workspace",
      "GitHub Action / CI badge",
      "Baseline policy presets",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <Shell>
      <PageHero
        eyebrow="Pricing"
        title="Start free. Grow into a real product."
        description="The hackathon MVP is free for public repos. Pricing below is the path to a durable SaaS — clear, boring, and founder-friendly."
      />

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "flex flex-col rounded-[20px] border p-6 sm:p-7",
                  plan.featured
                    ? "border-[var(--fg)] bg-[var(--fg)] text-white shadow-[var(--shadow-lg)]"
                    : "border-[var(--border)] bg-white",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[15px] font-medium tracking-[-0.01em]">
                    {plan.name}
                  </h2>
                  {plan.featured && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
                      Soon
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-end gap-1">
                  <span className="font-display text-[40px] leading-none tracking-[-0.02em]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={cn(
                        "mb-1 text-[13px]",
                        plan.featured ? "text-white/50" : "text-[var(--fg-tertiary)]",
                      )}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-3 text-[13.5px] leading-relaxed",
                    plan.featured ? "text-white/65" : "text-[var(--fg-secondary)]",
                  )}
                >
                  {plan.blurb}
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13.5px]">
                      <Check
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          plan.featured ? "text-white/70" : "text-[var(--accent)]",
                        )}
                        strokeWidth={2.5}
                      />
                      <span
                        className={
                          plan.featured ? "text-white/85" : "text-[var(--fg-secondary)]"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={cn(
                    "mt-8 inline-flex h-11 items-center justify-center rounded-full text-[13.5px] font-medium transition",
                    plan.featured
                      ? "bg-white text-[var(--fg)] hover:bg-[var(--bg)]"
                      : "bg-[var(--fg)] text-white hover:bg-black",
                  )}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-center text-[12.5px] text-[var(--fg-tertiary)]">
            *Fair-use rate limits apply to protect the GitHub API and scan workers.
          </p>
        </div>
      </section>
    </Shell>
  );
}
