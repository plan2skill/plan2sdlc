import { queryAll, rowToEntity } from '../db.js';
import type { EntityType, EntityRecord } from '../types.js';

export function registryLookup(entityType: EntityType, name: string): EntityRecord | null {
  const rows = queryAll(
    'SELECT * FROM entity WHERE entity_type = ? AND name = ? AND is_current = 1',
    [entityType, name],
  );
  return rows.length > 0 ? rowToEntity(rows[0]) : null;
}
