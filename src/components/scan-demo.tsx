"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, KeyRound, Check } from "lucide-react";

type Sev = "crit" | "warn" | "ok";

const LINES: { sev: Sev; icon: typeof KeyRound; label: string; file: string }[] = [
  { sev: "crit", icon: KeyRound, label: "Hardcoded Stripe key", file: "lib/pay.ts:14" },
  { sev: "crit", icon: ShieldAlert, label: "Unauthenticated /api/admin", file: "app/api/admin/route.ts" },
  { sev: "warn", icon: AlertTriangle, label: "No rate limit on /api/scan", file: "app/api/scan/route.ts" },
  { sev: "warn", icon: AlertTriangle, label: "Open CORS: origin *", file: "next.config.ts:22" },
  { sev: "ok", icon: Check, label: "Input validated with zod", file: "lib/schema.ts" },
];

const sevStyle: Record<Sev, string> = {
  crit: "text-[var(--danger)] bg-[var(--danger-soft)]",
  warn: "text-[var(--warning)] bg-[var(--warning-soft)]",
  ok: "text-[var(--accent)] bg-[var(--accent-soft)]",
};

export function ScanDemo() {
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Loop the demo so the hero always feels alive for judges
  useEffect(() => {
    if (visible < LINES.length) {
      const t = setTimeout(() => setVisible((v) => v + 1), 620);
      return () => clearTimeout(t);
    }
    const show = setTimeout(() => setDone(true), 400);
    const reset = setTimeout(() => {
      setDone(false);
      setVisible(0);
    }, 4200);
    return () => {
      clearTimeout(show);
      clearTimeout(reset);
    };
  }, [visible]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[#0e0e0d] shadow-[var(--shadow-lg)]"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[11.5px] text-white/40">
          shipcheck audit — supabase/supabase
        </span>
      </div>

      {/* scan sweep line */}
      {!done && (
        <div className="pointer-events-none absolute inset-x-0 top-12 h-24">
          <div className="scan-sweep h-px w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent shadow-[0_0_12px_2px_rgba(11,110,79,0.5)]" />
        </div>
      )}

      {/* findings */}
      <div className="min-h-[280px] space-y-1.5 p-4">
        <p className="mb-3 font-mono text-[11.5px] text-white/35">
          <span className="text-[var(--accent)]">$</span> scanning 1,284 files…
        </p>
        <AnimatePresence>
          {LINES.slice(0, visible).map((l) => (
            <motion.div
              key={l.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${sevStyle[l.sev]}`}
              >
                <l.icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="text-[13px] text-white/85">{l.label}</span>
              <span className="ml-auto font-mono text-[11px] text-white/30">
                {l.file}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!done && visible >= LINES.length && (
          <p className="px-2 pt-1 font-mono text-[12px] text-white/40">
            scoring<span className="cursor-blink">▊</span>
          </p>
        )}

        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                  Ship score
                </p>
                <p className="mt-0.5 text-[13px] text-white/70">
                  2 critical · 2 warnings
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[44px] leading-none text-[#febc2e]">
                  C
                </span>
                <span className="font-mono text-[13px] text-white/40">
                  61/100
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
