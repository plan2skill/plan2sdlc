---
name: retro
description: Retrospective with quality rubric scoring — 6 criteria, A-F grades per agent
---

# RETRO Session

Review recent work, score agent effectiveness using a 6-criterion rubric, and identify process improvements.

## Entry Criteria
- Bi-weekly cadence (`config.triggers.retro.cadence`)
- After N merges (`config.triggers.retro.mergeThreshold`, default 5)
- Manual: `/sdlc retro`

## Process

### 1. Data Collection

Read from `.sdlc/history/` session logs:
- All sessions since last RETRO
- Per-agent: tasks completed, status codes, domain violations, test results
- Per-workflow: cycle time, review attempts, escalations

### 2. Agent Health Scoring (Quality Rubric)

For each agent that participated in recent work, score on 6 criteria:

| Criterion | Weight | Description | Measurement |
|-----------|--------|-------------|-------------|
| Success rate | 25% | % of tasks completed as DONE (not BLOCKED/NEEDS_CONTEXT) | `done_tasks / total_tasks * 100` |
| Domain compliance | 25% | % of sessions with zero domain boundary violations | `clean_sessions / total_sessions * 100` |
| Test coverage | 20% | Did the agent improve test coverage? | Delta from pre/post coverage reports |
| First-pass rate | 15% | % of tasks that passed REVIEW on first attempt | `first_pass / total_reviewed * 100` |
| Escalation rate | 10% | % of tasks escalated to HITL (lower is better, but 0% is suspicious) | `escalated / total_tasks * 100` — ideal range 5-15% |
| Report quality | 5% | Were status reports structured and honest? | Manual assessment from session logs |

#### Grading Scale

| Grade | Score | Action |
|-------|-------|--------|
| A | 90-100 | No action needed |
| B | 80-89 | Minor prompt tuning recommended |
| C | 70-79 | Prompt revision needed |
| D | 60-69 | Agent may need template change |
| F | < 60 | Agent should be replaced or significantly reworked |

#### Scoring Output Format

    ## Agent Health Report

    ### {agent_name} — Grade: {grade} ({score}/100)
    - Success rate: {n}% (weight 25%) — {raw_score}
    - Domain compliance: {n}% (weight 25%) — {raw_score}
    - Test coverage: {delta} (weight 20%) — {raw_score}
    - First-pass rate: {n}% (weight 15%) — {raw_score}
    - Escalation rate: {n}% (weight 10%) — {raw_score}
    - Report quality: {assessment} (weight 5%) — {raw_score}

    Recommendation: {action based on grade}

### 3. Workflow Metrics

Review aggregate metrics:
- Average cycle time (task start to merge)
- First-time review pass rate
- Cross-domain coordination frequency
- Most common BLOCKED reasons
- Most common review feedback themes

### 4. Process Improvement Proposals

Based on scores and metrics, propose:
- **Agent prompt updates** for agents with grade C or below
- **Rule changes** (additions/removals to CLAUDE.md)
- **Workflow adjustments** (wave structure, review criteria)
- **New agents or skills** needed for gaps identified
- **Agent removal** for consistently F-grade agents with no improvement path

### 5. User Approval

HITL: present findings and proposals to user.
- On approval: implement approved changes via ONBOARD session
- On rejection: log for next RETRO

## Participants
- governance-architect (mandatory)
- governance-reviewer (mandatory)
- process-coach (if available)

## Output
- Agent health report with grades
- Workflow metrics summary
- Approved improvement proposals
- Chains to ONBOARD if changes approved
