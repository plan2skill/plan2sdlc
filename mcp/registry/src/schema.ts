import type { Database } from 'sql.js';

const DDL = `
CREATE TABLE IF NOT EXISTS entity (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type   TEXT NOT NULL CHECK(entity_type IN ('file','endpoint','component','type','service')),
  name          TEXT NOT NULL,
  path          TEXT,
  purpose       TEXT,
  domain        TEXT,
  dependencies  TEXT DEFAULT '[]',
  decisions     TEXT DEFAULT '[]',
  last_task_id  TEXT,
  valid_from    TEXT NOT NULL DEFAULT (datetime('now')),
  valid_to      TEXT,
  is_current    INTEGER NOT NULL DEFAULT 1 CHECK(is_current IN (0, 1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entity_current
  ON entity(entity_type, name, is_current)
  WHERE is_current = 1;

CREATE INDEX IF NOT EXISTS idx_entity_domain
  ON entity(domain, is_current)
  WHERE is_current = 1;

-- FTS5 not available in sql.js WASM build.
-- Search uses LIKE-based queries instead (sufficient for PoC scale).
-- If migrating to better-sqlite3 later, add FTS5 virtual table here.

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

INSERT OR IGNORE INTO meta(key, value) VALUES ('schema_version', '1');
`;

export function initializeDatabase(db: Database): void {
  db.run(DDL);
}
