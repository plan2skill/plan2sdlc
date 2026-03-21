export const ENTITY_TYPES = ['file', 'endpoint', 'component', 'type', 'service'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface EntityRecord {
  id: number;
  entity_type: EntityType;
  name: string;
  path: string | null;
  purpose: string | null;
  domain: string | null;
  dependencies: string[]; // stored as JSON text in SQLite
  decisions: string[];    // stored as JSON text in SQLite
  last_task_id: string | null;
  valid_from: string;
  valid_to: string | null;
  is_current: number; // 0 or 1
  created_at: string;
}

export interface EntityChanges {
  path?: string;
  purpose?: string;
  domain?: string;
  dependencies?: string[];
  decisions?: string[];
}

export interface DomainInfo {
  name: string;
  path: string;
}
