import type { EntityType, EntityRecord } from '../types.js';
/**
 * LIKE-based search across name, purpose, and decisions.
 * PoC replacement for FTS5 (not available in sql.js WASM).
 */
export declare function registrySearch(query: string, entityType?: EntityType, limit?: number): EntityRecord[];
