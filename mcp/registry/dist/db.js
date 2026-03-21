import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { initializeDatabase } from './schema.js';
let db = null;
let dbPath = null;
/**
 * Open (or create) a SQLite database.
 * Pass ':memory:' for in-memory (tests).
 */
export async function openDatabase(path) {
    const SQL = await initSqlJs();
    if (path === ':memory:') {
        db = new SQL.Database();
    }
    else {
        dbPath = path;
        const dir = dirname(path);
        if (!existsSync(dir))
            mkdirSync(dir, { recursive: true });
        if (existsSync(path)) {
            const buffer = readFileSync(path);
            db = new SQL.Database(buffer);
        }
        else {
            db = new SQL.Database();
        }
    }
    initializeDatabase(db);
    return db;
}
export function getDb() {
    if (!db)
        throw new Error('Database not opened. Call openDatabase() first.');
    return db;
}
export function saveDatabase() {
    if (!db || !dbPath)
        return;
    const data = db.export();
    writeFileSync(dbPath, Buffer.from(data));
}
export function closeDatabase() {
    if (db) {
        saveDatabase();
        db.close();
        db = null;
        dbPath = null;
    }
}
/** Parse a row from SQLite into an EntityRecord with JSON fields expanded. */
export function rowToEntity(row) {
    return {
        id: row.id,
        entity_type: row.entity_type,
        name: row.name,
        path: row.path || null,
        purpose: row.purpose || null,
        domain: row.domain || null,
        dependencies: parseJsonArray(row.dependencies),
        decisions: parseJsonArray(row.decisions),
        last_task_id: row.last_task_id || null,
        valid_from: row.valid_from,
        valid_to: row.valid_to || null,
        is_current: row.is_current,
        created_at: row.created_at,
    };
}
function parseJsonArray(text) {
    if (!text)
        return [];
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
/** Run a SELECT and return rows as objects. */
export function queryAll(sql, params = []) {
    const stmt = getDb().prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}
/** Run an INSERT/UPDATE/DELETE. */
export function execute(sql, params = []) {
    getDb().run(sql, params);
}
//# sourceMappingURL=db.js.map