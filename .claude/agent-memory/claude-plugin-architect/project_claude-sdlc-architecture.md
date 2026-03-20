---
name: claude-sdlc-architecture
description: Architecture overview of the claude-sdlc plugin — manifest, agents, hooks, services, schemas, session types
type: project
---

The claude-sdlc plugin at C:\plan2sdlc is a full SDLC governance plugin for Claude Code.

**Why:** This is the core project being developed — all architecture decisions should align with this understanding.

**How to apply:**
- 57 agents across 9 catalog categories: governance, development, testing, design, product, business, specialists, consultants, bridges
- 18 session types with chaining state machine
- 6 JSON schemas (backlog, state, config, registry, session-log, tech-debt)
- 3 hooks (entry-check, write-guard, secrets-guard)
- Service layer in src/services/ with 16 services
- 341 tests passing via Vitest
- Templates for 6 project types (nestjs-monorepo, nextjs-app, django, express-api, react-spa, generic)
- Agent templates with {{variable}} parameterization for domain-developer, domain-tester, governance-architect, governance-reviewer, qa-e2e-writer
- Plugin manifest at .claude-plugin/plugin.json with 16 user-invocable skills
