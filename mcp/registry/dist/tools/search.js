import { queryAll, rowToEntity } from '../db.js';
/**
 * LIKE-based search across name, purpose, and decisions.
 * PoC replacement for FTS5 (not available in sql.js WASM).
 */
export function registrySearch(query, entityType, limit = 20) {
    const pattern = `%${query}%`;
    let sql;
    let params;
    if (entityType) {
        sql = `SELECT * FROM entity
           WHERE is_current = 1 AND entity_type = ?
             AND (name LIKE ? OR purpose LIKE ? OR decisions LIKE ?)
           LIMIT ?`;
        params = [entityType, pattern, pattern, pattern, limit];
    }
    else {
        sql = `SELECT * FROM entity
           WHERE is_current = 1
             AND (name LIKE ? OR purpose LIKE ? OR decisions LIKE ?)
           LIMIT ?`;
        params = [pattern, pattern, pattern, limit];
    }
    const rows = queryAll(sql, params);
    return rows.map(rowToEntity);
}
//# sourceMappingURL=search.js.map