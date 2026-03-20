---
name: plan
description: Decompose spec into per-domain tasks organized in execution waves
---

# PLAN Session

Decompose an approved spec into concrete, domain-level tasks organized in execution waves for parallel dispatch.

## Entry Criteria
- Approved spec (from BRAINSTORM) OR clear M-complexity task
- Spec path available in handoff artifacts

## Process

### 1. Context Loading
- Read spec from handoff artifacts (specPath)
- Read domain map from `.sdlc/registry.yaml`
- Read current codebase state for affected domains (file structure, existing tests)

### 2. Task Decomposition

Dispatch governance-architect as subagent to decompose the spec into per-domain tasks.

Each task must specify:
- [ ] Task ID (PLAN-{n})
- [ ] Domain: {domain_name}
- [ ] Agent: {agent_name} (from registry)
- [ ] Description: what to implement
- [ ] Files to create/modify: {list}
- [ ] Acceptance criteria: {from spec, specific to this task}
- [ ] Test requirements: {what to test, which test file}
- [ ] Dependencies: {other PLAN-{n} tasks that must complete first}
- [ ] Verification: {command to verify completion}

### 3. Execution Wave Planning

Group tasks into waves based on dependencies:
- **Wave 1:** Independent tasks (all domains can work simultaneously)
- **Wave 2:** Tasks depending on Wave 1 outputs
- **Wave N:** Final integration tasks

Maximize parallelism — tasks without dependencies on each other belong in the same wave.

### 4. Plan Document

Write plan to: `docs/plans/{TASK-ID}-{slug}.md`

Format:

    # Implementation Plan: {TASK-ID} — {title}

    **Spec:** docs/specs/{TASK-ID}-{slug}.md
    **Domains:** {list}
    **Waves:** {n}

    ## Wave 1 (parallel)

    ### PLAN-1: {description}
    - **Domain:** {domain}
    - **Agent:** {agent_name}
    - **Files:** {path} (create), {path} (modify)
    - **Acceptance criteria:**
      - [ ] {criterion 1}
      - [ ] {criterion 2}
    - **Test:** {test_command} -- --grep "{pattern}"
    - **Dependencies:** none

    ### PLAN-2: {description}
    - **Domain:** {domain}
    - **Agent:** {agent_name}
    - **Dependencies:** none

    ## Wave 2 (after Wave 1)

    ### PLAN-3: {description}
    - **Domain:** {domain}
    - **Agent:** {agent_name}
    - **Dependencies:** PLAN-1 (needs {what})

### 5. Plan Review (subagent)

Dispatch a fresh subagent to review the plan:

    You are a plan reviewer. Review this implementation plan for completeness and correctness.

    Plan: {plan_content}
    Spec: {spec_content}

    Check:
    1. Does every acceptance criterion in the spec have at least one task addressing it?
    2. Are dependencies correctly ordered (no circular deps, no missing deps)?
    3. Are domain assignments correct (right agent for right domain)?
    4. Is the wave structure optimal (maximum parallelism)?
    5. Are test requirements specific enough for the developer to write tests?
    6. Are file paths accurate (do referenced files exist or are they clearly new)?

    Report: PASS (plan is ready) | NEEDS_REVISION (list specific issues to fix)

If NEEDS_REVISION: architect revises the plan. Max 2 review rounds.

### 6. User Approval

HITL: present the plan to the user for approval.
- On approval: write SessionHandoff with planPath and domain assignments
- On changes requested: architect revises, re-review
- Chain to EXECUTE

## Participants
- governance-architect (mandatory, decomposes and writes plan)
- plan reviewer (subagent, fresh context)

## HITL
Plan approval required before EXECUTE proceeds.

## Output
- Implementation plan document (saved to docs/plans/)
- Plan path stored in handoff artifacts
- Domain assignments for EXECUTE dispatch
- **Chains to EXECUTE** (orchestrator handles transition)
