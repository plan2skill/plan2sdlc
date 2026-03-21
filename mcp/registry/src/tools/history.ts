import { queryAll, rowToEntity } from '../db.js';
import type { EntityType, EntityRecord } from '../types.js';

export function registryHistory(entityType: EntityType, name: string): EntityRecord[] {
  const rows = queryAll(
    'SELECT * FROM entity WHERE entity_type = ? AND name = ? ORDER BY id DESC',
    [entityType, name],
  );
  return rows.map(rowToEntity);
}
