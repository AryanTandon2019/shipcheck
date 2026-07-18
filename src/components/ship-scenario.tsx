"use client";

import { motion } from "framer-motion";
import type { ShipScenario } from "@/lib/types";
import { AlertTriangle, Clock3, Crosshair, Navigation } from "lucide-react";

export function ShipScenarioCard({ scenario }: { scenario: ShipScenario }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[#0e0e0d] text-white shadow-[var(--shadow-md)]"
    >
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-amber-300/90">
          <AlertTriangle className="h-3.5 w-3.5" />
          If you ship tonight
        </div>
        <h2 className="mt-2 font-display text-[26px] leading-tight tracking-[-0.02em] sm:text-[30px]">
          {scenario.headline}
        </h2>
        <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-white/65">
          {scenario.story}
        </p>
      </div>

      <div className="grid gap-px bg-white/10 sm:grid-cols-3">
        <div className="bg-[#0e0e0d] px-5 py-5 sm:px-6">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
            <Crosshair className="h-3.5 w-3.5" />
            Blast radius
          </div>
          <ul className="space-y-2.5">
            {scenario.blastRadius.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[13px] leading-snug text-white/75"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#0e0e0d] px-5 py-5 sm:px-6">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
            <Clock3 className="h-3.5 w-3.5" />
            First 72 hours
          </div>
          <ul className="space-y-2.5">
            {scenario.first72Hours.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[13px] leading-snug text-white/75"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#0e0e0d] px-5 py-5 sm:px-6">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
            <Navigation className="h-3.5 w-3.5" />
            Founder move
          </div>
          <p className="font-display text-[18px] leading-snug tracking-[-0.015em] text-white">
            {scenario.founderMove}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
