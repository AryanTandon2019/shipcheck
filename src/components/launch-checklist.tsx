"use client";

import { motion } from "framer-motion";
import { CheckSquare, ListTodo } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function LaunchChecklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<Record<number, boolean>>({});

  if (!items.length) return null;

  const completed = Object.values(done).filter(Boolean).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="card overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)]/50 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--fg)] text-white">
            <ListTodo className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
              Pre-launch checklist
            </h2>
            <p className="text-[13px] text-[var(--fg-secondary)]">
              Tick these before you call it production — built from this scan.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[12px] text-[var(--fg-tertiary)] ring-1 ring-[var(--border)]">
          {completed}/{items.length} done
        </span>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {items.map((item, i) => {
          const on = !!done[i];
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-[var(--bg)]/60 sm:px-6"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                    on
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border-strong)] bg-white",
                  )}
                >
                  {on && <CheckSquare className="h-3.5 w-3.5" />}
                </span>
                <span
                  className={cn(
                    "text-[14px] leading-relaxed",
                    on
                      ? "text-[var(--fg-tertiary)] line-through"
                      : "text-[var(--fg)]",
                  )}
                >
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
