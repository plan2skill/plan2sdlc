import { execute, saveDatabase } from '../db.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.sdlc', '.claude']);
/** Recursively collect code files. */
function collectFiles(dir, results = []) {
    try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (!IGNORE_DIRS.has(entry.name)) {
                    collectFiles(join(dir, entry.name), results);
                }
            }
            else if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) {
                results.push(join(dir, entry.name));
            }
        }
    }
    catch { /* skip unreadable dirs */ }
    return results;
}
/** Infer domain from file path based on domain map. */
function inferDomain(filePath, domains) {
    const normalized = filePath.replace(/\\/g, '/');
    for (const d of domains) {
        if (normalized.startsWith(d.path.replace(/\\/g, '/'))) {
            return d.name;
        }
    }
    return null;
}
/** Simple regex-based entity extraction from file content. */
function extractEntities(filePath, content, relPath, domain) {
    const entities = [];
    // Services: export class *Service
    for (const match of content.matchAll(/export\s+class\s+(\w+Service)\b/g)) {
        entities.push({ type: 'service', name: match[1], purpose: null });
    }
    // Components: export function/const + JSX-like patterns (tsx only)
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        for (const match of content.matchAll(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/g)) {
            const name = match[1];
            if (name[0] === name[0].toUpperCase() && !name.endsWith('Service')) {
                entities.push({ type: 'component', name, purpose: null });
            }
        }
    }
    // Types/Interfaces: export interface/type
    for (const match of content.matchAll(/export\s+(?:interface|type)\s+(\w+)/g)) {
        entities.push({ type: 'type', name: match[1], purpose: null });
    }
    // Endpoints: common patterns
    // Hono/Express: app.get/post/put/delete('/path', ...)
    for (const match of content.matchAll(/\.\s*(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi)) {
        entities.push({ type: 'endpoint', name: `${match[1].toUpperCase()} ${match[2]}`, purpose: null });
    }
    // Decorators: @Get('/path'), @Post('/path')
    for (const match of content.matchAll(/@(Get|Post|Put|Patch|Delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) {
        entities.push({ type: 'endpoint', name: `${match[1].toUpperCase()} ${match[2]}`, purpose: null });
    }
    return entities.map((e) => ({ ...e, path: relPath, domain }));
}
export function registryInitScan(projectDir, domains = []) {
    const files = collectFiles(projectDir);
    const counts = {};
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let total = 0;
    for (const filePath of files) {
        const relPath = relative(projectDir, filePath).replace(/\\/g, '/');
        const domain = inferDomain(relPath, domains);
        // Register the file itself
        execute(`INSERT INTO entity (entity_type, name, path, domain, last_task_id, valid_from, is_current)
       VALUES ('file', ?, ?, ?, 'INIT', ?, 1)`, [relPath, relPath, domain, now]);
        counts['file'] = (counts['file'] || 0) + 1;
        total++;
        // Extract entities from content
        try {
            const content = readFileSync(filePath, 'utf-8');
            const entities = extractEntities(filePath, content, relPath, domain);
            for (const entity of entities) {
                execute(`INSERT INTO entity (entity_type, name, path, domain, purpose, last_task_id, valid_from, is_current)
           VALUES (?, ?, ?, ?, ?, 'INIT', ?, 1)`, [entity.type, entity.name, entity.path, entity.domain, entity.purpose, now]);
                counts[entity.type] = (counts[entity.type] || 0) + 1;
                total++;
            }
        }
        catch { /* skip unreadable files */ }
    }
    saveDatabase();
    return { entities_created: total, by_type: counts };
}
//# sourceMappingURL=init-scan.js.map