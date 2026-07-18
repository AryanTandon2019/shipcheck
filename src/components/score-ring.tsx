"use client";

import { motion } from "framer-motion";
import { gradeColor } from "@/lib/utils";

export function ScoreRing({
  score,
  grade,
  size = 160,
}: {
  score: number;
  grade: string;
  size?: number;
}) {
  const stroke = Math.max(8, Math.round(size * 0.055));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-muted)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#shipScoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="shipScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0b6e4f" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`font-display leading-none tracking-tight ${gradeColor(grade)}`}
          style={{ fontSize: size * 0.32 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {grade}
        </motion.span>
        <motion.span
          className="mt-1 tabular-nums text-[var(--fg-tertiary)]"
          style={{ fontSize: Math.max(12, size * 0.085) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          {score}
          <span className="text-[var(--fg-tertiary)]/70">/100</span>
        </motion.span>
      </div>
    </div>
  );
}
