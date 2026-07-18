-- Cloudflare D1 schema for ShipCheck (production path)
-- Apply: wrangler d1 execute shipcheck-db --file=./cloudflare/schema.sql

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_owner_repo ON scans(owner, repo);
