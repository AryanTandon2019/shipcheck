import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--fg)] text-white shadow-sm transition group-hover:scale-[1.02]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-3.5 w-3.5"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3l7 4v5c0 4.2-2.8 7.2-7 8.8C7.8 19.2 5 16.2 5 12V7l7-4z" />
          <path d="M9.2 12.1l1.9 1.9 3.7-3.8" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.03em] text-[var(--fg)]">
        ShipCheck
      </span>
    </Link>
  );
}
