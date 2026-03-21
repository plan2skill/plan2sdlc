import { queryAll, rowToEntity } from '../db.js';
export function registryLookup(entityType, name) {
    const rows = queryAll('SELECT * FROM entity WHERE entity_type = ? AND name = ? AND is_current = 1', [entityType, name]);
    return rows.length > 0 ? rowToEntity(rows[0]) : null;
}
//# sourceMappingURL=lookup.js.map