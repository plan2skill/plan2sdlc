import { queryAll, rowToEntity } from '../db.js';
import type { EntityRecord } from '../types.js';

export function registryDomainSummary(domain: string): EntityRecord[] {
  const rows = queryAll(
    'SELECT * FROM entity WHERE domain = ? AND is_current = 1 ORDER BY entity_type, name',
    [domain],
  );
  return rows.map(rowToEntity);
}
