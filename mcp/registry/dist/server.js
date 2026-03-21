#!/usr/bin/env node
/**
 * SDLC Registry MCP Server
 *
 * Semantic project registry with SCD2 temporal tracking.
 * Experimental feature — toggle via .sdlc/config.yaml:
 *   experimental.registry.enabled: true
 */
import { openDatabase, closeDatabase } from './db.js';
import { registryLookup } from './tools/lookup.js';
import { registryUpdate } from './tools/update.js';
import { registryHistory } from './tools/history.js';
import { registrySearch } from './tools/search.js';
import { registryDomainSummary } from './tools/domain-summary.js';
import { registryInitScan } from './tools/init-scan.js';
import { ENTITY_TYPES } from './types.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
// ---------------------------------------------------------------------------
// Config check
// ---------------------------------------------------------------------------
function isRegistryEnabled() {
    const projectDir = process.env['SDLC_PROJECT_DIR'] || process.cwd();
    const configPath = join(projectDir, '.sdlc', 'config.yaml');
    if (!existsSync(configPath))
        return true; // enabled by default when no config
    try {
        const config = parseYaml(readFileSync(configPath, 'utf-8'));
        // Enabled by default — only disabled if explicitly set to false
        return config?.experimental?.registry?.enabled !== false;
    }
    catch {
        return true;
    }
}
// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------
const TOOLS = [
    {
        name: 'registry_lookup',
        description: 'Get the current record for a named entity',
        inputSchema: {
            type: 'object',
            properties: {
                entity_type: { type: 'string', enum: ENTITY_TYPES, description: 'Entity type' },
                name: { type: 'string', description: 'Entity name' },
            },
            required: ['entity_type', 'name'],
        },
    },
    {
        name: 'registry_search',
        description: 'Full-text search across entity names, purposes, and decisions',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query (FTS5 syntax)' },
                entity_type: { type: 'string', enum: ENTITY_TYPES, description: 'Optional filter' },
                limit: { type: 'number', description: 'Max results (default 20)' },
            },
            required: ['query'],
        },
    },
    {
        name: 'registry_update',
        description: 'Create or update an entity (SCD2 versioning — old version preserved)',
        inputSchema: {
            type: 'object',
            properties: {
                entity_type: { type: 'string', enum: ENTITY_TYPES },
                name: { type: 'string' },
                changes: {
                    type: 'object',
                    properties: {
                        path: { type: 'string' },
                        purpose: { type: 'string' },
                        domain: { type: 'string' },
                        dependencies: { type: 'array', items: { type: 'string' } },
                        decisions: { type: 'array', items: { type: 'string' } },
                    },
                },
                task_id: { type: 'string', description: 'SDLC task ID' },
            },
            required: ['entity_type', 'name', 'changes', 'task_id'],
        },
    },
    {
        name: 'registry_history',
        description: 'Get temporal history of an entity (all SCD2 versions)',
        inputSchema: {
            type: 'object',
            properties: {
                entity_type: { type: 'string', enum: ENTITY_TYPES },
                name: { type: 'string' },
            },
            required: ['entity_type', 'name'],
        },
    },
    {
        name: 'registry_domain_summary',
        description: 'List all current entities in a domain',
        inputSchema: {
            type: 'object',
            properties: {
                domain: { type: 'string', description: 'Domain name' },
            },
            required: ['domain'],
        },
    },
    {
        name: 'registry_init_scan',
        description: 'Auto-populate registry by scanning codebase (PoC heuristics)',
        inputSchema: {
            type: 'object',
            properties: {
                project_dir: { type: 'string', description: 'Project root path' },
                domains: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: { name: { type: 'string' }, path: { type: 'string' } },
                    },
                    description: 'Domain map',
                },
            },
            required: ['project_dir'],
        },
    },
];
// ---------------------------------------------------------------------------
// Tool dispatch
// ---------------------------------------------------------------------------
function handleToolCall(name, args) {
    switch (name) {
        case 'registry_lookup':
            return registryLookup(args.entity_type, args.name);
        case 'registry_search':
            return registrySearch(args.query, args.entity_type, args.limit ?? 20);
        case 'registry_update':
            return registryUpdate(args.entity_type, args.name, args.changes, args.task_id);
        case 'registry_history':
            return registryHistory(args.entity_type, args.name);
        case 'registry_domain_summary':
            return registryDomainSummary(args.domain);
        case 'registry_init_scan':
            return registryInitScan(args.project_dir, args.domains ?? []);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
// ---------------------------------------------------------------------------
// JSON-RPC over stdio
// ---------------------------------------------------------------------------
function respond(res) {
    const json = JSON.stringify(res);
    process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}
function handleMessage(msg) {
    const { id, method, params } = msg;
    switch (method) {
        case 'initialize':
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'sdlc-registry', version: '0.1.0' },
                },
            };
        case 'notifications/initialized':
            // No response needed for notifications
            return { jsonrpc: '2.0', id, result: null };
        case 'tools/list':
            return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
        case 'tools/call': {
            const toolName = params?.name;
            const toolArgs = params?.arguments ?? {};
            if (!enabled) {
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        content: [{
                                type: 'text',
                                text: 'Registry is disabled. Set experimental.registry.enabled: true in .sdlc/config.yaml',
                            }],
                    },
                };
            }
            try {
                const result = handleToolCall(toolName, toolArgs);
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    },
                };
            }
            catch (err) {
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        content: [{ type: 'text', text: `Error: ${err.message}` }],
                        isError: true,
                    },
                };
            }
        }
        default:
            return {
                jsonrpc: '2.0',
                id,
                error: { code: -32601, message: `Method not found: ${method}` },
            };
    }
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let enabled = false;
async function main() {
    enabled = isRegistryEnabled();
    const dbPath = process.env['REGISTRY_DB_PATH'] || ':memory:';
    if (enabled) {
        await openDatabase(dbPath);
    }
    // Parse JSON-RPC from stdin (Content-Length header framing)
    let buffer = '';
    let contentLength = -1;
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
        buffer += chunk;
        while (true) {
            if (contentLength === -1) {
                const headerEnd = buffer.indexOf('\r\n\r\n');
                if (headerEnd === -1)
                    break;
                const header = buffer.slice(0, headerEnd);
                const match = header.match(/Content-Length:\s*(\d+)/i);
                if (!match) {
                    buffer = buffer.slice(headerEnd + 4);
                    continue;
                }
                contentLength = parseInt(match[1], 10);
                buffer = buffer.slice(headerEnd + 4);
            }
            if (buffer.length < contentLength)
                break;
            const body = buffer.slice(0, contentLength);
            buffer = buffer.slice(contentLength);
            contentLength = -1;
            try {
                const msg = JSON.parse(body);
                const res = handleMessage(msg);
                if (res.id !== undefined)
                    respond(res);
            }
            catch (err) {
                respond({ jsonrpc: '2.0', id: null, error: { code: -32700, message: `Parse error: ${err.message}` } });
            }
        }
    });
    process.stdin.on('end', () => {
        closeDatabase();
        process.exit(0);
    });
    process.on('SIGTERM', () => { closeDatabase(); process.exit(0); });
    process.on('SIGINT', () => { closeDatabase(); process.exit(0); });
}
main().catch((err) => {
    process.stderr.write(`Registry MCP server failed: ${err.message}\n`);
    process.exit(1);
});
//# sourceMappingURL=server.js.map