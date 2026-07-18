import type { RepoFile, StackFramework, StackInfo } from "./types";

export function detectStack(files: RepoFile[]): StackInfo {
  const allContent = files.map((f) => f.content).join("\n");
  const paths = files.map((f) => f.path.toLowerCase());

  const pkg = files.find((f) => f.path.endsWith("package.json"));
  let deps: Record<string, string> = {};
  if (pkg) {
    try {
      const j = JSON.parse(pkg.content) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      deps = { ...j.dependencies, ...j.devDependencies };
    } catch {
      /* ignore */
    }
  }

  const hasNext = Boolean(deps.next) || paths.some((p) => p.includes("next.config"));
  const hasAppRouter =
    paths.some((p) => /\/app\/.*\/route\.(ts|js)$/.test(p) || p.includes("/app/")) ||
    /export\s+(async\s+)?function\s+(GET|POST)/.test(allContent);
  const hasPages = paths.some((p) => p.includes("/pages/api/"));
  const hasExpress =
    Boolean(deps.express) || /from ['"]express['"]|require\(['"]express['"]\)/.test(allContent);
  const hasCf =
    paths.some((p) => p.includes("wrangler")) ||
    Boolean(deps.wrangler) ||
    /cloudflare:workers|@cloudflare\//.test(allContent);
  const hasSupabase =
    Boolean(deps["@supabase/supabase-js"]) ||
    /createClient\(|supabase\.auth|service_role/.test(allContent);

  const badges: string[] = [];
  let framework: StackFramework = "generic";
  let label = "Generic Node / web app";
  let fixHints: string[] = [
    "Prefer env vars for secrets",
    "Auth every mutating API",
    "Rate-limit expensive endpoints",
  ];

  if (hasNext && (hasAppRouter || !hasPages)) {
    framework = "nextjs-app";
    label = "Next.js App Router";
    badges.push("Next.js", "App Router");
    fixHints = [
      "Use route handlers with session checks",
      "Rate-limit with @upstash/ratelimit or middleware",
      "Never put secrets in NEXT_PUBLIC_*",
      "Set security headers in next.config or middleware",
    ];
  } else if (hasNext && hasPages) {
    framework = "nextjs-pages";
    label = "Next.js Pages Router";
    badges.push("Next.js", "Pages API");
    fixHints = [
      "Protect pages/api handlers with getServerSession / auth helper",
      "Upstash rate limit in API routes",
      "Headers via next.config.js",
    ];
  } else if (hasExpress) {
    framework = "express";
    label = "Express";
    badges.push("Express");
    fixHints = [
      "express-rate-limit on /api",
      "helmet() for headers",
      "auth middleware before handlers",
    ];
  } else if (hasCf) {
    framework = "cloudflare";
    label = "Cloudflare Workers";
    badges.push("Cloudflare");
    fixHints = [
      "Use Workers rate limiting / WAF rules",
      "Secrets via wrangler secrets",
      "Validate auth in the Worker entry",
    ];
  }

  if (hasSupabase) {
    badges.push("Supabase");
    fixHints.push("Enforce RLS; never expose service_role to the client");
    if (framework === "generic") {
      framework = "supabase";
      label = "Supabase-backed app";
    }
  }

  if (badges.length === 0) {
    badges.push(files.find((f) => f.path.endsWith("package.json")) ? "Node" : "Source");
  }

  return { framework, label, badges, fixHints };
}
