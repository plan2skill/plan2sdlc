import { queryAll, rowToEntity } from '../db.js';
import type { EntityType, EntityRecord } from '../types.js';

/**
 * LIKE-based search across name, purpose, and decisions.
 * PoC replacement for FTS5 (not available in sql.js WASM).
 */
export function registrySearch(
  query: string,
  entityType?: EntityType,
  limit: number = 20,
): EntityRecord[] {
  const pattern = `%${query}%`;
  let sql: string;
  let params: (string | number | null)[];

  if (entityType) {
    sql = `SELECT * FROM entity
           WHERE is_current = 1 AND entity_type = ?
             AND (name LIKE ? OR purpose LIKE ? OR decisions LIKE ?)
           LIMIT ?`;
    params = [entityType, pattern, pattern, pattern, limit];
  } else {
    sql = `SELECT * FROM entity
           WHERE is_current = 1
             AND (name LIKE ? OR purpose LIKE ? OR decisions LIKE ?)
           LIMIT ?`;
    params = [pattern, pattern, pattern, limit];
  }

  const rows = queryAll(sql, params);
  return rows.map(rowToEntity);
}
