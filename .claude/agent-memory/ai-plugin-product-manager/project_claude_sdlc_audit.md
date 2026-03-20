---
name: claude-sdlc plugin product audit findings
description: Key product audit findings for the claude-sdlc plugin — gaps, risks, MVP recommendations, agent catalog analysis
type: project
---

# claude-sdlc Plugin Audit Findings (2026-03-20)

Initial product audit performed on the claude-sdlc plugin (plan2sdlc repo).

**Why:** First audit — establishes baseline product understanding for all future PM work on this plugin.

**How to apply:** Use these findings to anchor prioritization decisions, MVP scoping, and roadmap discussions.

## Key Facts

- 57-agent catalog across 7 categories (governance, development, testing, design, product, business, specialists, bridges, consultants)
- 17 session types in state machine chain (QUICK_FIX through CUSTOM)
- 3 core CLI commands (init, dispatch, status) plus 10+ utility commands
- 6-layer safety model: tool restrictions, hooks, permissions, env awareness, worktrees, git recovery
- Plugin installs via `claude plugin add`, initializes with `/sdlc init`

## Critical Product Gaps Found

1. No "hello world" success path — first task experience undefined
2. No upgrade/migration path for `.sdlc/` schema changes (mentioned in spec §10.3 but not implemented)
3. HITL design is monolithic — no tiered approval (quick approve vs. detailed review)
4. Business agents (marketing-specialist, pr-specialist, growth-analyst, content-strategist) are near-zero value for core developer workflow
5. CUSTOM session type is undefined — spec lists it but there is no skill for it
6. sdlc-release, sdlc-hotfix exist as skills but RELEASE and HOTFIX session chains are not fully specified
7. No error recovery guide for when orchestrator itself fails
8. CI/CD usage is mentioned as possible but the HITL model fundamentally conflicts with unattended automation

## MVP Recommendation

Core 5 for v0.1: init + dispatch + quick-fix/execute/review + status + cost tracking
Everything else is v0.2+

## Agent Catalog Assessment

Essential (cannot ship without): orchestrator, domain-developer, domain-tester, governance-architect, governance-reviewer, code-reviewer, devops, security-auditor, tech-lead

High value (ship in v0.1 if possible): e2e-tester, product-analyst, release-manager, tech-writer

Nice to have (v0.2): fullstack-dev, api-designer, db-migration, ai-prompt-eng, monitoring-specialist, i18n-specialist, performance-auditor

Questionable ROI (v0.3 or cut): ux-researcher, marketing-specialist, pr-specialist, growth-analyst, content-strategist, visual-regression-tester, cross-browser-tester, interaction-tester, visual-qa (5 testing agents overlap significantly), gamedev-sme, edtech-sme

## Biggest Product Risks

1. Complexity cliff: users who hit the first friction point will churn
2. LLM non-determinism in state machine routing — classification errors cascade
3. Cost unpredictability — users cannot predict what a task will cost before dispatch
4. Plugin ecosystem dependency — graceful degradation documented but not validated
5. Worktree conflicts with existing git workflows (rebase workflows, git worktree limits)
