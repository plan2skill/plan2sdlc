import { queryAll, rowToEntity } from '../db.js';
export function registryHistory(entityType, name) {
    const rows = queryAll('SELECT * FROM entity WHERE entity_type = ? AND name = ? ORDER BY id DESC', [entityType, name]);
    return rows.map(rowToEntity);
}
//# sourceMappingURL=history.js.map