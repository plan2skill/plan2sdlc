import { queryAll, execute, rowToEntity, saveDatabase } from '../db.js';
export function registryUpdate(entityType, name, changes, taskId) {
    // Find current record
    const existing = queryAll('SELECT * FROM entity WHERE entity_type = ? AND name = ? AND is_current = 1', [entityType, name]);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (existing.length > 0) {
        const old = rowToEntity(existing[0]);
        // Close current record (SCD2)
        execute('UPDATE entity SET is_current = 0, valid_to = ? WHERE id = ?', [now, old.id]);
        // Merge old values with changes
        const merged = {
            path: changes.path ?? old.path,
            purpose: changes.purpose ?? old.purpose,
            domain: changes.domain ?? old.domain,
            dependencies: JSON.stringify(changes.dependencies ?? old.dependencies),
            decisions: JSON.stringify(changes.decisions ?? old.decisions),
        };
        execute(`INSERT INTO entity (entity_type, name, path, purpose, domain, dependencies, decisions, last_task_id, valid_from, is_current)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [entityType, name, merged.path, merged.purpose, merged.domain, merged.dependencies, merged.decisions, taskId, now]);
    }
    else {
        // New entity
        execute(`INSERT INTO entity (entity_type, name, path, purpose, domain, dependencies, decisions, last_task_id, valid_from, is_current)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
            entityType, name,
            changes.path ?? null,
            changes.purpose ?? null,
            changes.domain ?? null,
            JSON.stringify(changes.dependencies ?? []),
            JSON.stringify(changes.decisions ?? []),
            taskId, now,
        ]);
    }
    saveDatabase();
    // Return the newly created record
    const newRows = queryAll('SELECT * FROM entity WHERE entity_type = ? AND name = ? AND is_current = 1', [entityType, name]);
    return rowToEntity(newRows[0]);
}
//# sourceMappingURL=update.js.map