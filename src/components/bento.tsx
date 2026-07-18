"use client";

import { motion } from "framer-motion";
import {
  KeyRound,
  ShieldOff,
  Gauge,
  FileWarning,
  Lock,
  Sparkles,
} from "lucide-react";

const cells = [
  {
    span: "md:col-span-2 md:row-span-2",
    title: "Secrets don’t hide forever",
    body: "API keys, service roles, and .env commits surface with file evidence — before they hit a public fork.",
    visual: "secrets",
  },
  {
    span: "md:col-span-1",
    title: "Auth gaps",
    body: "Routes that respond without a session check.",
    icon: ShieldOff,
  },
  {
    span: "md:col-span-1",
    title: "Rate limits",
    body: "Protect AI endpoints from bill-burn attacks.",
    icon: Gauge,
  },
  {
    span: "md:col-span-1",
    title: "Injection & XSS",
    body: "SQL concat, eval, dangerous HTML.",
    icon: FileWarning,
  },
  {
    span: "md:col-span-2",
    title: "A ship score founders can share",
    body: "Security, production, and practices — one grade for your co-founder, mentor, or demo day judges.",
    visual: "score",
  },
];

export function Bento() {
  return (
    <div className="grid gap-3 md:grid-cols-3 md:auto-rows-[minmax(140px,auto)]">
      {cells.map((c, i) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: i * 0.05, duration: 0.45 }}
          className={`group relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${c.span}`}
        >
          {/* hover wash */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_var(--x,50%)_var(--y,0%),rgba(11,110,79,0.06),transparent_45%)] opacity-0 transition group-hover:opacity-100" />

          {"icon" in c && c.icon && (
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg)] text-[var(--fg)] ring-1 ring-[var(--border)]">
              <c.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
          )}

          {c.visual === "secrets" && (
            <div className="relative mb-6 h-36 overflow-hidden rounded-2xl bg-[#0e0e0d] p-4 font-mono text-[12px] leading-relaxed text-white/70">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(14,14,13,0.2),#0e0e0d)]" />
              <p className="text-white/30">{`// app/api/chat/route.ts`}</p>
              <p className="mt-2">
                <span className="text-[#c678dd]">const</span> key ={" "}
                <span className="rounded bg-red-500/20 px-1 text-red-300">
                  &quot;sk-live-••••••••&quot;
                </span>
              </p>
              <p className="mt-1 text-white/35">{`// never commit this`}</p>
              <motion.div
                className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-[11px] text-red-200"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Critical · hardcoded secret detected
              </motion.div>
            </div>
          )}

          {c.visual === "score" && (
            <div className="mb-5 flex items-end gap-6">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="-rotate-90" width="96" height="96">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="#efeee9"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    whileInView={{ strokeDashoffset: 2 * Math.PI * 40 * 0.28 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <span className="absolute font-display text-3xl text-[var(--accent)]">
                  B
                </span>
              </div>
              <div className="flex-1 space-y-2 pb-1">
                {[
                  { l: "Security", w: "72%" },
                  { l: "Production", w: "64%" },
                  { l: "Practices", w: "81%" },
                ].map((row) => (
                  <div key={row.l}>
                    <div className="mb-1 flex justify-between text-[11px] text-[var(--fg-tertiary)]">
                      <span>{row.l}</span>
                    </div>
                    <div className="score-track">
                      <motion.div
                        className="score-fill"
                        initial={{ width: 0 }}
                        whileInView={{ width: row.w }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.15 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="relative text-[17px] font-medium tracking-[-0.02em] text-[var(--fg)]">
            {c.title}
          </h3>
          <p className="relative mt-2 text-[13.5px] leading-relaxed text-[var(--fg-secondary)]">
            {c.body}
          </p>

          {c.visual === "secrets" && (
            <div className="relative mt-4 flex items-center gap-2 text-[12px] text-[var(--accent)]">
              <Lock className="h-3.5 w-3.5" />
              Rotate · move to env · scrub history
            </div>
          )}
          {c.visual === "score" && (
            <div className="relative mt-3 flex items-center gap-2 text-[12px] text-[var(--fg-tertiary)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              Built to screenshot into a pitch deck
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
