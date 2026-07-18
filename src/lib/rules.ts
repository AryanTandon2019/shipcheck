import type { Finding, RepoFile } from "./types";
import { nanoid } from "nanoid";

interface RuleContext {
  files: RepoFile[];
  packageJson?: Record<string, unknown>;
  fileMap: Map<string, string>;
}

type Rule = (ctx: RuleContext) => Finding[];

function finding(
  partial: Omit<Finding, "id"> & { id?: string },
): Finding {
  return { id: partial.id ?? nanoid(8), ...partial };
}

function linesOf(content: string): string[] {
  return content.split(/\r?\n/);
}

function findLine(content: string, pattern: RegExp): number | undefined {
  const lines = linesOf(content);
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return undefined;
}

function snippet(content: string, line?: number): string | undefined {
  if (!line) return undefined;
  const lines = linesOf(content);
  const idx = line - 1;
  return lines[idx]?.trim().slice(0, 160);
}

/** Skip tests, fixtures, mocks, generated snapshots — huge FP source on monorepos */
function isNoisePath(path: string): boolean {
  const p = path.toLowerCase();
  return (
    /\.(test|spec)\.[jt]sx?$/.test(p) ||
    p.includes("/__tests__/") ||
    p.includes("/__mocks__/") ||
    p.includes("/__fixtures__/") ||
    p.includes("/fixtures/") ||
    p.includes("/mocks/") ||
    p.includes("/test/") ||
    p.includes("/tests/") ||
    p.includes("/e2e/") ||
    p.includes("/cypress/") ||
    p.includes("/playwright/") ||
    p.includes(".stories.") ||
    p.includes("/storybook/") ||
    p.endsWith(".md") ||
    p.includes(".env.example") ||
    p.includes(".env.sample") ||
    p.includes(".env.template")
  );
}

function looksLikePlaceholderSecret(value: string): boolean {
  const v = value.toLowerCase();
  return (
    /your[_-]?|xxx|todo|changeme|placeholder|example|dummy|fake|sample|test[_-]?key|not[_-]?a[_-]?secret|insert|replace|<.*>|\{\{.*\}\}/i.test(
      v,
    ) || v.length < 16
  );
}

function isPlaceholderEnvFile(content: string): boolean {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) return true;

  let emptyish = 0;
  for (const line of lines) {
    const m = line.match(/^[A-Za-z_][A-Za-z0-9_]*\s*=\s*(.*)$/);
    if (!m) continue;
    const val = m[1].replace(/^['"]|['"]$/g, "").trim();
    if (!val || looksLikePlaceholderSecret(val) || val === "true" || val === "false" || /^\d+$/.test(val)) {
      emptyish += 1;
    }
  }
  // Mostly empty / placeholder values → local template, not a leaked production vault
  return emptyish >= Math.max(1, lines.length * 0.7);
}

// --- Individual rules ---

const secretPatterns: Array<{ name: string; re: RegExp; allowInTests?: boolean }> = [
  // Real key shapes — still skip pure test files
  { name: "OpenAI / API key", re: /sk-(?:proj-)?[a-zA-Z0-9_-]{20,}/ },
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
  { name: "Stripe secret", re: /sk_live_[A-Za-z0-9]{20,}/ },
  // Noisy patterns — production files only, not tests
  {
    name: "Generic API key assignment",
    re: /(api[_-]?key|secret[_-]?key|private[_-]?key)\s*[:=]\s*['"][^'"]{16,}['"]/i,
  },
  {
    name: "Bearer token hardcode",
    // Avoid matching short test tokens / "Bearer ${token}"
    re: /Bearer\s+(?!\$\{)[A-Za-z0-9\-._~+/]{24,}=*/,
  },
  {
    name: "Supabase service role JWT",
    re: /service_role['":\s]+eyJ[a-zA-Z0-9._-]{20,}/i,
  },
];

const secretsRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  for (const file of ctx.files) {
    if (isNoisePath(file.path)) continue;

    for (const { name, re } of secretPatterns) {
      if (re.test(file.content)) {
        const line = findLine(file.content, re);
        const evidence = snippet(file.content, line);
        // Skip obvious placeholders in the matched line
        if (evidence && looksLikePlaceholderSecret(evidence)) continue;

        findings.push(
          finding({
            title: `Possible secret exposed: ${name}`,
            description:
              "Hardcoded credentials or API keys were detected in source. Anyone with repo access (or a public clone) can abuse them.",
            severity: "critical",
            category: "secrets",
            file: file.path,
            line,
            evidence,
            recommendation:
              "Rotate the key immediately, move secrets to environment variables, and add the file to .gitignore. Use a secrets manager in production.",
            ruleId: "secrets.hardcoded",
          }),
        );
      }
    }

    // .env committed — critical only if content looks like real secret material
    const base = file.path.split("/").pop() ?? file.path;
    if (/^\.env($|\.(local|production|development)$)/.test(base)) {
      const placeholder = isPlaceholderEnvFile(file.content);
      const hasSecretShape =
        /sk-(?:proj-)?[a-zA-Z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|sk_live_[A-Za-z0-9]{16,}|eyJ[a-zA-Z0-9_-]{40,}/.test(
          file.content,
        );
      const severity =
        !placeholder && hasSecretShape
          ? "critical"
          : placeholder
            ? "low"
            : "medium";
      findings.push(
        finding({
          title:
            severity === "critical"
              ? "Environment file committed with secret-like values"
              : severity === "low"
                ? "Environment file committed (template-style)"
                : "Environment file tracked in git",
          description:
            severity === "critical"
              ? `${file.path} is tracked and contains high-entropy secret-like values. Rotate anything real immediately.`
              : `${file.path} is tracked in git. Big monorepos sometimes commit local env templates — still prefer .env.example + gitignore for real secrets.`,
          severity,
          category: "secrets",
          file: file.path,
          recommendation:
            "Keep only .env.example with placeholders. Real secrets stay local / in a secrets manager, never in git.",
          ruleId: "secrets.env-committed",
        }),
      );
    }
  }
  return findings;
};

const rateLimitRule: Rule = (ctx) => {
  // Prefer real API handlers for evidence (file:line judges can open)
  const apiFiles = ctx.files.filter(
    (f) =>
      !isNoisePath(f.path) &&
      ((/\/api\//.test(f.path) && /route\.(ts|js)$/.test(f.path)) ||
        (/pages\/api\//.test(f.path) && /\.(ts|js)$/.test(f.path)) ||
        (/route\.(ts|js)$/.test(f.path) &&
          /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)|export\s+const\s+(GET|POST)/.test(
            f.content,
          ))),
  );

  if (apiFiles.length === 0) return [];

  const hasRateLimit = ctx.files.some((f) =>
    /rate[-_]?limit|ratelimit|express-rate-limit|@upstash\/ratelimit|slowDown|throttle/i.test(
      f.content,
    ),
  );

  if (hasRateLimit) return [];

  // Point at the most “expensive-looking” handler if possible
  const sample =
    apiFiles.find((f) =>
      /generate|chat|ai|completion|openai|image|search|upload/i.test(f.path),
    ) ?? apiFiles[0];
  const line =
    findLine(
      sample.content,
      /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)|export\s+const\s+(GET|POST)|export\s+default/,
    ) ?? 1;

  return [
    finding({
      title: "No API rate limiting detected",
      description: `API handlers exist (e.g. ${sample.path}) but no rate-limiting library or middleware was found in the scanned files. Attackers can brute-force auth, burn AI budget, or flood endpoints.`,
      severity: "high",
      category: "api",
      file: sample.path,
      line,
      evidence: snippet(sample.content, line),
      recommendation:
        "Add rate limiting on auth and expensive AI endpoints (e.g. @upstash/ratelimit for Next.js route handlers, express-rate-limit for Express).",
      ruleId: "api.no-rate-limit",
    }),
  ];
};

const corsRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  for (const file of ctx.files) {
    if (isNoisePath(file.path)) continue;
    const openCors =
      /Access-Control-Allow-Origin['":\s]*\*/.test(file.content) ||
      /origin:\s*true/.test(file.content) ||
      /cors\(\s*\{[^}]*origin:\s*['"]?\*['"]?/.test(file.content) ||
      /cors\(\s*\)/.test(file.content);

    if (openCors) {
      const line = findLine(
        file.content,
        /Access-Control-Allow-Origin|cors\(|origin:\s*true|origin:\s*['"]?\*/,
      );
      findings.push(
        finding({
          title: "Overly permissive CORS configuration",
          description:
            "CORS appears to allow any origin. Malicious sites can call your authenticated APIs from a victim's browser.",
          severity: "high",
          category: "api",
          file: file.path,
          line,
          evidence: snippet(file.content, line),
          recommendation:
            "Restrict CORS to your production and staging domains only. Avoid origin: true / * with credentials.",
          ruleId: "api.open-cors",
        }),
      );
    }
  }
  return findings;
};

const authOnApiRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  // Only real route handlers — not validators, utils, or tests
  const apiRoutes = ctx.files.filter(
    (f) =>
      !isNoisePath(f.path) &&
      /route\.(ts|js)$/.test(f.path) &&
      /\/api\//.test(f.path) &&
      !/auth|login|signup|register|webhook|health|public|status|banner|crawler/i.test(
        f.path,
      ),
  );

  for (const file of apiRoutes) {
    const hasHandler =
      /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/.test(file.content) ||
      /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)/.test(file.content) ||
      /\.(get|post|put|patch|delete)\(/.test(file.content);

    if (!hasHandler) continue;

    const hasAuth =
      /getServerSession|auth\(|requireAuth|authenticate|verifyToken|getUser|currentUser|clerk|supabase\.auth|createServerClient|getSession|Authorization|bearer|protect|withAuth|ensureAuth|apiKey|validateRequest|isAuthenticated/i.test(
        file.content,
      );

    if (!hasAuth) {
      findings.push(
        finding({
          title: "API route may be missing authentication",
          description:
            "This route handles HTTP methods but no common auth check was detected. Unauthenticated access can leak or mutate data.",
          severity: "high",
          category: "auth",
          file: file.path,
          recommendation:
            "Verify the user session/JWT at the start of every protected handler. Return 401/403 when unauthenticated.",
          ruleId: "auth.missing-on-api",
        }),
      );
    }
  }

  // Cap noise: keep top 3 auth route findings (scoring also diminishes duplicates)
  return findings.slice(0, 3);
};

const injectionRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  for (const file of ctx.files) {
    if (isNoisePath(file.path)) continue;

    const sqlConcat =
      /(query|execute|raw)\s*\(\s*[`'"].*\$\{|(SELECT|INSERT|UPDATE|DELETE).*\+.*req\.|`\s*SELECT[\s\S]*\$\{/i.test(
        file.content,
      );
    if (sqlConcat) {
      const line = findLine(file.content, /SELECT|INSERT|UPDATE|DELETE|query\(|\.raw\(/);
      findings.push(
        finding({
          title: "Possible SQL injection risk",
          description:
            "SQL appears to be built with string concatenation or template literals including user input.",
          severity: "critical",
          category: "injection",
          file: file.path,
          line,
          evidence: snippet(file.content, line),
          recommendation:
            "Use parameterized queries or an ORM (Prisma, Drizzle). Never interpolate user input into SQL.",
          ruleId: "injection.sql",
        }),
      );
    }

    if (/\beval\s*\(/.test(file.content) || /new\s+Function\s*\(/.test(file.content)) {
      const line = findLine(file.content, /\beval\s*\(|new\s+Function\s*\(/);
      findings.push(
        finding({
          title: "Dangerous eval / Function constructor",
          description: "Dynamic code execution can lead to remote code execution if input is attacker-controlled.",
          severity: "critical",
          category: "injection",
          file: file.path,
          line,
          evidence: snippet(file.content, line),
          recommendation: "Remove eval/Function. Use safe parsers or explicit allow-listed logic.",
          ruleId: "injection.eval",
        }),
      );
    }

    if (/dangerouslySetInnerHTML/.test(file.content)) {
      const line = findLine(file.content, /dangerouslySetInnerHTML/);
      findings.push(
        finding({
          title: "XSS risk via dangerouslySetInnerHTML",
          description: "Unsanitized HTML injection is a common XSS vector in React apps.",
          severity: "high",
          category: "injection",
          file: file.path,
          line,
          evidence: snippet(file.content, line),
          recommendation: "Sanitize with DOMPurify or avoid raw HTML. Prefer text content.",
          ruleId: "injection.xss-dbihtml",
        }),
      );
    }
  }
  return findings;
};

const gitignoreRule: Rule = (ctx) => {
  // Prefer root .gitignore — monorepos often only have it at repo root
  const gitignore =
    ctx.files.find((f) => f.path === ".gitignore") ||
    ctx.files.find((f) => f.path.endsWith("/.gitignore"));

  // If we never loaded a gitignore, do NOT assume it's missing (sampling limitation)
  if (!gitignore) {
    return [];
  }

  const findings: Finding[] = [];
  if (!/\.env/.test(gitignore.content)) {
    findings.push(
      finding({
        title: ".env not ignored in .gitignore",
        description: "Environment files may be committed accidentally.",
        severity: "high",
        category: "secrets",
        file: gitignore.path,
        recommendation: "Add .env, .env.local, and .env*.local to .gitignore.",
        ruleId: "config.env-not-ignored",
      }),
    );
  }
  return findings;
};

const envExampleRule: Rule = (ctx) => {
  const hasEnvExample = ctx.files.some((f) =>
    /\.env\.example$|\.env\.sample$|\.env\.template$|\.env\.local\.example$/.test(
      f.path,
    ),
  );
  // Placeholder-style .env files often serve as examples in monorepos
  const hasPlaceholderEnv = ctx.files.some(
    (f) =>
      /(^|\/)\.env($|\.(local|development)$)/.test(f.path) &&
      isPlaceholderEnvFile(f.content),
  );
  const usesEnv =
    ctx.files.some((f) => /process\.env\.|import\.meta\.env/.test(f.content)) ||
    Boolean(ctx.packageJson);

  if (usesEnv && !hasEnvExample && !hasPlaceholderEnv) {
    const pkg = ctx.files.find((f) => f.path.endsWith("package.json"));
    return [
      finding({
        title: "No .env.example for required environment variables",
        description:
          "The project reads environment variables but has no template. New contributors (and you later) will misconfigure production.",
        severity: "low",
        category: "best-practices",
        file: pkg?.path ?? ".env.example",
        line: pkg ? 1 : undefined,
        evidence: pkg
          ? snippet(pkg.content, 1)
          : "Add .env.example at the repo root with placeholder keys.",
        recommendation: "Add .env.example with placeholder keys and document each variable.",
        ruleId: "config.no-env-example",
      }),
    ];
  }
  return [];
};

const errorHandlingRule: Rule = (ctx) => {
  const apiFiles = ctx.files.filter(
    (f) => /\/api\//.test(f.path) || /route\.(ts|js)$/.test(f.path),
  );
  if (apiFiles.length < 2) return [];

  const withTryCatch = apiFiles.filter((f) => /try\s*\{/.test(f.content)).length;
  const ratio = withTryCatch / apiFiles.length;

  if (ratio < 0.3) {
    return [
      finding({
        title: "Weak error handling on API routes",
        description: `Only ${withTryCatch}/${apiFiles.length} API-related files use try/catch. Unhandled errors can leak stack traces or crash the process.`,
        severity: "medium",
        category: "best-practices",
        recommendation:
          "Wrap handlers in try/catch, return structured errors, and avoid exposing stack traces in production.",
        ruleId: "api.weak-error-handling",
      }),
    ];
  }
  return [];
};

const securityHeadersRule: Rule = (ctx) => {
  const configFiles = ctx.files.filter((f) =>
    /next\.config|middleware\.(ts|js)|helmet|vercel\.json|wrangler/.test(f.path),
  );
  const content = configFiles.map((f) => f.content).join("\n");
  const hasHeaders =
    /headers\s*\(|Content-Security-Policy|X-Frame-Options|helmet|securityHeaders/i.test(
      content,
    ) ||
    ctx.files.some((f) =>
      /Content-Security-Policy|X-Frame-Options|Strict-Transport-Security/.test(f.content),
    );

  const configHit =
    ctx.files.find((f) => /next\.config\.(js|ts|mjs)$/.test(f.path)) ||
    ctx.files.find((f) => /middleware\.(ts|js)$/.test(f.path)) ||
    ctx.files.find((f) => f.path.endsWith("package.json"));

  if (!hasHeaders && configHit) {
    const line =
      findLine(configHit.content, /nextConfig|module\.exports|export default|middleware/) ??
      1;
    return [
      finding({
        title: "No security headers configuration found",
        description:
          "Missing CSP, X-Frame-Options, HSTS, etc. makes clickjacking and some XSS payloads easier.",
        severity: "medium",
        category: "production",
        file: configHit.path,
        line,
        evidence: snippet(configHit.content, line),
        recommendation:
          "Set security headers in next.config, middleware, or your reverse proxy (Cloudflare/Vercel).",
        ruleId: "prod.no-security-headers",
      }),
    ];
  }
  return [];
};

const debugModeRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  for (const file of ctx.files) {
    if (
      /DEBUG\s*=\s*True|app\.debug\s*=\s*True|NODE_ENV\s*=\s*['"]development['"]/.test(
        file.content,
      ) &&
      !file.path.includes(".example")
    ) {
      // only flag if looks like production config
      if (/docker|prod|config|settings|\.env/.test(file.path.toLowerCase())) {
        const line = findLine(file.content, /DEBUG\s*=\s*True|app\.debug|NODE_ENV/);
        findings.push(
          finding({
            title: "Debug / development mode may be enabled",
            description: "Debug mode can expose stack traces and internal details.",
            severity: "medium",
            category: "production",
            file: file.path,
            line,
            evidence: snippet(file.content, line),
            recommendation: "Ensure DEBUG is false and NODE_ENV=production in production deployments.",
            ruleId: "prod.debug-mode",
          }),
        );
      }
    }
  }
  return findings;
};

const adminRouteRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  for (const file of ctx.files) {
    if (!/admin/i.test(file.path)) continue;
    const hasAuth =
      /getServerSession|requireAuth|role|admin|isAdmin|clerk|getUser|authorize/i.test(
        file.content,
      );
    if (!hasAuth && /export\s+(default|async|const|function)/.test(file.content)) {
      findings.push(
        finding({
          title: "Admin surface may lack authorization checks",
          description: "Admin-related files should enforce role-based access, not just obscurity.",
          severity: "high",
          category: "auth",
          file: file.path,
          recommendation: "Gate admin routes with role checks server-side. Never rely on hidden URLs alone.",
          ruleId: "auth.admin-unprotected",
        }),
      );
    }
  }
  return findings;
};

const dependencyRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  const pkgFile = ctx.files.find((f) => f.path.endsWith("package.json"));
  if (!pkgFile || !ctx.packageJson) return findings;

  const deps = {
    ...((ctx.packageJson.dependencies as Record<string, string>) ?? {}),
    ...((ctx.packageJson.devDependencies as Record<string, string>) ?? {}),
  };

  // Heuristic: very old major patterns or missing security-related packages for express apps
  if (deps.express && !deps["helmet"] && !deps["express-rate-limit"]) {
    findings.push(
      finding({
        title: "Express app missing common security middleware",
        description: "Express detected without helmet or express-rate-limit.",
        severity: "medium",
        category: "dependencies",
        file: pkgFile.path,
        recommendation: "Add helmet and express-rate-limit (or equivalent edge protections).",
        ruleId: "deps.express-security",
      }),
    );
  }

  if (deps.next && !deps.zod && !deps.yup && !deps.joi) {
    // check if any validation exists in code
    const hasValidation = ctx.files.some((f) =>
      /z\.object|yup\.|joi\.|safeParse|validate\(/.test(f.content),
    );
    if (!hasValidation) {
      findings.push(
        finding({
          title: "No input validation library detected",
          description:
            "AI-generated APIs often trust request bodies. Missing schema validation leads to crashes and injection bugs.",
          severity: "medium",
          category: "best-practices",
          recommendation: "Validate all external input with Zod (or similar) before use.",
          ruleId: "deps.no-validation",
        }),
      );
    }
  }

  // package.json scripts missing lint/test
  const scripts = (ctx.packageJson.scripts as Record<string, string>) ?? {};
  if (!scripts.test && !scripts.lint) {
    findings.push(
      finding({
        title: "No test or lint scripts in package.json",
        description: "Without lint/tests, regressions and obvious bugs ship silently.",
        severity: "low",
        category: "best-practices",
        file: pkgFile.path,
        recommendation: "Add at least eslint and a minimal test script; run them in CI.",
        ruleId: "deps.no-quality-scripts",
      }),
    );
  }

  return findings;
};

const httpsWebhookRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  for (const file of ctx.files) {
    if (/webhook/i.test(file.path) || /webhook/i.test(file.content)) {
      const hasVerify =
        /stripe\.webhooks|constructEvent|x-hub-signature|timingSafeEqual|verify.*signature|svix/i.test(
          file.content,
        );
      if (
        /export\s+(async\s+)?function\s+POST|router\.post|\.post\(/.test(file.content) &&
        !hasVerify
      ) {
        findings.push(
          finding({
            title: "Webhook handler may not verify signatures",
            description:
              "Unverified webhooks let attackers forge billing events, user updates, or other side effects.",
            severity: "high",
            category: "auth",
            file: file.path,
            recommendation: "Verify provider signatures (Stripe, GitHub, Svix, etc.) before processing.",
            ruleId: "auth.webhook-no-verify",
          }),
        );
      }
    }
  }
  return findings;
};

const clientSecretRule: Rule = (ctx) => {
  const findings: Finding[] = [];
  for (const file of ctx.files) {
    if (isNoisePath(file.path)) continue;
    if (!/\.(tsx|jsx|ts|js)$/.test(file.path)) continue;
    // Next.js public env
    if (/NEXT_PUBLIC_.*(SECRET|PRIVATE|SERVICE_ROLE|API_KEY)/i.test(file.content)) {
      const line = findLine(file.content, /NEXT_PUBLIC_.*(SECRET|PRIVATE|SERVICE_ROLE|API_KEY)/i);
      findings.push(
        finding({
          title: "Secret-like value exposed to the client",
          description:
            "NEXT_PUBLIC_ variables are bundled into the browser. Service roles and private API keys must never be public.",
          severity: "critical",
          category: "secrets",
          file: file.path,
          line,
          evidence: snippet(file.content, line),
          recommendation:
            "Remove the NEXT_PUBLIC_ prefix. Call privileged APIs only from server routes or edge functions.",
          ruleId: "secrets.client-exposed",
        }),
      );
    }
  }
  return findings;
};

const ALL_RULES: Rule[] = [
  secretsRule,
  clientSecretRule,
  rateLimitRule,
  corsRule,
  authOnApiRule,
  injectionRule,
  gitignoreRule,
  envExampleRule,
  errorHandlingRule,
  securityHeadersRule,
  debugModeRule,
  adminRouteRule,
  dependencyRule,
  httpsWebhookRule,
];

export function runRules(files: RepoFile[]): Finding[] {
  let packageJson: Record<string, unknown> | undefined;
  const pkg = files.find((f) => f.path.endsWith("package.json"));
  if (pkg) {
    try {
      packageJson = JSON.parse(pkg.content) as Record<string, unknown>;
    } catch {
      packageJson = undefined;
    }
  }

  const fileMap = new Map(files.map((f) => [f.path, f.content]));
  const ctx: RuleContext = { files, packageJson, fileMap };

  const findings = ALL_RULES.flatMap((rule) => {
    try {
      return rule(ctx);
    } catch {
      return [];
    }
  });

  // Deduplicate by ruleId + file
  const seen = new Set<string>();
  const deduped = findings.filter((f) => {
    const key = `${f.ruleId}:${f.file ?? ""}:${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Cap identical rule spam in the report UI (scoring already diminishes)
  const perRule = new Map<string, number>();
  return deduped.filter((f) => {
    const n = perRule.get(f.ruleId) ?? 0;
    if (n >= 5) return false;
    perRule.set(f.ruleId, n + 1);
    return true;
  });
}
