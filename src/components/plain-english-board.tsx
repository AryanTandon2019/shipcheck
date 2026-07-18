"use client";

import { motion } from "framer-motion";
import type { Finding } from "@/lib/types";
import { cn, severityStyles } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export function PlainEnglishBoard({ findings }: { findings: Finding[] }) {
  const top = findings.slice(0, 3);
  if (!top.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="mt-6"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
            No security degree required
          </p>
          <h2 className="mt-1 font-display text-[28px] tracking-[-0.02em] text-[var(--fg)] sm:text-[32px]">
            Issues in plain English
          </h2>
          <p className="mt-1.5 max-w-xl text-[14px] text-[var(--fg-secondary)]">
            What a non-technical founder needs to understand in under a minute.
          </p>
        </div>
        <BookOpen className="hidden h-6 w-6 text-[var(--fg-tertiary)] sm:block" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {top.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
            className="card flex flex-col p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--fg-tertiary)]">
                #{i + 1}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  severityStyles(f.severity),
                )}
              >
                {f.severity}
              </span>
            </div>
            <h3 className="text-[15px] font-medium tracking-[-0.02em] text-[var(--fg)]">
              {f.title}
            </h3>
            <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-[var(--fg-secondary)]">
              {f.simpleExplain ?? f.description}
            </p>
            {f.analogy && (
              <p className="mt-3 border-t border-[var(--border)] pt-3 text-[12.5px] italic leading-relaxed text-[var(--fg-tertiary)]">
                “{f.analogy}”
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
