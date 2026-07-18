import type { RepoFile, RepoMeta } from "./types";

const GITHUB_API = "https://api.github.com";

const INTERESTING_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".env",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".md",
  ".prisma",
  ".sql",
]);

const INTERESTING_NAMES = new Set([
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "middleware.ts",
  "middleware.js",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  ".env",
  ".env.example",
  ".env.local",
  ".gitignore",
  "wrangler.toml",
  "wrangler.jsonc",
  "vercel.json",
  "auth.ts",
  "auth.js",
]);

const MAX_FILES = 60;
const MAX_FILE_SIZE = 120_000;

export type GhAuth = { token?: string | null };

function authHeaders(auth?: GhAuth): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ShipCheck-Scanner",
  };
  const token = auth?.token || process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function ghFetch(path: string, auth?: GhAuth): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: authHeaders(auth),
    next: { revalidate: 0 },
  });
}

export interface UserRepoItem {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
  htmlUrl: string;
  defaultBranch: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

/** List repos the authenticated user can access (public + private). */
export async function listUserRepos(
  token: string,
  opts?: { page?: number; perPage?: number; query?: string },
): Promise<{ repos: UserRepoItem[]; hasMore: boolean }> {
  const page = opts?.page ?? 1;
  const perPage = Math.min(opts?.perPage ?? 50, 100);
  const q = (opts?.query ?? "").trim().toLowerCase();

  // affiliation covers owned + collaborator + org memberships
  const res = await fetch(
    `${GITHUB_API}/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
    {
      headers: authHeaders({ token }),
      next: { revalidate: 0 },
    },
  );

  if (res.status === 401) {
    throw new Error("GitHub session expired. Connect GitHub again.");
  }
  if (!res.ok) {
    throw new Error(`Could not list repositories (${res.status}).`);
  }

  const data = (await res.json()) as Array<{
    id: number;
    full_name: string;
    name: string;
    private: boolean;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    updated_at: string;
    html_url: string;
    default_branch: string;
    owner: { login: string };
    permissions?: { admin?: boolean; push?: boolean; pull?: boolean };
  }>;

  let repos: UserRepoItem[] = data.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    owner: r.owner.login,
    name: r.name,
    private: r.private,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    updatedAt: r.updated_at,
    htmlUrl: r.html_url,
    defaultBranch: r.default_branch,
    permissions: {
      admin: Boolean(r.permissions?.admin),
      push: Boolean(r.permissions?.push),
      pull: Boolean(r.permissions?.pull ?? true),
    },
  }));

  if (q) {
    repos = repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.language ?? "").toLowerCase().includes(q),
    );
  }

  // hasMore: if we got a full page from API (before client filter), more pages exist
  const hasMore = data.length === perPage;

  return { repos, hasMore };
}

export async function fetchRepoMeta(
  owner: string,
  repo: string,
  auth?: GhAuth,
): Promise<RepoMeta> {
  const res = await ghFetch(`/repos/${owner}/${repo}`, auth);
  if (res.status === 404) {
    throw new Error(
      auth?.token
        ? "Repository not found or you don’t have access."
        : "Repository not found. Connect GitHub for private repos, or check the URL.",
    );
  }
  if (res.status === 403) {
    throw new Error(
      "GitHub rate limit or access denied. Connect GitHub and try again.",
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}). Try again in a moment.`);
  }

  const data = (await res.json()) as {
    default_branch: string;
    description: string | null;
    stargazers_count: number;
    language: string | null;
    html_url: string;
    private: boolean;
  };

  // Private only allowed with a user token
  if (data.private && !auth?.token) {
    throw new Error(
      "This is a private repository. Connect GitHub first, then pick it from your repo list.",
    );
  }

  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
    htmlUrl: data.html_url,
    scannedFiles: 0,
    totalFiles: 0,
    private: data.private,
  };
}

function shouldScanFile(path: string): boolean {
  const lower = path.toLowerCase();
  const base = lower.split("/").pop() ?? lower;

  if (
    lower.includes("node_modules/") ||
    lower.includes(".git/") ||
    lower.includes("dist/") ||
    lower.includes("build/") ||
    lower.includes(".next/") ||
    lower.includes("coverage/") ||
    lower.includes("vendor/") ||
    lower.includes("package-lock.json") ||
    lower.includes("pnpm-lock.yaml") ||
    lower.includes("yarn.lock")
  ) {
    return false;
  }

  if (INTERESTING_NAMES.has(base)) return true;

  const ext = base.includes(".") ? `.${base.split(".").pop()}` : "";
  return INTERESTING_EXTENSIONS.has(ext);
}

function priority(path: string): number {
  const lower = path.toLowerCase();
  if (lower === ".gitignore") return -2;
  if (lower === "package.json") return -1;
  if (lower.includes(".env.example") || lower.includes(".env.sample")) return 0;
  if (lower.includes(".env") && !lower.includes("example")) return 1;
  if (lower.includes("middleware")) return 2;
  if (/\.(test|spec)\./.test(lower)) return 20;
  if (lower.includes("/api/") && (lower.endsWith("route.ts") || lower.endsWith("route.js")))
    return 3;
  if (lower.includes("auth")) return 4;
  if (lower.endsWith("package.json")) return 5;
  if (lower.includes("config")) return 6;
  return 10;
}

async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  auth?: GhAuth,
): Promise<string | null> {
  // Prefer Contents API when authenticated (works for private repos)
  if (auth?.token) {
    try {
      const res = await ghFetch(
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`,
        auth,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        encoding?: string;
        content?: string;
        size?: number;
      };
      if (data.encoding === "base64" && data.content) {
        const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
          "utf8",
        );
        if (content.includes("\u0000")) return null;
        if (content.length > MAX_FILE_SIZE) return null;
        return content;
      }
    } catch {
      return null;
    }
  }

  // Public raw fallback
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      { headers: { "User-Agent": "ShipCheck-Scanner" } },
    );
    if (!res.ok) return null;
    const content = await res.text();
    if (content.length > MAX_FILE_SIZE || content.includes("\u0000")) return null;
    return content;
  } catch {
    return null;
  }
}

export async function fetchRepoFiles(
  owner: string,
  repo: string,
  branch: string,
  auth?: GhAuth,
): Promise<{ files: RepoFile[]; totalFiles: number }> {
  const treeRes = await ghFetch(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    auth,
  );

  if (!treeRes.ok) {
    throw new Error("Could not read repository file tree.");
  }

  const treeData = (await treeRes.json()) as {
    tree: Array<{ path: string; type: string; size?: number; url: string }>;
    truncated: boolean;
  };

  const blobs = treeData.tree.filter((t) => t.type === "blob");
  const candidates = blobs
    .filter((t) => shouldScanFile(t.path) && (t.size ?? 0) < MAX_FILE_SIZE)
    .sort((a, b) => priority(a.path) - priority(b.path))
    .slice(0, MAX_FILES);

  const files: RepoFile[] = [];
  const concurrency = auth?.token ? 6 : 8;

  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (item) => {
        const content = await fetchFileContent(
          owner,
          repo,
          branch,
          item.path,
          auth,
        );
        if (!content) return null;
        return { path: item.path, content } satisfies RepoFile;
      }),
    );
    for (const r of results) {
      if (r) files.push(r);
    }
  }

  return { files, totalFiles: blobs.length };
}
