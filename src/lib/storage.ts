import type { ScanReport } from "./types";
import { nanoid } from "nanoid";
import { promises as fs } from "fs";
import path from "path";

/**
 * Storage abstraction.
 * - Default: file-backed (survives server restarts for demos)
 * - Optional: memory / Cloudflare D1
 */

export interface ReportStore {
  save(report: ScanReport): Promise<void>;
  get(id: string): Promise<ScanReport | null>;
  list(limit?: number): Promise<ScanReport[]>;
}

const globalStore = globalThis as unknown as {
  __shipcheckReports?: Map<string, ScanReport>;
};

function memoryMap(): Map<string, ScanReport> {
  if (!globalStore.__shipcheckReports) {
    globalStore.__shipcheckReports = new Map();
  }
  return globalStore.__shipcheckReports;
}

const DATA_DIR = path.join(process.cwd(), ".data", "reports");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

class FileStore implements ReportStore {
  async save(report: ScanReport): Promise<void> {
    memoryMap().set(report.id, report);
    try {
      await ensureDir();
      await fs.writeFile(
        path.join(DATA_DIR, `${report.id}.json`),
        JSON.stringify(report),
        "utf8",
      );
    } catch {
      // memory still holds it for this process
    }
  }

  async get(id: string): Promise<ScanReport | null> {
    const mem = memoryMap().get(id);
    if (mem) return mem;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
      const report = JSON.parse(raw) as ScanReport;
      memoryMap().set(id, report);
      return report;
    } catch {
      return null;
    }
  }

  async list(limit = 20): Promise<ScanReport[]> {
    try {
      await ensureDir();
      const files = await fs.readdir(DATA_DIR);
      const reports: ScanReport[] = [];
      for (const file of files.filter((f) => f.endsWith(".json")).slice(0, limit * 2)) {
        try {
          const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
          reports.push(JSON.parse(raw) as ScanReport);
        } catch {
          /* skip */
        }
      }
      return reports
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    } catch {
      return Array.from(memoryMap().values())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    }
  }
}

class MemoryStore implements ReportStore {
  async save(report: ScanReport): Promise<void> {
    memoryMap().set(report.id, report);
  }

  async get(id: string): Promise<ScanReport | null> {
    return memoryMap().get(id) ?? null;
  }

  async list(limit = 20): Promise<ScanReport[]> {
    return Array.from(memoryMap().values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

class D1Store implements ReportStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: any) {}

  async save(report: ScanReport): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO scans (id, created_at, repo_url, owner, repo, score, grade, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, score = excluded.score`,
      )
      .bind(
        report.id,
        report.createdAt,
        report.repoUrl,
        report.repo.owner,
        report.repo.repo,
        report.score.overall,
        report.score.grade,
        JSON.stringify(report),
      )
      .run();
  }

  async get(id: string): Promise<ScanReport | null> {
    const row = await this.db
      .prepare(`SELECT payload FROM scans WHERE id = ?`)
      .bind(id)
      .first();
    if (!row?.payload) return null;
    return JSON.parse(row.payload as string) as ScanReport;
  }

  async list(limit = 20): Promise<ScanReport[]> {
    const { results } = await this.db
      .prepare(`SELECT payload FROM scans ORDER BY created_at DESC LIMIT ?`)
      .bind(limit)
      .all();
    return (results ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => JSON.parse(r.payload as string) as ScanReport,
    );
  }
}

let store: ReportStore | null = null;

export function getStore(): ReportStore {
  if (store) return store;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d1 = (process.env as any).DB ?? (globalThis as any).DB;
  if (process.env.STORAGE_BACKEND === "d1" && d1) {
    store = new D1Store(d1);
  } else if (process.env.STORAGE_BACKEND === "memory") {
    store = new MemoryStore();
  } else {
    store = new FileStore();
  }
  return store;
}

export function newReportId(): string {
  return nanoid(12);
}
