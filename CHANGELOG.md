# Changelog

All notable changes to the claude-sdlc plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-03-21

### Breaking Changes
- **Dispatcher rewritten** — now uses `@anthropic-ai/claude-agent-sdk` instead of `claude -p` CLI. Requires the SDK as a dependency.
- **Parallel execution** — tasks within a wave run simultaneously (up to 3 concurrent by default, configurable via `SDLC_MAX_CONCURRENCY`). Previous dispatcher was sequential only.
- **Git worktree per task** — each agent gets an isolated repo copy. Zero conflict between parallel agents. Worktrees are created in `.sdlc/worktrees/`, merged after wave completes, and cleaned up.

### Added
- `scripts/worktree.ts` — git worktree management (create, merge, remove, commit, prune)
- `scripts/dispatcher-legacy.ts` — backup of v2.2 sequential dispatcher for rollback
- `PlanTask.worktreePath` and `PlanTask.branch` fields for worktree tracking
- Wave-level merge strategy: fast-forward → auto-merge → conflict detection → HITL
- Concurrency limit (default 3) to avoid rate limiting
- Per-task abort controller with 10-minute timeout
- Per-task budget cap ($5 default via `maxBudgetUsd`)

### Changed
- Orchestrator prompt updated: EXECUTE section describes parallel worktree execution
- Plugin auto-update: orchestrator ships from plugin, not generated locally. Domain agents have version tags for migration detection.

### Rollback
```bash
git checkout v2.2.0  # full rollback to sequential dispatcher
```

## [2.2.0] - 2026-03-21

### Added
- **Deterministic code dispatcher** — Node.js script that spawns headless `claude -p` sessions per task instead of relying on LLM Agent tool dispatch. Solves the "orchestrator collapse" problem where the LLM bypasses delegation and writes code itself.
- **plan.json** — structured execution artifact produced by orchestrator, consumed by dispatcher. Machine-readable task specs with domain, agent, context, acceptance criteria.
- **`/sdlc execute` skill** — triggers the dispatcher, shows progress, supports resume after interruption.
- **Orchestrator source code guard** — PreToolUse hook blocks orchestrator from writing anything except `.sdlc/` and `docs/`. Uses `agent_type` from stdin JSON for reliable agent identification.
- **Boundary check module** — extracted reusable `git diff` boundary verification in `scripts/boundary-check.ts`.

### Changed
- **Orchestrator tools**: removed `Agent`, added `Write` (scoped to `.sdlc/` and `docs/` via hook). Orchestrator now produces plans, not dispatches.
- **Pipeline flow**: EXECUTE phase is now handled by deterministic code, not by LLM. Orchestrator does EXPLORE → PLAN (produces plan.json) → user runs /sdlc execute → REVIEW → MERGE.
- **Write guard**: now reads `agent_type` from hook stdin JSON (reliable) in addition to `CLAUDE_AGENT_NAME` env var (fallback).

### Architecture
- LLM does what it's good at: analysis, design, review
- Code does what it's good at: enforcing rules, dispatching, boundary checks
- Based on research: MetaGPT structured artifacts, Plan-and-Act (ICML 2025) physical separation, Devin VM isolation pattern

## [2.1.0] - 2026-03-21

### Added
- **Semantic Registry (PoC)** — SQLite-backed MCP server with SCD2 temporal tracking for code entities (files, endpoints, components, types, services). Tools: registry_lookup, registry_search, registry_update, registry_history, registry_domain_summary, registry_init_scan. Enabled by default, disable via `experimental.registry.enabled: false`.
- **Project Ledger** — `.sdlc/ledger.md` compact index (~150 lines max) + `.sdlc/ledger/` archive per release. Orchestrator reads ledger at session start for quick project context. MERGE appends entries, RELEASE archives and resets.
- **Execution Plan with sticky progress** — orchestrator creates TaskCreate checklist after PLAN stage, updates in real-time via TaskUpdate. Users see live progress bar in terminal.
- **Domain boundary check** — programmatic `git diff` verification after every EXECUTE, reverts out-of-domain changes automatically.
- **Agent color coding** — orchestrator (blue), developers (green), testers (yellow), architect (cyan), reviewer (red) for visual navigation in console.
- **Release notes flow** — full release session with changelog generation, release notes, version bump, ledger archival.

### Changed
- **Orchestrator redesign** — now performs all governance roles directly (explorer, architect, reviewer). Separate governance-architect and governance-reviewer agents are no longer dispatched as subagents; orchestrator acts in those roles itself.
- **Domain isolation model** — replaced non-functional `disallowedTools` path patterns with two-level approach: `tools` allowlist (platform-enforced) + prompt-based domain constraint with DOMAIN_VIOLATION escalation protocol.
- **Dispatch protocol** — orchestrator now pastes actual types/interfaces/contracts in dispatch messages instead of file references. Domain developers should not need to read outside their domain.
- Removed `maxTurns: 100` from orchestrator — was causing pipeline collapse in waves 2-5.

### Fixed
- **Secrets guard false positives** — no longer blocks heredoc/string content containing `.env`, no longer blocks reading its own source file. Narrowed `/secret/i` pattern to avoid matching plugin filenames.
- **Schema tests** — updated config schema tests to use `schemaVersion: 2`.
- **Hook tests** — updated to match actual v2 behavior (entry-check state injection, superpowers guard internalized blocking).

## [2.0.1] - 2026-03-21

### Fixed
- Write guard blocking `/sdlc init` bootstrap — allow all `.sdlc/` writes when `config.yaml` doesn't exist yet

## [2.0.0] - 2026-03-21

### Added
- Platform-enforced domain isolation via disallowedTools in agent frontmatter
- Subagent dispatch template with status protocol and TDD instructions
- Two-stage code review: spec compliance + 3-agent parallel quality review
- Confidence scoring (0-100, threshold >= 80) on all review agents
- 4-phase systematic debugging protocol in POST_MORTEM
- Wave-based task decomposition in PLAN with plan review subagent
- Quality rubric scoring (6 criteria, A-F grades) in RETRO
- Prompt-driven iterative execution (adapted from ralph-loop pattern)
- SessionStart state injection for orchestrator context
- Mermaid diagram support in BRAINSTORM for terminal visualization

### Changed
- Orchestrator is now dispatch-only (no superpowers integration table)
- All session skills rewritten as single-flow (no superpowers/fallback branching)
- REVIEW uses 3 agents (not 5): governance+coverage, bugs+security, domain boundary
- Superpowers guard simplified to block-all when SDLC active
- Config schema version bumped to 2 with execution settings

### Removed
- Superpowers integration table from orchestrator
- Per-skill superpowers toggles from config
- "With superpowers (preferred)" / "Without superpowers (fallback)" branching in all session skills
- Cost tracking in hooks (hooks can't access cost data)
- Express brainstorm server (deferred to v2.1)

## [0.5.0] - 2026-03-21

### Changed
- REVIEW v2 — two-stage review: spec compliance gate + 3-agent parallel quality review with confidence scoring (>= 80 threshold)
- PLAN v2 — wave-based task decomposition with plan review subagent
- POST_MORTEM v2 — 4-phase systematic debugging (root cause -> pattern -> hypothesis -> implementation)
- MERGE v2 — verification-before-completion pattern with fresh test runs
- BRAINSTORM v2 — structured flow with Mermaid diagrams, spec review subagent, anti-pattern lists

### Removed
- All "with superpowers / without superpowers" branching from session skills
- Cost tracking references from session skills
- Express brainstorm server references (deferred to v2.1)

## [0.4.0] - 2026-03-21

### Changed
- Orchestrator v2 — dispatch-only mode, removed superpowers integration table, added subagent dispatch protocol with status codes
- EXECUTE v2 — per-domain dispatch with TDD discipline and prompt-driven iterative retry (not Stop hook)

### Removed
- Superpowers integration table from orchestrator
- Cost tracking references from orchestrator and execute session
- "With/without superpowers" branching from execute session

## [0.3.0] - 2026-03-21

### Added
- SessionStart state injection — orchestrator receives SDLC context on startup (entry-check.cjs v2)
- Subagent dispatch template with TDD discipline, status protocol, self-review checklist
- Config schema v2 — execution settings (maxIterations, maxRetries), sharedPaths, generatedPaths
- RETRO v2 — quality rubric scoring (6 criteria, A-F grades per agent)
- v2 attribution for 5 adapted open-source patterns (THIRD_PARTY_NOTICES.md)

### Changed
- Superpowers guard simplified to block-all when SDLC active (165 → 34 lines)
- Config schema version bumped to 2

### Verified
- disallowedTools correctly wired in both domain-developer and domain-tester templates

## [0.1.1] - 2026-03-20

### Fixed
- Write guard blocking `/sdlc init` — skills without agent name can now write `.sdlc/` files
- Hooks renamed from `.js` to `.cjs` to fix ESM/CommonJS conflict
- Entry-check hook now detects uninitialized projects and prompts `/sdlc init`
- Plugin manifest: removed unrecognized fields, fixed agents format
- Critical bugs: backlog format, state.json format, handoff schema, cost domain aggregation, hardCap=0

### Added
- Privacy policy (PRIVACY.md)
- Schema versioning (schemaVersion: 1) for migration support
- Bash command inspection in secrets guard
- Per-file source attribution on all adapted agents
- Pre-dispatch cost estimate for M/L/XL tasks
- `.sdlc/` write protection for non-governance agents

## [0.1.0] - 2026-03-20

### Added
- `/sdlc init` — project bootstrap with ecosystem scan, domain mapping, agent selection
- `/sdlc dispatch` — task classification and session routing
- `/sdlc status` — backlog, active workflows, recent completions
- `/sdlc triage` — backlog prioritization
- `/sdlc retro` — retrospective with agent health review
- `/sdlc release` — version bump, changelog, tag
- `/sdlc hotfix` — emergency production fix bypass
- `/sdlc cost` — cost breakdown by session/domain/model
- `/sdlc team` — agent registry health and performance
- `/sdlc add-agent`, `/sdlc add-domain`, `/sdlc add-sme` — guided creation
- `/sdlc undo` — revert last plugin action
- `/sdlc uninstall` — clean removal with backup restore option
- 17 session types: QUICK_FIX, TRIAGE, BRAINSTORM, PLAN, EXECUTE, REVIEW, INTEGRATION_CHECK, MERGE, GAP_ANALYSIS, RETRO, POST_MORTEM, ARCHITECTURE_REVIEW, SECURITY_REVIEW, RELEASE, DOCS_SYNC, DEPENDENCY_AUDIT, ONBOARD, HOTFIX
- 57-agent catalog across 9 categories (governance, development, testing, design, product, business, specialists, consultants, bridges)
- 6-layer safety: tool restrictions, PreToolUse hooks (secrets guard, write guard, Bash inspection), permission modes, environment awareness, worktree isolation, git recovery
- Persistent state with schema versioning (.sdlc/ directory)
- Cost tracking with per-session and monthly budget controls
- Tech stack templates: NestJS monorepo, Next.js, Django, Express, React SPA, generic
- Project ecosystem integration: inherits existing conventions, never overrides
- Plugin interop: graceful degradation without superpowers/playwright/code-review plugins
- Pixel Agents visual dashboard integration (optional)
