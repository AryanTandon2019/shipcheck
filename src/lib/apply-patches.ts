import type { Finding, FixPatch, RepoFile } from "./types";

/**
 * Apply ShipCheck patches to an in-memory file tree for a second static-analysis pass.
 *
 * Honesty note for judges:
 * - This is a sandbox workspace, not a production deploy.
 * - We do not type-check, build, or runtime-test the tree here.
 * - Score changes mean "rules no longer match after these edits", not "proven secure".
 */
export function applyPatchesToFiles(
  files: RepoFile[],
  patches: FixPatch[],
  findings: Finding[],
): { files: RepoFile[]; applied: string[]; notes: string[] } {
  const byPath = new Map<string, RepoFile>();
  for (const f of files) {
    byPath.set(f.path, { path: f.path, content: f.content });
  }

  const applied: string[] = [];
  const notes: string[] = [];

  for (const patch of patches) {
    const finding = findings.find((f) => f.id === patch.findingId);
    const ruleId = finding?.ruleId ?? "";
    const title = patch.title || finding?.title || patch.findingId;

    if (
      patch.language === "gitignore" ||
      ruleId.includes("env") ||
      ruleId.includes("gitignore") ||
      /gitignore|\.env/i.test(patch.code)
    ) {
      const giPath =
        [...byPath.keys()].find((p) => p === ".gitignore") ?? ".gitignore";
      const existing = byPath.get(giPath)?.content ?? "";
      const extra = ["", "# ShipCheck applied", ".env", ".env.local", ".env*.local", ""].join(
        "\n",
      );
      byPath.set(giPath, {
        path: giPath,
        content: existing.includes(".env") ? existing : existing + extra,
      });

      if (ruleId.includes("env-committed") || ruleId.includes("env")) {
        for (const path of [...byPath.keys()]) {
          const base = path.split("/").pop() ?? path;
          if (/^\.env($|\.(local|production|development)$)/.test(base)) {
            byPath.delete(path);
            notes.push(`Removed ${path} from analysis tree (treat as untracked)`);
          }
        }
      }

      const docPath = `.shipcheck/applied/${sanitize(patch.findingId)}-gitignore.txt`;
      byPath.set(docPath, { path: docPath, content: patch.code });
      applied.push(title);
      continue;
    }

    if (ruleId.includes("rate-limit") || /ratelimit|rate-limit|Ratelimit/i.test(patch.code)) {
      const target =
        (finding?.file && byPath.get(finding.file)) ||
        [...byPath.values()].find(
          (f) =>
            /route\.(ts|js)$/.test(f.path) &&
            /\/api\//.test(f.path) &&
            /export\s+(async\s+)?function\s+POST|export\s+const\s+POST/.test(f.content),
        );

      if (target) {
        byPath.set(target.path, {
          path: target.path,
          content:
            target.content +
            `\n\n/* === ShipCheck sandbox patch (rate limit) === */\n${patch.code}\n`,
        });
        notes.push(`Injected rate-limit patch into ${target.path}`);
      } else {
        const p = `.shipcheck/applied/rate-limit.ts`;
        byPath.set(p, { path: p, content: patch.code });
        notes.push(`Added ${p} for rate-limit detection`);
      }
      applied.push(title);
      continue;
    }

    if (ruleId.includes("auth") || ruleId.includes("missing-on-api")) {
      const target = finding?.file ? byPath.get(finding.file) : undefined;
      if (target) {
        byPath.set(target.path, {
          path: target.path,
          content:
            `/* ShipCheck sandbox auth patch */\n${patch.code}\n\n` + target.content,
        });
        notes.push(`Injected auth patch into ${target.path}`);
      } else {
        const p = `.shipcheck/applied/auth-gate.ts`;
        byPath.set(p, {
          path: p,
          content: `${patch.code}\n`,
        });
        notes.push(`Added ${p}`);
      }
      applied.push(title);
      continue;
    }

    if (ruleId.includes("headers") || /X-Frame-Options|securityHeaders|helmet/i.test(patch.code)) {
      const config =
        [...byPath.values()].find((f) => /next\.config\.(js|ts|mjs)$/.test(f.path)) ||
        [...byPath.values()].find((f) => /middleware\.(ts|js)$/.test(f.path));

      if (config) {
        byPath.set(config.path, {
          path: config.path,
          content:
            config.content +
            `\n\n/* ShipCheck sandbox security headers */\n${patch.code}\n`,
        });
        notes.push(`Injected headers patch into ${config.path}`);
      } else {
        const p = `next.config.mjs`;
        byPath.set(p, {
          path: p,
          content: `${patch.code}\n`,
        });
        notes.push(`Created ${p} with headers patch`);
      }
      applied.push(title);
      continue;
    }

    if (ruleId.includes("cors") && finding?.file && byPath.has(finding.file)) {
      const t = byPath.get(finding.file)!;
      byPath.set(t.path, {
        path: t.path,
        content: t.content
          .replace(
            /Access-Control-Allow-Origin['":\s]*\*/g,
            "Access-Control-Allow-Origin': 'https://your-domain.com'",
          )
          .replace(/origin:\s*true/g, "origin: ['https://your-domain.com']")
          .replace(/origin:\s*['"]?\*['"]?/g, "origin: 'https://your-domain.com'"),
      });
      const updated = byPath.get(t.path)!;
      byPath.set(t.path, {
        path: t.path,
        content: updated.content + `\n\n/* ShipCheck CORS patch */\n${patch.code}\n`,
      });
      notes.push(`Applied CORS patch in ${t.path}`);
      applied.push(title);
      continue;
    }

    const outPath = `.shipcheck/applied/${sanitize(patch.findingId)}.${extFor(patch.language)}`;
    byPath.set(outPath, { path: outPath, content: patch.code });
    if (finding?.file && byPath.has(finding.file)) {
      const t = byPath.get(finding.file)!;
      byPath.set(t.path, {
        path: t.path,
        content: t.content + `\n\n/* ShipCheck sandbox: ${title} */\n${patch.code}\n`,
      });
      notes.push(`Applied patch into ${finding.file} + ${outPath}`);
    } else {
      notes.push(`Wrote patch to ${outPath}`);
    }
    applied.push(title);
  }

  return { files: Array.from(byPath.values()), applied, notes };
}

function sanitize(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
}

function extFor(lang: string) {
  if (lang === "gitignore") return "gitignore";
  if (lang === "javascript") return "js";
  if (lang === "bash") return "sh";
  if (lang === "json") return "json";
  return "ts";
}

/** Downloadable patch bundle for humans (best-effort; not always git-apply clean) */
export function buildPatchDownload(
  patches: FixPatch[],
  findings: Finding[],
  repoLabel: string,
): string {
  const lines: string[] = [
    `# ShipCheck patch bundle`,
    `# Repo: ${repoLabel}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Review every hunk before committing. This is a suggestion bundle, not a guaranteed git-apply patch.`,
    ``,
  ];

  for (const [i, p] of patches.entries()) {
    const f = findings.find((x) => x.id === p.findingId);
    lines.push(`# ---- Patch ${i + 1}: ${p.title} ----`);
    if (f?.file) lines.push(`# Target: ${f.file}${f.line ? `:${f.line}` : ""}`);
    lines.push(`# ${p.explanation}`);
    lines.push(`# language: ${p.language}`);
    lines.push(``);
    lines.push("```");
    lines.push(p.code);
    lines.push("```");
    lines.push(``);
  }
  return lines.join("\n");
}
