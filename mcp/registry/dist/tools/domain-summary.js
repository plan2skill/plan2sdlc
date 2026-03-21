import { queryAll, rowToEntity } from '../db.js';
export function registryDomainSummary(domain) {
    const rows = queryAll('SELECT * FROM entity WHERE domain = ? AND is_current = 1 ORDER BY entity_type, name', [domain]);
    return rows.map(rowToEntity);
}
//# sourceMappingURL=domain-summary.js.map