export declare const ENTITY_TYPES: readonly ["file", "endpoint", "component", "type", "service"];
export type EntityType = (typeof ENTITY_TYPES)[number];
export interface EntityRecord {
    id: number;
    entity_type: EntityType;
    name: string;
    path: string | null;
    purpose: string | null;
    domain: string | null;
    dependencies: string[];
    decisions: string[];
    last_task_id: string | null;
    valid_from: string;
    valid_to: string | null;
    is_current: number;
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
