import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Severity } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/, "");

  const httpsMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?/i,
  );
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}

export function severityWeight(severity: Severity): number {
  switch (severity) {
    case "critical":
      return 25;
    case "high":
      return 15;
    case "medium":
      return 8;
    case "low":
      return 3;
    case "info":
      return 1;
  }
}

export function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function severityStyles(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-[var(--danger-soft)] text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_18%,transparent)]";
    case "high":
      return "bg-[#fff4ed] text-[#c2410c] border-[#fed7aa]";
    case "medium":
      return "bg-[var(--warning-soft)] text-[var(--warning)] border-[#fde68a]";
    case "low":
      return "bg-[var(--info-soft)] text-[var(--info)] border-[#bfdbfe]";
    case "info":
      return "bg-[var(--bg-muted)] text-[var(--fg-secondary)] border-[var(--border)]";
  }
}

export function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-[var(--accent)]";
    case "B":
      return "text-[#15803d]";
    case "C":
      return "text-[var(--warning)]";
    case "D":
      return "text-[#c2410c]";
    default:
      return "text-[var(--danger)]";
  }
}
