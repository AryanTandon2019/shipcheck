"use client";

const items = [
  "Hardcoded secrets",
  "Missing rate limits",
  "Open CORS",
  "Unauthenticated APIs",
  "SQL injection risk",
  "Webhook signature gaps",
  "Client-exposed keys",
  "Admin without RBAC",
  "No security headers",
  "Weak error handling",
  "Missing validation",
  ".env committed",
];

export function MarqueeChecks() {
  const row = [...items, ...items];
  return (
    <div className="group/mq border-y border-[var(--border)] bg-white py-4">
      <div className="marquee-mask overflow-hidden">
        <div className="marquee gap-3 pr-3">
          {row.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-1.5 text-[12.5px] text-[var(--fg-secondary)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
