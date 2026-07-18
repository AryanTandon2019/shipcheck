"use client";

import { motion } from "framer-motion";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-mesh absolute inset-0 opacity-60" />
        <div className="aurora -left-20 top-0 h-[280px] w-[280px] bg-[rgba(11,110,79,0.12)]" />
        <div
          className="aurora right-0 top-10 h-[220px] w-[220px] bg-[rgba(23,92,211,0.08)]"
          style={{ animationDelay: "-5s" }}
        />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          {eyebrow && (
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[36px] leading-[1.1] tracking-[-0.025em] text-[var(--fg)] sm:text-[48px]">
            {title}
          </h1>
          <p className="mt-5 text-[16.5px] leading-relaxed text-[var(--fg-secondary)]">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
