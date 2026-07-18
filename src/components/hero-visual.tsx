"use client";

import { motion } from "framer-motion";
import { ScanDemo } from "./scan-demo";

const floaters = [
  {
    label: "CRITICAL",
    title: "Secret in source",
    meta: "lib/openai.ts",
    tone: "danger" as const,
    x: "-8%",
    y: "12%",
    delay: 0.35,
  },
  {
    label: "HIGH",
    title: "No rate limit",
    meta: "api/chat/route.ts",
    tone: "warn" as const,
    x: "78%",
    y: "8%",
    delay: 0.5,
  },
  {
    label: "SCORE",
    title: "Grade C · 61",
    meta: "Ship readiness",
    tone: "ok" as const,
    x: "72%",
    y: "72%",
    delay: 0.65,
  },
];

const toneClass = {
  danger: "border-red-200/80 bg-white text-red-700",
  warn: "border-amber-200/80 bg-white text-amber-800",
  ok: "border-emerald-200/80 bg-white text-emerald-800",
};

export function HeroVisual() {
  // Client-only component ("use client") — no SSR/client mismatch for this tree
  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(11,110,79,0.14),transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <div className="rotate-[-1.5deg] transition-transform duration-500 hover:rotate-0">
            <ScanDemo />
          </div>
        </motion.div>

        {floaters.map((f) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: f.delay,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none absolute z-20 hidden sm:block"
            style={{ left: f.x, top: f.y }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 4.5 + f.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`rounded-2xl border px-3.5 py-2.5 shadow-[0_12px_40px_rgba(20,20,19,0.12)] backdrop-blur-sm ${toneClass[f.tone]}`}
            >
              <p className="text-[10px] font-semibold tracking-[0.12em] opacity-70">
                {f.label}
              </p>
              <p className="mt-0.5 text-[13px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                {f.title}
              </p>
              <p className="font-mono text-[10.5px] text-[var(--fg-tertiary)]">
                {f.meta}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
