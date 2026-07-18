"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { FixPatch } from "@/lib/types";
import { Check, Copy, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FixPatches({ patches }: { patches: FixPatch[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!patches.length) return null;

  const patch = patches[Math.min(active, patches.length - 1)];

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(patch.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent-soft)] via-white to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--fg)] text-white shadow-sm">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                Framework-correct AI patches
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--accent)]">
                <Sparkles className="h-3 w-3" />
                Stack-aware
              </span>
              {patches[0]?.stackLabel && (
                <span className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10.5px] font-medium text-[var(--fg-secondary)]">
                  Detected: {patches[0].stackLabel}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--fg-secondary)]">
              {patches[0]?.stackLabel
                ? `Generated for your detected ${patches[0].stackLabel}.`
                : "Copy-paste patches tailored to this repository’s stack."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr]">
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] p-3 lg:flex-col lg:border-b-0 lg:border-r">
          {patches.map((p, i) => (
            <button
              key={`${p.findingId}-${i}`}
              type="button"
              onClick={() => {
                setActive(i);
                setCopied(false);
              }}
              className={cn(
                "shrink-0 rounded-xl px-3 py-2.5 text-left text-[13px] transition",
                active === i
                  ? "bg-[var(--fg)] text-white shadow-sm"
                  : "bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--fg)]",
              )}
            >
              <span className="font-mono text-[10px] opacity-60">
                PATCH {String(i + 1).padStart(2, "0")}
              </span>
              <span className="mt-0.5 block line-clamp-2 font-medium leading-snug">
                {p.title}
              </span>
            </button>
          ))}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13.5px] text-[var(--fg-secondary)]">
              {patch.explanation}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="btn-shine inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--fg)] px-3.5 text-[12.5px] font-medium text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy code
                </>
              )}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0d] shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-[11px] text-white/35">
                {patch.language}
              </span>
            </div>
            <pre className="max-h-[320px] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-emerald-100/90">
              <code>{patch.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
