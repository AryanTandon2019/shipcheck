export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type IssueCategory =
  | "secrets"
  | "auth"
  | "api"
  | "injection"
  | "config"
  | "dependencies"
  | "best-practices"
  | "production";

export type Effort = "15 min" | "1 hour" | "1 day";
export type Confidence = "high" | "medium" | "low";

export type StackFramework =
  | "nextjs-app"
  | "nextjs-pages"
  | "express"
  | "cloudflare"
  | "supabase"
  | "generic";

export interface StackInfo {
  framework: StackFramework;
  label: string;
  badges: string[];
  fixHints: string[];
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: IssueCategory;
  file?: string;
  line?: number;
  evidence?: string;
  recommendation: string;
  ruleId: string;
  simpleExplain?: string;
  businessImpact?: string;
  analogy?: string;
  /** Concrete attack path for this app */
  attackPath?: string;
  confidence?: Confidence;
  effort?: Effort;
}

export interface ScanRequest {
  repoUrl: string;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string | null;
  stars: number;
  language: string | null;
  htmlUrl: string;
  scannedFiles: number;
  totalFiles: number;
  /** Present when scan used authenticated access */
  private?: boolean;
}

export interface ScanScore {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: {
    security: number;
    production: number;
    bestPractices: number;
  };
}

export interface FixPatch {
  findingId: string;
  title: string;
  language: string;
  code: string;
  explanation: string;
  stackLabel?: string;
}

export interface ShipScenario {
  headline: string;
  story: string;
  blastRadius: string[];
  first72Hours: string[];
  founderMove: string;
}

/** Projected score if top fixable issues are resolved */
export interface ProofOfFix {
  beforeScore: number;
  beforeGrade: string;
  afterScore: number;
  afterGrade: string;
  criticalBefore: number;
  criticalAfter: number;
  highBefore: number;
  highAfter: number;
  resolvedTitles: string[];
  /** High/critical titles still open after projected fixes */
  remainingTitles: string[];
  summaryLines: string[];
}

export interface FounderBrief {
  canShip: boolean;
  decision: string;
  topRisks: string[];
  fixFirst: string[];
  efforts: Array<{ title: string; effort: Effort }>;
  cofounderMessage: string;
}

export interface ScanReport {
  id: string;
  createdAt: string;
  repoUrl: string;
  repo: RepoMeta;
  score: ScanScore;
  findings: Finding[];
  summary: string;
  vibeCoderRoast: string;
  stack?: StackInfo;
  fixPatches?: FixPatch[];
  shipScenario?: ShipScenario;
  launchChecklist?: string[];
  proofOfFix?: ProofOfFix;
  founderBrief?: FounderBrief;
  status: "completed" | "failed" | "running";
  error?: string;
}

export interface RepoFile {
  path: string;
  content: string;
}
