import OpenAI from "openai";
import type {
  Finding,
  FixPatch,
  RepoMeta,
  ScanScore,
  ShipScenario,
  StackInfo,
} from "./types";

function getClient(): OpenAI | null {
  const key = process.env.XAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!key) return null;

  const isXai = Boolean(process.env.XAI_API_KEY);
  return new OpenAI({
    apiKey: key,
    baseURL: isXai ? "https://api.x.ai/v1" : undefined,
  });
}

function getModel(): string {
  return (
    process.env.AI_MODEL ??
    (process.env.XAI_API_KEY ? "grok-4.5" : "gpt-4o-mini")
  );
}

function fallbackSummary(
  repo: RepoMeta,
  score: ScanScore,
  findings: Finding[],
): { summary: string; vibeCoderRoast: string } {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;

  const summary =
    critical + high === 0
      ? `${repo.owner}/${repo.repo} looks relatively solid from static checks (score ${score.overall}/100, grade ${score.grade}). Still review auth paths and dependency advisories before production traffic.`
      : `${repo.owner}/${repo.repo} scored ${score.overall}/100 (grade ${score.grade}) with ${critical} critical and ${high} high-severity issues. Top risks center on ${
          findings
            .slice(0, 3)
            .map((f) => f.title.toLowerCase())
            .join("; ") || "configuration gaps"
        }. Fix critical secrets and auth gaps before inviting real users.`;

  const roast =
    score.overall >= 85
      ? "Strong baseline. Re-check auth paths and dependency advisories before real traffic — the remaining risk is usually operational, not cosmetic."
      : score.overall >= 60
        ? "Feature velocity is ahead of production hardening. Prioritize secrets, authentication boundaries, and rate limits before inviting paying users."
        : "Not launch-ready. Critical gaps would expose data, budget, or both. Remediate red findings first; treat the demo as a prototype until then.";

  return { summary, vibeCoderRoast: roast };
}

function fallbackPatches(findings: Finding[], stack?: StackInfo): FixPatch[] {
  const fw = stack?.framework ?? "generic";
  return findings.slice(0, 3).map((f) => {
    let language = "text";
    let code = `# Fix: ${f.title}\n# ${f.recommendation}`;

    if (f.ruleId.includes("env") || f.ruleId.includes("gitignore") || f.category === "secrets") {
      language = "gitignore";
      code = `# .gitignore — keep real secrets out of git\n.env\n.env.local\n.env*.local\n\n# Commit only:\n# .env.example  (placeholders, never real keys)`;
    } else if (f.ruleId.includes("rate-limit")) {
      language = "typescript";
      if (fw === "express") {
        code = `// Express — framework-correct rate limit\nimport rateLimit from "express-rate-limit";\n\nexport const apiLimiter = rateLimit({\n  windowMs: 60_000,\n  max: 20,\n  standardHeaders: true,\n  legacyHeaders: false,\n});\n\n// app.use("/api", apiLimiter);\n// app.post("/api/generate", apiLimiter, handler);`;
      } else if (fw === "cloudflare") {
        code = `// Cloudflare — pair Worker logic with rate limiting rules\n// wrangler / dashboard: Security → Rate limiting rules\n// Example Worker guard (supplement, not full WAF):\nexport default {\n  async fetch(req: Request, env: Env) {\n    const ip = req.headers.get("cf-connecting-ip") ?? "anon";\n    const key = \`rl:\${ip}\`;\n    const n = Number((await env.KV.get(key)) ?? "0");\n    if (n > 30) return new Response("Too many requests", { status: 429 });\n    await env.KV.put(key, String(n + 1), { expirationTtl: 60 });\n    return handle(req, env);\n  },\n};`;
      } else {
        // Next.js default (App Router)
        code = `// Next.js App Router — Upstash rate limit (matches route handlers)\nimport { Ratelimit } from "@upstash/ratelimit";\nimport { Redis } from "@upstash/redis";\n\nconst ratelimit = new Ratelimit({\n  redis: Redis.fromEnv(),\n  limiter: Ratelimit.slidingWindow(10, "1 m"),\n});\n\nexport async function POST(req: Request) {\n  const ip = req.headers.get("x-forwarded-for") ?? "anon";\n  const { success } = await ratelimit.limit(ip);\n  if (!success) {\n    return Response.json({ error: "Too many requests" }, { status: 429 });\n  }\n  // ... expensive AI / business logic\n}`;
      }
    } else if (f.ruleId.includes("security-headers") || f.ruleId.includes("headers")) {
      language = fw === "express" ? "javascript" : "javascript";
      if (fw === "express") {
        code = `// Express — helmet\nimport helmet from "helmet";\napp.use(helmet());`;
      } else {
        code = `// next.config.mjs — security headers for Next.js\nconst securityHeaders = [\n  { key: "X-Frame-Options", value: "DENY" },\n  { key: "X-Content-Type-Options", value: "nosniff" },\n  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },\n];\n\n/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  async headers() {\n    return [{ source: "/:path*", headers: securityHeaders }];\n  },\n};\nexport default nextConfig;`;
      }
    } else if (f.category === "auth") {
      language = "typescript";
      if (fw === "express") {
        code = `// Express auth gate\nfunction requireAuth(req, res, next) {\n  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });\n  next();\n}\n\napp.post("/api/generate", requireAuth, handler);`;
      } else if (stack?.badges.includes("Supabase")) {
        code = `// Next.js + Supabase — never trust the client alone; verify session server-side\nimport { createServerClient } from "@supabase/ssr";\nimport { cookies } from "next/headers";\n\nexport async function POST() {\n  const supabase = createServerClient(/* cookie adapter */);\n  const { data: { user } } = await supabase.auth.getUser();\n  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });\n  // use user.id for row-level access; service_role stays server-only\n}`;
      } else {
        code = `// Next.js App Router — auth before expensive work\nimport { auth } from "@/auth"; // your session helper\n\nexport async function POST() {\n  const session = await auth();\n  if (!session?.user) {\n    return Response.json({ error: "Unauthorized" }, { status: 401 });\n  }\n  // ...handler\n}`;
      }
    }

    return {
      findingId: f.id,
      title: f.title,
      language,
      code,
      explanation: f.recommendation,
      stackLabel: stack?.label,
    };
  });
}

export async function generateNarrative(
  repo: RepoMeta,
  score: ScanScore,
  findings: Finding[],
): Promise<{ summary: string; vibeCoderRoast: string }> {
  const client = getClient();
  if (!client) {
    return fallbackSummary(repo, score, findings);
  }

  const top = findings.slice(0, 12).map((f) => ({
    severity: f.severity,
    title: f.title,
    file: f.file,
    category: f.category,
  }));

  try {
    const completion = await client.chat.completions.create({
      model: getModel(),
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are ShipCheck, a senior production-readiness auditor for modern web/SaaS apps (especially AI-scaffolded codebases).
Return strict JSON with keys: summary (2-3 sentences, calm and professional), vibeCoderRoast (1-2 sentences: candid analyst note — constructive, never meme-y or cruel).
Focus on shipping readiness and real exploit risk. No markdown, no hype language.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            repo: `${repo.owner}/${repo.repo}`,
            language: repo.language,
            score,
            findingCount: findings.length,
            findings: top,
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      summary?: string;
      vibeCoderRoast?: string;
    };

    if (!parsed.summary || !parsed.vibeCoderRoast) {
      return fallbackSummary(repo, score, findings);
    }

    return {
      summary: parsed.summary,
      vibeCoderRoast: parsed.vibeCoderRoast,
    };
  } catch {
    return fallbackSummary(repo, score, findings);
  }
}

/** Stack-aware, framework-correct patches — Ship Gate reasoning engine */
export async function generateFixPatches(
  repo: RepoMeta,
  findings: Finding[],
  stack?: StackInfo,
): Promise<FixPatch[]> {
  const top = findings.slice(0, 3);
  if (top.length === 0) return [];

  const client = getClient();
  if (!client) return fallbackPatches(top, stack);

  try {
    const completion = await client.chat.completions.create({
      model: getModel(),
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are ShipCheck's fix engineer inside an AI Ship Gate product.
Generate framework-CORRECT copy-paste fixes for the detected stack.
Return JSON: { "patches": [ { "findingId", "title", "language", "code", "explanation" } ] }

Stack rules (mandatory):
- nextjs-app / nextjs-pages: Next.js route handlers or pages/api — prefer @upstash/ratelimit, next.config headers, server session checks. NEVER suggest bare express-rate-limit unless stack is express.
- express: express-rate-limit, helmet, middleware auth
- cloudflare: Workers + KV / rate rules patterns
- supabase: server-side getUser, RLS notes, never expose service_role client-side
- generic: portable Node patterns

code: concise, real, production-oriented. explanation: 1 sentence.
Use provided findingIds. No markdown fences inside code strings.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            repo: `${repo.owner}/${repo.repo}`,
            stack: stack
              ? {
                  framework: stack.framework,
                  label: stack.label,
                  badges: stack.badges,
                  fixHints: stack.fixHints,
                }
              : { framework: "generic" },
            findings: top.map((f) => ({
              findingId: f.id,
              title: f.title,
              severity: f.severity,
              category: f.category,
              file: f.file,
              recommendation: f.recommendation,
              ruleId: f.ruleId,
              attackPath: f.attackPath,
            })),
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { patches?: FixPatch[] };
    const patches = parsed.patches ?? [];

    if (!Array.isArray(patches) || patches.length === 0) {
      return fallbackPatches(top, stack);
    }

    return patches
      .map((p, i) => ({
        findingId: p.findingId || top[i]?.id || `patch-${i}`,
        title: p.title || top[i]?.title || "Fix",
        language: p.language || "text",
        code: p.code || "",
        explanation: p.explanation || top[i]?.recommendation || "",
        stackLabel: stack?.label,
      }))
      .filter((p) => p.code.trim().length > 0);
  } catch {
    return fallbackPatches(top, stack);
  }
}

function fallbackScenario(
  repo: RepoMeta,
  score: ScanScore,
  findings: Finding[],
): ShipScenario {
  const top = findings.slice(0, 3).map((f) => f.title);
  const critical = findings.filter((f) => f.severity === "critical").length;

  if (findings.length === 0 || score.overall >= 85) {
    return {
      headline: "You could ship — with eyes open",
      story: `${repo.owner}/${repo.repo} looks relatively solid on static checks. The risk is usually the next feature you paste from an AI without re-running this audit.`,
      blastRadius: [
        "Low immediate blast radius from current findings",
        "Regression risk on new API / auth code",
        "Dependency CVEs still need separate monitoring",
      ],
      first72Hours: [
        "Keep ShipCheck (or CI checks) on every PR",
        "Lock down admin and AI endpoints first",
        "Rotate any keys ever pasted into chat or screenshots",
      ],
      founderMove:
        "Ship the demo, but treat production traffic as earned — not assumed.",
    };
  }

  return {
    headline:
      critical > 0
        ? "If you ship tonight, the failure mode is expensive"
        : "If you ship tonight, expect rough edges under real users",
    story: `${repo.owner}/${repo.repo} scores ${score.overall}/100. The first things an attacker or a curious user hits are usually the boring gaps: ${
      top.join("; ") || "auth, secrets, and open APIs"
    }. That is how demos become incidents.`,
    blastRadius: [
      critical > 0
        ? "Secrets or critical config may already be replayable from git history"
        : "Unprotected or weakly protected surfaces can be probed at scale",
      "AI / API routes without limits can burn budget in hours",
      "Trust dies faster than features ship — support load spikes on day one",
    ],
    first72Hours: [
      "Fix every critical finding before public launch traffic",
      "Add auth + rate limits on expensive endpoints",
      "Rotate keys, scrub .env from history if it was ever committed",
    ],
    founderMove:
      "Do not market “production ready” until the red items are gone — ship the story after the seatbelts.",
  };
}

/** Optional AI polish on top findings' plain-English fields */
export async function polishFindingsPlainEnglish(
  findings: Finding[],
): Promise<Finding[]> {
  const client = getClient();
  const top = findings.slice(0, 5);
  if (!client || top.length === 0) return findings;

  try {
    const completion = await client.chat.completions.create({
      model: getModel(),
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `Rewrite security findings for non-engineers.
Return JSON: { "items": [ { "id": string, "simpleExplain": string, "businessImpact": string, "analogy": string } ] }
Rules: short sentences, no jargon, no markdown, keep accurate, max 2 sentences per field for simpleExplain/businessImpact, analogy max 1 sentence. Use provided ids.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            findings: top.map((f) => ({
              id: f.id,
              title: f.title,
              description: f.description,
              recommendation: f.recommendation,
              severity: f.severity,
            })),
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      items?: Array<{
        id: string;
        simpleExplain?: string;
        businessImpact?: string;
        analogy?: string;
      }>;
    };
    const map = new Map((parsed.items ?? []).map((i) => [i.id, i]));
    return findings.map((f) => {
      const p = map.get(f.id);
      if (!p) return f;
      return {
        ...f,
        simpleExplain: p.simpleExplain || f.simpleExplain,
        businessImpact: p.businessImpact || f.businessImpact,
        analogy: p.analogy || f.analogy,
      };
    });
  } catch {
    return findings;
  }
}

/** Cinematic but practical risk story — big demo moment for judges */
export async function generateShipScenario(
  repo: RepoMeta,
  score: ScanScore,
  findings: Finding[],
): Promise<ShipScenario> {
  const client = getClient();
  if (!client) return fallbackScenario(repo, score, findings);

  const top = findings.slice(0, 6).map((f) => ({
    severity: f.severity,
    title: f.title,
    category: f.category,
    file: f.file,
  }));

  try {
    const completion = await client.chat.completions.create({
      model: getModel(),
      temperature: 0.55,
      messages: [
        {
          role: "system",
          content: `You are ShipCheck's AI Ship Gate — you decide if an AI-built app is safe enough to launch.
Write an ATTACK STORY for "If you ship tonight", not a bullet laundry list.
Return strict JSON:
{
  "headline": "short punchy line (max 12 words)",
  "story": "3-5 sentences: concrete attack path using the actual findings (endpoints, secrets, rate limits). Calm, specific, no gore, no hype words.",
  "blastRadius": ["3 short business-impact bullets e.g. OpenAI bill, customer data, downtime"],
  "first72Hours": ["3 ordered actions to raise the ship score"],
  "founderMove": "1 sentence ship / don't ship decision"
}
Be specific to findings (file names if present). No markdown.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            repo: `${repo.owner}/${repo.repo}`,
            language: repo.language,
            score,
            findings: top,
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<ShipScenario>;
    if (!parsed.headline || !parsed.story) {
      return fallbackScenario(repo, score, findings);
    }
    return {
      headline: parsed.headline,
      story: parsed.story,
      blastRadius:
        Array.isArray(parsed.blastRadius) && parsed.blastRadius.length
          ? parsed.blastRadius.slice(0, 4)
          : fallbackScenario(repo, score, findings).blastRadius,
      first72Hours:
        Array.isArray(parsed.first72Hours) && parsed.first72Hours.length
          ? parsed.first72Hours.slice(0, 4)
          : fallbackScenario(repo, score, findings).first72Hours,
      founderMove:
        parsed.founderMove ||
        fallbackScenario(repo, score, findings).founderMove,
    };
  } catch {
    return fallbackScenario(repo, score, findings);
  }
}

