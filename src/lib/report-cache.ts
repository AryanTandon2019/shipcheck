import type { ScanReport } from "./types";

const KEY = (id: string) => `shipcheck:report:${id}`;

/** Browser cache so reports work on Vercel (serverless has no durable disk). */
export function cacheReportClient(report: ScanReport) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY(report.id), JSON.stringify(report));
    // Keep last id for recovery
    sessionStorage.setItem("shipcheck:lastReportId", report.id);
  } catch {
    /* quota / private mode */
  }
}

export function readCachedReportClient(id: string): ScanReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY(id));
    if (!raw) return null;
    return JSON.parse(raw) as ScanReport;
  } catch {
    return null;
  }
}
