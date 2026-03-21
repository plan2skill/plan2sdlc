import initSqlJs, { type Database, type SqlValue } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { initializeDatabase } from './schema.js';
import type { EntityRecord } from './types.js';

let db: Database | null = null;
let dbPath: string | null = null;

/**
 * Open (or create) a SQLite database.
 * Pass ':memory:' for in-memory (tests).
 */
export async function openDatabase(path: string): Promise<Database> {
  const SQL = await initSqlJs();

  if (path === ':memory:') {
    db = new SQL.Database();
  } else {
    dbPath = path;
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    if (existsSync(path)) {
      const buffer = readFileSync(path);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  }

  initializeDatabase(db);
  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('Database not opened. Call openDatabase() first.');
  return db;
}

export function saveDatabase(): void {
  if (!db || !dbPath) return;
  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data));
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    dbPath = null;
  }
}

/** Parse a row from SQLite into an EntityRecord with JSON fields expanded. */
export function rowToEntity(row: Record<string, unknown>): EntityRecord {
  return {
    id: row.id as number,
    entity_type: row.entity_type as EntityRecord['entity_type'],
    name: row.name as string,
    path: (row.path as string) || null,
    purpose: (row.purpose as string) || null,
    domain: (row.domain as string) || null,
    dependencies: parseJsonArray(row.dependencies as string),
    decisions: parseJsonArray(row.decisions as string),
    last_task_id: (row.last_task_id as string) || null,
    valid_from: row.valid_from as string,
    valid_to: (row.valid_to as string) || null,
    is_current: row.is_current as number,
    created_at: row.created_at as string,
  };
}

function parseJsonArray(text: string | null): string[] {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Run a SELECT and return rows as objects. */
export function queryAll(sql: string, params: SqlValue[] = []): Record<string, unknown>[] {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  const results: Record<string, unknown>[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/** Run an INSERT/UPDATE/DELETE. */
export function execute(sql: string, params: SqlValue[] = []): void {
  getDb().run(sql, params);
}
