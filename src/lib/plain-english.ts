import type { Finding, IssueCategory } from "./types";

const RULE_PLAIN: Record<
  string,
  { simple: string; business: string; analogy: string }
> = {
  "secrets.hardcoded": {
    simple:
      "A password or API key is written directly in the code. Anyone who can see the repo can use it.",
    business:
      "Attackers can steal your data, spam your AI APIs, or run up a huge cloud bill using your key.",
    analogy: "Like leaving your house key under the doormat with a neon sign.",
  },
  "secrets.env-committed": {
    simple:
      "An environment file (.env) is stored in Git. Those files usually hold private settings and secrets.",
    business:
      "Old keys can stay in Git history forever — even after you “delete” them later.",
    analogy: "Putting your diary in a public library and hoping nobody opens it.",
  },
  "secrets.client-exposed": {
    simple:
      "A secret is marked as public (for the browser). Browsers can never keep real secrets safe.",
    business:
      "Users (or bots) can open DevTools and copy privileged keys meant only for your server.",
    analogy: "Tattooing your PIN on your forehead and calling it security.",
  },
  "api.no-rate-limit": {
    simple:
      "Your APIs don’t appear to limit how fast someone can call them.",
    business:
      "One script can hammer login, signup, or AI endpoints until the service dies or the bill explodes.",
    analogy: "A free buffet with no plates limit — chaos is guaranteed.",
  },
  "api.open-cors": {
    simple:
      "Any website is allowed to call your API from a visitor’s browser.",
    business:
      "A malicious site can act as the user while they’re logged into your app.",
    analogy: "Letting every shop in town charge your credit card.",
  },
  "auth.missing-on-api": {
    simple:
      "An API endpoint answers requests without clearly checking who the user is.",
    business:
      "Strangers may read or change data that should only belong to logged-in users.",
    analogy: "A bank vault door that opens when you knock.",
  },
  "auth.admin-unprotected": {
    simple: "Admin pages or tools may not check if you’re actually an admin.",
    business: "One guessed URL could unlock dangerous controls.",
    analogy: "Hiding the manager’s office but leaving it unlocked.",
  },
  "auth.webhook-no-verify": {
    simple:
      "A webhook accepts messages without checking they really came from Stripe/GitHub/etc.",
    business: "Fake events can mark invoices paid, create users, or trigger side effects.",
    analogy: "Believing every caller who says “Hi, I’m your bank.”",
  },
  "injection.sql": {
    simple: "User input might be mixed into database queries in an unsafe way.",
    business: "Attackers can read or wipe data by crafting special input.",
    analogy: "Letting strangers rewrite the questions your database answers.",
  },
  "injection.eval": {
    simple: "The app runs dynamic code (eval) — dangerous if input is attacker-controlled.",
    business: "Remote code execution can fully compromise the server.",
    analogy: "Letting strangers type commands into your computer.",
  },
  "injection.xss-dbihtml": {
    simple: "HTML from outside may be injected into the page without cleaning.",
    business: "Attackers can steal sessions or trick users in your UI.",
    analogy: "Letting strangers post flyers inside your store that steal wallets.",
  },
  "prod.no-security-headers": {
    simple: "Browser security headers (like anti-clickjacking) weren’t clearly configured.",
    business: "Some common web attacks become easier against your users.",
    analogy: "A store with doors but no locks on the windows.",
  },
  "config.env-not-ignored": {
    simple: ".env isn’t listed in .gitignore, so secrets are easy to commit by mistake.",
    business: "One careless commit can leak production keys to GitHub.",
    analogy: "No “do not ship” sticker on the box that holds the keys.",
  },
  "config.no-env-example": {
    simple: "There’s no template showing which environment variables the app needs.",
    business: "Deploys fail and new teammates guess wrong production settings.",
    analogy: "A recipe that says “add spices” with no list.",
  },
  "config.no-gitignore": {
    simple: "No .gitignore was found in the sample — junk and secrets may get committed.",
    business: "Repos bloat and accidental leaks slow teams and create risk.",
    analogy: "Moving house without deciding what stays private.",
  },
  "api.weak-error-handling": {
    simple: "Many API paths don’t catch errors carefully.",
    business: "Crashes and raw error messages can leak internals or take the app down.",
    analogy: "No plan for when the kitchen catches fire.",
  },
  "deps.no-validation": {
    simple: "Incoming data may not be checked against a clear schema.",
    business: "Bad or malicious input causes crashes and weird bugs in production.",
    analogy: "Accepting any package at the door without checking the label.",
  },
  "deps.express-security": {
    simple: "An Express app is missing common security middleware.",
    business: "Default setups miss easy protections against basic web attacks.",
    analogy: "Opening a shop without a lock or camera.",
  },
  "deps.no-quality-scripts": {
    simple: "No obvious test or lint scripts in package.json.",
    business: "Broken code ships more often and takes longer to notice.",
    analogy: "No spellcheck before publishing the brochure.",
  },
  "prod.debug-mode": {
    simple: "Debug/development mode may be turned on in a production-like config.",
    business: "Stack traces and internal details can leak to the public.",
    analogy: "Leaving the backstage door open during the show.",
  },
};

const CATEGORY_FALLBACK: Record<
  IssueCategory,
  { simple: string; business: string; analogy: string }
> = {
  secrets: {
    simple: "Something private (keys, passwords, tokens) may be easier to steal than it should be.",
    business: "Leaked credentials often mean data loss or surprise infrastructure costs.",
    analogy: "Leaving valuables where strangers can walk by.",
  },
  auth: {
    simple: "The app may not always verify who is allowed to do something.",
    business: "Wrong people can access private data or admin actions.",
    analogy: "A VIP rope that anyone can step over.",
  },
  api: {
    simple: "An API surface looks under-protected for real internet traffic.",
    business: "APIs are the front door — weak doors get kicked in first.",
    analogy: "A store entrance with no greeter and no limit on who enters.",
  },
  injection: {
    simple: "Untrusted input might be treated as code or queries.",
    business: "Classic path to data breaches and account takeover.",
    analogy: "Letting strangers write the instructions your staff follows.",
  },
  config: {
    simple: "Project setup/config is missing a safety habit teams rely on.",
    business: "Misconfiguration is a top cause of real-world incidents.",
    analogy: "A checklist with half the boxes blank.",
  },
  dependencies: {
    simple: "Libraries or scripts that keep the app safe/maintainable may be missing.",
    business: "Quality gaps compound as the product grows.",
    analogy: "Building a house without basic tools in the kit.",
  },
  "best-practices": {
    simple: "A maintainability or hygiene practice is missing.",
    business: "Small gaps become expensive later under real users.",
    analogy: "Skipping oil changes until the engine complains.",
  },
  production: {
    simple: "A production hardening step wasn’t found.",
    business: "Demo-quality setups often break (or get probed) under real traffic.",
    analogy: "Launching a plane after only taxi tests.",
  },
};

export function enrichFindingPlainEnglish(finding: Finding): Finding {
  if (finding.simpleExplain && finding.businessImpact && finding.analogy) {
    return finding;
  }
  const fromRule = RULE_PLAIN[finding.ruleId];
  const fromCat = CATEGORY_FALLBACK[finding.category];
  const pack = fromRule ?? fromCat;
  return {
    ...finding,
    simpleExplain: finding.simpleExplain ?? pack.simple,
    businessImpact: finding.businessImpact ?? pack.business,
    analogy: finding.analogy ?? pack.analogy,
  };
}

export function enrichAllFindings(findings: Finding[]): Finding[] {
  return findings.map(enrichFindingPlainEnglish);
}

export function buildLaunchChecklist(findings: Finding[]): string[] {
  const items: string[] = [];
  const has = (prefix: string) => findings.some((f) => f.ruleId.startsWith(prefix) || f.ruleId.includes(prefix));

  if (findings.some((f) => f.category === "secrets")) {
    items.push("Rotate any keys that might have been exposed; move secrets to env / a vault");
  }
  if (has("auth") || findings.some((f) => f.category === "auth")) {
    items.push("Lock every non-public API behind real session / JWT checks");
  }
  if (has("rate-limit") || findings.some((f) => f.ruleId.includes("rate-limit"))) {
    items.push("Add rate limits on auth, AI, and expensive endpoints");
  }
  if (findings.some((f) => f.category === "injection")) {
    items.push("Stop string-building SQL/HTML; use params + sanitization");
  }
  if (findings.some((f) => f.ruleId.includes("headers") || f.category === "production")) {
    items.push("Turn on security headers (CSP / frame / nosniff) in prod");
  }
  if (findings.some((f) => f.ruleId.includes("env"))) {
    items.push("Commit only .env.example; gitignore real .env files");
  }
  if (items.length === 0) {
    items.push("Re-run ShipCheck after the next AI-generated feature");
    items.push("Add a basic CI check so regressions can’t sneak in");
    items.push("Review auth on any new /api routes before launch");
  }
  // Always useful closer
  if (items.length < 4) {
    items.push("Do a paid-user dry run: signup → main action → billing (if any)");
  }
  return items.slice(0, 6);
}
