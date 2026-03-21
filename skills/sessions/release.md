---
name: release
description: Cut release — gather changes from ledger, generate changelog + release notes, version bump, tag, deploy
---

# RELEASE Session

The orchestrator performs this session directly (no delegation). Cut a release with full changelog, release notes, and version management.

## Entry Criteria
- Manual trigger: `/sdlc release` or orchestrator routes here
- All planned work merged (check `.sdlc/ledger.md` for completed tasks)

## Process

### 1. Gather Changes

Read `.sdlc/ledger.md` to collect all completed tasks since last release. The ledger is the single source of truth — it contains task IDs, descriptions, domains, key decisions, and dates.

Also run:
```
git log --oneline {last_tag}..HEAD
```
Cross-reference git commits with ledger entries for completeness.

### 2. Classify Changes

Group ledger entries by type:
- **Breaking Changes** — API removals, schema changes, behavioral changes
- **Features** — new capabilities
- **Fixes** — bug fixes
- **Refactoring** — internal improvements (skip in user-facing notes)
- **Docs** — documentation changes
- **Ops** — CI/CD, infra, tooling

### 3. Determine Version Bump

Based on classified changes:
- Any breaking change → **major**
- Any new feature (no breaking) → **minor**
- Bug fixes only → **patch**

Show to user:
```
Version: {current} → {proposed}
Reason: {breaking change X / new feature Y / fixes only}

Confirm? [y/major/minor/patch/n]
```

### 4. Run Pre-Release Verification

Full test suite — all must pass:
- Unit tests (all domains)
- Integration tests
- E2E tests (if configured)
- Typecheck + lint
- Build

Gate: 100% green. ANY failure → abort release, show failures.

### 5. Generate CHANGELOG.md

Append a new version section at the top of CHANGELOG.md:

```markdown
## [{version}] - {YYYY-MM-DD}

### Breaking Changes
- {description} ({TASK-ID})

### Features
- {description} ({TASK-ID})

### Fixes
- {description} ({TASK-ID})
```

Rules:
- One line per change, concise, user-facing language
- Reference TASK-ID for traceability
- Skip internal refactoring unless it affects behavior
- If CHANGELOG.md doesn't exist, create it with a header

### 6. Generate Release Notes

Release notes are richer than changelog — they explain WHY and provide context. Generate as a markdown block suitable for GitHub release or comms:

```markdown
# Release {version}

## Highlights
{2-3 sentence summary of the most impactful changes}

## What's New
- **{Feature name}** — {1-2 sentence explanation of value to user}

## Bug Fixes
- {description}

## Breaking Changes
- **{What changed}** — {migration path}

## Domains Affected
{list of domains with changes, from ledger}

## Full Changelog
{link to CHANGELOG.md or diff}
```

Show release notes to user for review before proceeding.

### 7. Commit and Tag

1. Bump version in package.json (and any other version files)
2. Commit: `release: v{version}`
3. Create git tag: `v{version}` (or per `config.git.tagFormat`)

### 8. Archive Ledger

The ledger index must stay compact (~150 lines max). On release:

1. Read all entries from `## Since Last Release` in `.sdlc/ledger.md`
2. Write them to `.sdlc/ledger/v{version}.json`:
   ```json
   {
     "version": "{version}",
     "date": "{YYYY-MM-DD}",
     "tasks": [
       { "id": "TASK-048", "title": "...", "type": "feature", "complexity": "M", "domains": ["api", "ui"], "summary": "..." }
     ],
     "decisions": ["Auth: JWT in httpOnly cookie", "..."]
   }
   ```
3. Clear `## Since Last Release` section in ledger.md
4. Move decisions that are now established patterns to `## Key Decisions (active)` or remove if superseded
5. Add release entry to `## Release History`:
   ```markdown
   - v{version} ({YYYY-MM-DD}): {N} tasks → ledger/v{version}.json
   ```
6. Update the header: `Last release: v{version} ({YYYY-MM-DD}) | Tasks completed: {total}`

### 9. Deploy (if configured)

If CI/CD detected → trigger deploy pipeline. Otherwise, inform user how to deploy manually.

## HITL

- Version confirmation: always required
- Release notes review: always required
- Deploy trigger: always required

## Output
- Updated CHANGELOG.md
- Release notes (shown to user, suitable for GitHub release)
- Version bump committed
- Git tag created
- Ledger updated with release marker
- Deploy triggered (if configured)
