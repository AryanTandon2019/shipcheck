import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--fg-secondary)]">
            Production readiness audits for software shipped with AI.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href="/#scan"
            className="text-[13.5px] font-medium text-[var(--fg)] transition hover:opacity-70"
          >
            Run an audit →
          </Link>
          <p className="text-[12px] text-[var(--fg-tertiary)]">
            © {new Date().getFullYear()} ShipCheck
          </p>
        </div>
      </div>
    </footer>
  );
}
