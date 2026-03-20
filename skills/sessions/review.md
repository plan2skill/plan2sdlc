---
name: review
description: Two-stage code review — spec compliance then 3-agent parallel quality review with confidence scoring
---

# REVIEW Session

Two-stage review gate. Stage 1 checks spec compliance (short-circuits on failure). Stage 2 runs 3 parallel review agents with confidence scoring.

## Entry Criteria
- EXECUTE session completed
- Code in branch(es) ready for review
- Spec and plan available in handoff artifacts

## Process

### 1. Context Loading
- Read execution results from handoff (branches, files changed, test results, concerns)
- Read spec from handoff artifacts (specPath) for compliance checking
- Read plan from handoff artifacts (planPath) for completeness checking
- Identify changed files per domain

### 2. Stage 1: Spec Compliance Review

Dispatch a single governance-reviewer as subagent with this prompt:

    You are a spec compliance reviewer.

    ## Inputs
    - Spec: {spec_path}
    - Plan: {plan_path}
    - Changed files: {file_list}

    ## Checks
    1. Every acceptance criterion in the spec — is it addressed in the implementation?
    2. Every planned task in the plan — is it completed?
    3. No unplanned changes (scope creep) — are there changes not in the plan?

    For each acceptance criterion, report:
    - Criterion text
    - Status: MET | NOT_MET | PARTIALLY_MET
    - Evidence: which file/line satisfies it (or what is missing)

    ## Verdict
    - PASS — all criteria met, all tasks complete, no scope creep
    - FAIL — missing criteria or incomplete tasks (list them)

**If Stage 1 FAIL:** Short-circuit. Return `needs-changes` with spec compliance feedback. Do NOT proceed to Stage 2. Chain back to EXECUTE with the feedback.

**If Stage 1 PASS:** Proceed to Stage 2.

### 3. Stage 2: Code Quality Review (3 parallel agents)

Dispatch 3 review agents simultaneously using the Agent tool:

#### Agent 1: Governance + Test Coverage

    You are a governance and test coverage reviewer.

    ## Changed Files
    {changed_files_with_diffs}

    ## Review Focus: Governance Compliance
    - Do changes follow project conventions from CLAUDE.md?
    - Are naming conventions followed?
    - Are architectural rules respected?
    - Are commit messages properly formatted?

    ## Review Focus: Test Coverage
    - Are new features tested?
    - Are edge cases tested?
    - Do tests actually assert meaningful behavior (not just "no error")?
    - Has test coverage improved or degraded?

    ## Confidence Scoring
    Score each issue 0-100 based on:
    - 90-100: Definitely a real issue. Clear evidence in the code.
    - 70-89: Likely an issue but context-dependent. Could be intentional.
    - 50-69: Possible issue. Needs human judgment.
    - 0-49: Uncertain. Might be a false positive.

    Only report issues with confidence >= 80.

    Score HIGHER when: pattern is clearly wrong, test is missing for critical path,
    convention violation is unambiguous.
    Score LOWER when: pattern exists elsewhere in codebase (might be intentional),
    issue is stylistic, code is in a test file.

    ## Output Format
    For each issue:
    - File: {path}
    - Line: {number}
    - Category: governance | test-coverage
    - Severity: critical | warning | info
    - Confidence: {0-100}
    - Description: {what is wrong}
    - Suggestion: {how to fix}

#### Agent 2: Bug Detection + Security

    You are a bug detection and security reviewer.

    ## Changed Files
    {changed_files_with_diffs}

    Review ONLY changed/added lines (not entire files).

    ## Review Focus: Bugs
    - Off-by-one errors
    - Null/undefined handling
    - async/await correctness
    - Error handling gaps
    - Edge cases and boundary conditions
    - Resource leaks (unclosed connections, streams)

    ## Review Focus: Security
    - Hardcoded secrets, API keys, passwords
    - SQL injection, XSS, CSRF vulnerabilities
    - Authentication/authorization gaps
    - Input validation on new endpoints
    - Sensitive data in logs or error messages

    ## Confidence Scoring
    Score each issue 0-100 based on:
    - 90-100: Definitely a real issue. Clear evidence in the code.
    - 70-89: Likely an issue but context-dependent. Could be intentional.
    - 50-69: Possible issue. Needs human judgment.
    - 0-49: Uncertain. Might be a false positive.

    Only report issues with confidence >= 80.

    Score HIGHER when: issue is in new/changed code, security implication is clear,
    bug pattern is well-known.
    Score LOWER when: pattern exists elsewhere in codebase, behavior is documented,
    code is in test file.

    ## Output Format
    For each issue:
    - File: {path}
    - Line: {number}
    - Category: bug | security
    - Severity: critical | warning | info
    - Confidence: {0-100}
    - Description: {what is wrong}
    - Suggestion: {how to fix}

#### Agent 3: Domain Boundary Violations

    You are a domain boundary reviewer.

    ## Changed Files
    {changed_files_with_diffs}

    ## Domain Map
    {domain_map_yaml}

    ## Review Focus
    For each changed file, check:
    1. Imports from other domains must go through facade paths only — no importing internal services, repositories, or utilities from another domain
    2. No direct database queries to tables owned by other domains
    3. No shared mutable state (global variables, singletons shared across domains)
    4. API calls to other domains must use the public facade/contract, not internal methods
    5. New files are created within the correct domain boundary

    ## Confidence Scoring
    Score each issue 0-100 based on:
    - 90-100: Definitely a real issue. Clear evidence in the code.
    - 70-89: Likely an issue but context-dependent. Could be intentional.
    - 50-69: Possible issue. Needs human judgment.
    - 0-49: Uncertain. Might be a false positive.

    Only report violations with confidence >= 80.

    ## Output Format
    For each violation:
    - File: {path}
    - Line: {number}
    - Violation type: import | database | shared-state | api-contract | file-placement
    - Confidence: {0-100}
    - Description: {what crosses the boundary}
    - Suggestion: {how to fix — usually "use facade X instead"}

### 4. Aggregate Results

Collect issues from all 3 agents:
1. Filter: discard any issue with confidence < 80
2. Deduplicate: if multiple agents flag the same file+line, keep the highest-confidence one
3. Group by severity:
   - **critical** (must fix before merge)
   - **warning** (should fix, not blocking)
   - **info** (nice to fix, informational)

### 5. Outcomes

- **Any critical issues** -> `needs-changes`: chain back to EXECUTE with the issue list as feedback. Increment `reviewAttempt` in workflow context.
- **Warnings only, no critical** -> `approved-with-notes`: chain to INTEGRATION_CHECK (if multi-domain) or MERGE. Include warnings in handoff for developer awareness.
- **Clean (no issues above threshold)** -> `approved`: chain to INTEGRATION_CHECK (if multi-domain) or MERGE.
- **reviewAttempt >= maxRetries** -> `rejected`: escalate to HITL. User decides: force merge, continue fixing, or abandon.

## Participants
- governance-reviewer (Stage 1, mandatory)
- 3 review agents (Stage 2, dispatched as subagents)

## Retry Policy
Max retries configurable in `.sdlc/config.yaml` (default 2). Tracks `reviewAttempt` in workflow context.

## Output
- Review report with scored issues
- Verdict: approved | approved-with-notes | needs-changes | rejected
- SessionHandoff -> chains to next session based on verdict
