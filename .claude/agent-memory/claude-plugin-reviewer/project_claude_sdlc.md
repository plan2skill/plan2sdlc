---
name: claude-sdlc plugin architecture and review findings
description: Key patterns, security issues, and conventions found during comprehensive review of the claude-sdlc plugin (2026-03-20)
type: project
---

## Architecture Patterns

**Hook return shapes:**
- PreToolUse blocking hooks: write `{ decision: 'block', reason: string }` to stdout, exit 2
- PreToolUse allow: exit 0 with no stdout
- SessionStart informational: write `{ result: string }` to stdout, exit 0
- All hooks read tool event from stdin as JSON `{ tool_name, tool_input }`

**State file layout:**
- `.sdlc/backlog.json` — flat array of BacklogItem (not wrapped in object)
- `.sdlc/state.json` — WorkflowState object with activeWorkflows, cadence, sessionQueue, domainLocks
- `.sdlc/history/*.json` — one SessionCostSummary per file, filename = `{timestamp}-{sessionType}-{workflowId}.json`
- `.sdlc/registry.yaml` — AgentRegistry with agents array

**handoff.ts critical issue:** Uses a non-schema `WorkflowStateWithHandoffs` interface that adds `handoffs` field directly to state.json. This field is NOT in state.schema.json and NOT in WorkflowState type. State saved via saveState() will contain this extra field which breaks schema validation and the state type contract.

**init.ts state.json mismatch:** generateConfig() writes `{ workflows: [], domainLocks: [] }` but the schema and TypeScript types expect `{ activeWorkflows: [], cadence: { mergesSinceRetro: 0 }, sessionQueue: [], domainLocks: {} }`. This is a critical schema violation.

**init.ts backlog.json mismatch:** generateConfig() writes `{ items: [] }` but the schema expects the file to be a bare array `[]` (schema type: array at root, not object).

**secrets-guard bypass:** The Bash tool is NOT in CHECKED_TOOLS, so `Bash: { command: 'cat .env' }` is explicitly allowed. This is documented/intentional but important to note. Also, the `secret` pattern is case-insensitive and broad — matches any file with "secret" anywhere in the path/name.

**write-guard bypass:** Guard only checks `.claude/` paths. It does NOT protect `.sdlc/` state files from non-governance agents. Domain agents can freely modify backlog.json, state.json, config.yaml.

**orchestrator permissionMode: bypassPermissions** — The orchestrator agent uses bypassPermissions, meaning it bypasses all user approval prompts. This is explicitly designed but is a significant security posture to document.

**resumeWorkflow() degraded team composition:** When resuming, composeTeam() is called with an empty registry `[]` and hardcoded classification (`complexity: 'M', domains: []`). The comment says "caller should enrich" but the interface does not enforce this. All callers get a degraded team if they don't re-compose.

**Cost tracker domain extraction:** generateCostReport() derives domain from the prefix of backlogItemId before the first hyphen. But backlogItemId uses format `TASK-001`, so the extracted "domain" is always `TASK`. This is a bug — byDomain report is meaningless.

**dequeueNext() comment mismatch:** The function comment says it "removes it from the queue if found" but `state.sessionQueue.shift()` mutates the state passed in as parameter, not the persisted state. It calls `saveState(sdlcDir, state)` correctly, but the parameter mutation is a side effect callers should be aware of.

## Security Findings

- hooks/sdlc-write-guard.js: CLAUDE_AGENT_NAME env is agent-supplied — Claude Code must guarantee this can't be spoofed by prompt injection for the guard to be meaningful
- hooks/sdlc-secrets-guard.js: Bash/Grep/mcp tools are not checked. An agent can use Bash to read any secret file. This is intentional for usability but should be documented as a known gap.
- orchestrator.md permissionMode: bypassPermissions is a significant capability — orchestrator can write any file without user approval

## Test Coverage Gaps

- No test for handoff.ts writeHandoff/readHandoff with the WorkflowStateWithHandoffs extension
- No test for cost tracker byDomain aggregation correctness (TASK prefix bug)
- No test for the init.ts state.json/backlog.json format mismatch
- hooks.test.ts: exitCode detection heuristic for exit code 2 is brittle

## Schema/Type Alignment

- backlog.schema.json: root is type:array — matches TypeScript `Backlog = BacklogItem[]` — CORRECT
- state.schema.json: matches WorkflowState type — CORRECT
- handoff.ts extends state with undocumented `handoffs` field — breaks schema validation
- generateConfig() initial state.json format is WRONG (wrong keys, array instead of object for domainLocks)
- generateConfig() initial backlog.json format is WRONG (wrapped in `{items:[]}` instead of bare array)

**Why:** These bugs would cause the plugin to fail on first use after /sdlc init because the generated files don't match what loadState() and loadBacklog() expect to parse.
**How to apply:** Any future init.ts review should verify generated file structures against schema and TypeScript types.
