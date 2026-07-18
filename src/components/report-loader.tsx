"use client";

import { useEffect, useState } from "react";
import type { ScanReport } from "@/lib/types";
import { ReportView } from "./report-view";
import { readCachedReportClient } from "@/lib/report-cache";
import Link from "next/link";
import { Logo } from "./logo";
import { Loader2 } from "lucide-react";

export function ReportLoader({
  id,
  initial,
}: {
  id: string;
  initial: ScanReport | null;
}) {
  // Prefer server-provided report; only fetch when missing
  const [report, setReport] = useState<ScanReport | null>(initial);
  const [loading, setLoading] = useState(() => !initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initial) return;

    let cancelled = false;

    async function load() {
      const cached = readCachedReportClient(id);
      if (cached && !cancelled) {
        setReport(cached);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/report/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.report) {
            setReport(data.report as ScanReport);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* fall through */
      }

      if (!cancelled) {
        setFailed(true);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, initial]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--fg-tertiary)]" />
        <p className="text-[14px] text-[var(--fg-secondary)]">Loading report…</p>
      </div>
    );
  }

  if (failed || !report) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-6">
            <Logo />
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--fg-tertiary)]">
            Report unavailable
          </p>
          <h1 className="mt-3 font-display text-[32px] tracking-[-0.02em] text-[var(--fg)]">
            We couldn’t find that report
          </h1>
          <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--fg-secondary)]">
            On the live site, reports live in your browser after a scan. Run a
            new audit — it only takes a few seconds.
          </p>
          <Link
            href="/#scan"
            className="mt-8 inline-flex h-11 items-center rounded-full bg-[var(--fg)] px-5 text-[13.5px] font-medium text-white"
          >
            Start a new audit
          </Link>
        </div>
      </div>
    );
  }

  return <ReportView report={report} />;
}
