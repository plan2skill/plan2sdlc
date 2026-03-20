---
name: post-mortem
description: 4-phase systematic debugging — root cause analysis scoped to domain
---

# POST_MORTEM Session

Systematic debugging using a 4-phase protocol. Investigation is scoped to the affected domain. Cross-domain issues escalate to the architect.

## Entry Criteria
- E2E tests red
- Integration failures 2x in a row
- Manual trigger after incident
- EXECUTE agent reported BLOCKED with test failures

## Process

### 1. Evidence Collection

Dispatch governance-tech-lead as subagent to collect:
- Failing test output (exact error messages, stack traces)
- Recent git log (`git log --oneline -20` — what changed recently?)
- Related code (files referenced in stack trace)
- Previous session logs from `.sdlc/history/` (was this area recently modified?)
- Domain map (which domain owns the failing code?)

### 2. Systematic Debugging (4-Phase Protocol)

Dispatch the appropriate domain-developer agent with this protocol:

    You are debugging a failure in the {domain_name} domain.

    ## Evidence
    {evidence_from_step_1}

    ## Phase 1: Root Cause Analysis
    1. Reproduce the failure: run the failing test or trigger the error
    2. Read the error output carefully — what EXACTLY fails?
    3. Trace backward: which line throws? What calls it? What data causes it?
    4. Identify the ROOT CAUSE, not the symptom
       - Symptom: "test times out"
       - Root cause: "async handler missing await on database call"

    Do NOT proceed to Phase 2 until you can state the root cause in one sentence.

    ## Phase 2: Pattern Analysis
    1. Is this an isolated bug or part of a pattern?
    2. Search for similar patterns in the codebase (grep for the anti-pattern)
    3. If pattern found: note all instances (they may need fixing too)

    ## Phase 3: Hypothesis
    State your fix hypothesis:
    "Changing {what} in {where} will fix {the root cause} because {why}"

    ## Phase 4: Implementation
    1. Write a regression test that reproduces the failure (RED)
    2. Run {test_command} — verify the test fails for the right reason
    3. Apply the fix
    4. Run {test_command} — verify the test passes
    5. Run full domain test suite — verify no regressions

    ## Domain Scope
    - Path: {domain_path}
    - Test command: {test_command}
    - You may READ files anywhere for investigation
    - You may only EDIT files within {domain_path}/

    ## Status Protocol
    - DONE — root cause found, fix applied, regression test added, all tests pass
    - DONE_WITH_CONCERNS — fixed but suspect related issues elsewhere (list them)
    - BLOCKED — cannot identify root cause or fix requires changes outside domain
    - DOMAIN_VIOLATION — root cause spans multiple domains (explain which domains and why)

### 3. Cross-Domain Handling

If agent reports DOMAIN_VIOLATION:
1. Dispatch governance-architect to analyze the cross-domain issue
2. Architect determines which domains need changes and in what order
3. Dispatch domain agents sequentially (dependency-ordered)
4. Each agent follows the same 4-phase protocol within its domain

### 4. Preventive Measures

After fix is applied, the tech-lead proposes:
- New tests to catch this class of bug
- Rule changes (additions to CLAUDE.md anti-patterns)
- Agent prompt improvements (if the agent caused the issue)
- Tech debt items for systemic issues (add to `.sdlc/tech-debt.json`)

HITL: user approves preventive measures.

### 5. Evidence Log

Write structured report to `.sdlc/history/post-mortem-{date}-{slug}.json`:
- Reproduction steps
- Root cause (one sentence)
- Pattern analysis results
- Fix hypothesis
- Fix description (files changed, what changed)
- Regression test path
- Preventive measures adopted

## Participants
- governance-tech-lead (mandatory, evidence collection)
- {domain}-developer (debugging and fix)
- governance-architect (only if cross-domain)

## HITL
Root cause approval and preventive measures approval.

## Depth Limit
Post-mortem action items do NOT trigger another post-mortem (maxDepth: 1). If a preventive measure fails, escalate to HITL.

## Output
- Post-mortem report in `.sdlc/history/`
- Fix applied with regression test
- Preventive measures as action items
- Tech debt items for systemic issues
