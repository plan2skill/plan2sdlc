---
name: merge
description: Verification-before-completion merge — fresh test run required before merge
---

# MERGE Session

Merge approved code to the release branch. All verification runs must be fresh (not cached). Evidence required before claims.

## Entry Criteria
- REVIEW approved (or INTEGRATION_CHECK passed for multi-domain)
- All domain tests green (verified in REVIEW)

## Process

### 1. Pre-Merge Verification (Fresh Runs)

For each domain with changes, run ALL verification commands fresh:

    ## Verification Results

    ### Domain: {domain_name}
    - [ ] Tests: `{test_command}` — {PASS|FAIL} ({n} passed, {n} failed)
    - [ ] Build: `{build_command}` — {PASS|FAIL}
    - [ ] Lint: `{lint_command}` — {PASS|FAIL} ({n} warnings, {n} errors)
    - [ ] TypeCheck: `{typecheck_command}` — {PASS|FAIL} ({n} errors)

**Critical:** Run each command NOW. Do NOT reference results from EXECUTE or REVIEW sessions. Fresh execution only.

ALL checks must pass. ANY failure -> back to EXECUTE with the failure details.

### 2. Cross-Domain Verification (if multi-domain)

If changes span multiple domains:
- Run integration test suite: `{integration_test_command}`
- Run E2E tests (if configured): `{e2e_test_command}`
- Verify API contract compatibility between domains

    ### Integration
    - [ ] Integration tests: `{integration_test_command}` — {PASS|FAIL}
    - [ ] E2E tests: `{e2e_test_command}` — {PASS|FAIL}

### 3. Merge Confirmation

Show explicit merge confirmation to user:

    MERGE to {release_branch}

    Branches: {list}
    Files changed: {count} across {domain_count} domains
    Verification: all checks passed (see above)
    Review: approved

    This merges code to your release branch.
    Recovery: git revert {commit-hash}

    Proceed? [y/n]

HITL required for L/XL tasks (per `config.hitl.mergeApproval`).
S/M tasks: auto-merge if all checks pass (unless config overrides).

### 4. Merge Execution

- If worktrees: merge each domain branch to release branch
- If single branch: fast-forward or merge commit
- Run full test suite post-merge
- If post-merge tests fail: revert merge, chain to POST_MORTEM

### 5. Cleanup

- Update backlog item status to 'done'
- Delete worktrees (if used)
- Write completion entry to `.sdlc/history/`

### 6. Cadence Check

After merge:
- Increment `mergesSinceRetro` in `.sdlc/state.json`
- If `mergesSinceRetro >= threshold` (default 5): suggest RETRO session
- If `lastGapAnalysis > 2 weeks`: suggest GAP_ANALYSIS session

## Participants
- Orchestrator manages merge process directly
- No separate governance agent needed (verification is mechanical)

## Output
- Merged commits on release branch
- Cleaned worktrees
- Updated backlog status
- Post-merge sessions suggested if cadence thresholds met
