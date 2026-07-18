"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { FounderBrief } from "@/lib/types";
import { Check, Copy, FileText, Rocket, XCircle } from "lucide-react";

export function FounderBriefPanel({ brief }: { brief: FounderBrief }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(brief.cofounderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function download() {
    const blob = new Blob([brief.cofounderMessage], {
      type: "text/plain;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "shipcheck-founder-brief.txt";
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--fg)] text-white">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
              Founder brief
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--fg-secondary)]">
              Can we ship? What to fix first. Copy for your co-founder.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--fg)] px-3.5 text-[12.5px] font-medium text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy brief
              </>
            )}
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3.5 text-[12.5px] font-medium text-[var(--fg)]"
          >
            Download .txt
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div
          className={
            brief.canShip
              ? "rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5"
              : "rounded-2xl border border-red-200 bg-red-50/80 p-5"
          }
        >
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]">
            {brief.canShip ? (
              <>
                <Rocket className="h-4 w-4 text-emerald-700" />
                <span className="text-emerald-800">Can we ship?</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-700" />
                <span className="text-red-800">Can we ship?</span>
              </>
            )}
          </div>
          <p className="mt-2 font-display text-[22px] leading-snug tracking-[-0.02em] text-[var(--fg)]">
            {brief.canShip ? "Not a hard no — finish the list" : "Not yet"}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--fg-secondary)]">
            {brief.decision}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
              Top business risks
            </p>
            <ol className="mt-2 space-y-2">
              {brief.topRisks.map((r, i) => (
                <li key={r} className="flex gap-2 text-[13.5px] text-[var(--fg)]">
                  <span className="font-mono text-[var(--fg-tertiary)]">
                    {i + 1}.
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
              Fix first · effort
            </p>
            <ul className="mt-2 space-y-2">
              {brief.efforts.map((e) => (
                <li
                  key={e.title}
                  className="flex items-start justify-between gap-3 text-[13.5px]"
                >
                  <span className="text-[var(--fg)]">{e.title}</span>
                  <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--fg-secondary)]">
                    ~{e.effort}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
