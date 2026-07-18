"use client";

import Link from "next/link";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)]/80 bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] backdrop-blur-2xl">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-5 sm:px-6">
        <Logo />
        <Link
          href="/#scan"
          className="btn-shine inline-flex h-9 items-center rounded-full bg-[var(--fg)] px-4 text-[13px] font-medium text-white transition hover:bg-black"
        >
          Start audit
        </Link>
      </div>
    </header>
  );
}
