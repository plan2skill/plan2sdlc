import { type Database, type SqlValue } from 'sql.js';
import type { EntityRecord } from './types.js';
/**
 * Open (or create) a SQLite database.
 * Pass ':memory:' for in-memory (tests).
 */
export declare function openDatabase(path: string): Promise<Database>;
export declare function getDb(): Database;
export declare function saveDatabase(): void;
export declare function closeDatabase(): void;
/** Parse a row from SQLite into an EntityRecord with JSON fields expanded. */
export declare function rowToEntity(row: Record<string, unknown>): EntityRecord;
/** Run a SELECT and return rows as objects. */
export declare function queryAll(sql: string, params?: SqlValue[]): Record<string, unknown>[];
/** Run an INSERT/UPDATE/DELETE. */
export declare function execute(sql: string, params?: SqlValue[]): void;
