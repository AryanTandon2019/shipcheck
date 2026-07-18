"use client";

import { motion } from "framer-motion";
import type { Finding } from "@/lib/types";
import { cn, severityStyles } from "@/lib/utils";
import {
  CheckCircle2,
  Copy,
  FileCode2,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

export function FindingCard({
  finding,
  index,
  priority,
  mode = "founder",
  githubBase,
  defaultBranch = "main",
}: {
  finding: Finding;
  index: number;
  priority?: boolean;
  mode?: "founder" | "engineer";
  /** e.g. https://github.com/owner/repo */
  githubBase?: string;
  defaultBranch?: string;
}) {
  const [copied, setCopied] = useState<"fix" | "cofounder" | null>(null);
  const [open, setOpen] = useState(priority || index < 2);

  async function copyFix() {
    try {
      await navigator.clipboard.writeText(
        `${finding.title}\n\n${finding.simpleExplain ?? finding.description}\n\nFix: ${finding.recommendation}${
          finding.file
            ? `\n\nFile: ${finding.file}${finding.line ? `:${finding.line}` : ""}`
            : ""
        }`,
      );
      setCopied("fix");
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  async function copyCofounder() {
    const text = [
      `ShipCheck flagged: ${finding.title}`,
      ``,
      finding.simpleExplain ?? finding.description,
      finding.businessImpact ? `\nWhy it matters: ${finding.businessImpact}` : "",
      finding.attackPath ? `\nAttack path: ${finding.attackPath}` : "",
      `\nWhat to do: ${finding.recommendation}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("cofounder");
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25) }}
      className={cn(
        "rounded-2xl border bg-white transition",
        priority
          ? "border-[color-mix(in_srgb,var(--accent)_30%,var(--border))]"
          : "border-[var(--border)]",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
      >
        <span className="mt-0.5 font-mono text-[12px] text-[var(--fg-tertiary)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                severityStyles(finding.severity),
              )}
            >
              {finding.severity}
            </span>
            {priority && (
              <span className="text-[10px] font-medium text-[var(--accent)]">
                Priority
              </span>
            )}
            {finding.effort && (
              <span className="text-[11px] text-[var(--fg-tertiary)]">
                ~{finding.effort}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-[15px] font-medium tracking-[-0.02em] text-[var(--fg)]">
            {finding.title}
          </h3>
          {!open && (
            <p className="mt-1 line-clamp-2 text-[13px] text-[var(--fg-secondary)]">
              {finding.simpleExplain ?? finding.description}
            </p>
          )}
        </div>
        <span className="mt-1 text-[12px] text-[var(--fg-tertiary)]">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-[var(--border)] px-4 py-4 sm:px-5">
          {mode === "founder" ? (
            <>
              <p className="text-[14px] leading-relaxed text-[var(--fg)]">
                {finding.simpleExplain ?? finding.description}
              </p>
              {finding.attackPath && (
                <p className="text-[13.5px] leading-relaxed text-[var(--fg-secondary)]">
                  <span className="font-medium text-[var(--fg)]">Attack path — </span>
                  {finding.attackPath}
                </p>
              )}
              {finding.businessImpact && (
                <p className="text-[13.5px] leading-relaxed text-[var(--fg-secondary)]">
                  <span className="font-medium text-[var(--fg)]">Business — </span>
                  {finding.businessImpact}
                </p>
              )}
              <p className="rounded-xl bg-[var(--accent-soft)] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[var(--fg)]">
                <span className="font-medium text-[var(--accent)]">
                  Recommended fix —{" "}
                </span>
                {finding.recommendation}
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] leading-relaxed text-[var(--fg-secondary)]">
                {finding.description}
              </p>
              <p className="text-[13.5px] leading-relaxed text-[var(--fg)]">
                <span className="font-medium">Fix — </span>
                {finding.recommendation}
              </p>
              {finding.evidence && (
                <pre className="evidence">{finding.evidence}</pre>
              )}
            </>
          )}

          {finding.file && (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--fg-tertiary)]">
              <FileCode2 className="h-3.5 w-3.5" />
              {githubBase ? (
                <a
                  href={`${githubBase}/blob/${defaultBranch}/${finding.file}${finding.line ? `#L${finding.line}` : ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[var(--accent)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {finding.file}
                  {finding.line ? `:${finding.line}` : ""}
                </a>
              ) : (
                <code className="font-mono">
                  {finding.file}
                  {finding.line ? `:${finding.line}` : ""}
                </code>
              )}
            </div>
          )}

          {mode === "founder" && finding.evidence && (
            <details className="text-[12px] text-[var(--fg-tertiary)]">
              <summary className="cursor-pointer hover:text-[var(--fg-secondary)]">
                Code evidence
              </summary>
              <pre className="evidence mt-2">{finding.evidence}</pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={copyCofounder}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11.5px] text-[var(--fg-secondary)]"
            >
              {copied === "cofounder" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5" />
              )}
              {copied === "cofounder" ? "Copied" : "Text co-founder"}
            </button>
            <button
              type="button"
              onClick={copyFix}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-[11.5px] text-[var(--fg-secondary)]"
            >
              {copied === "fix" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </button>
          </div>
        </div>
      )}
    </motion.article>
  );
}
