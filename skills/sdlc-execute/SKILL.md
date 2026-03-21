---
name: sdlc-execute
description: Execute the current plan via the deterministic code dispatcher
user-invocable: true
---

# /sdlc execute

Run the code dispatcher to execute `.sdlc/plan.json`.

The dispatcher is a **Node.js script, not an LLM**. It spawns headless `claude -p` sessions for each task and enforces domain boundaries via `git diff`.

## Process

1. Verify `.sdlc/plan.json` exists. If not: "No plan found. Run the orchestrator through PLAN phase first."
2. Show plan summary to user:
   ```
   Plan: {title}
   Waves: {count}
   Tasks: {total} ({done} done, {pending} pending)
   Status: {status}
   ```
3. If plan status is `paused` — show which task failed/blocked and ask user how to proceed.
4. Ask user to confirm execution.
5. Run the dispatcher:
   ```bash
   cd "{project_dir}" && node --import tsx "${CLAUDE_PLUGIN_ROOT}/scripts/dispatcher.ts"
   ```
6. After dispatcher completes:
   - **Exit 0**: "Execution complete. All tasks done. Ready for REVIEW."
   - **Exit non-zero**: Read `.sdlc/plan.json`, find failed/blocked task, show details to user.

## Resume

If dispatcher was interrupted or a task failed:
- Fix the issue (or update task context in plan.json)
- Run `/sdlc execute` again — it resumes from the last incomplete task

## Important

- The dispatcher spawns **separate headless sessions** per task — not subagents
- Each session gets `--allowedTools Edit,Write,Bash,Read,Glob,Grep`
- Domain boundaries are enforced via `git diff` after each task
- Boundary violations are auto-reverted and retried (max 3 attempts)
- Progress is written to `.sdlc/plan.json` in real-time
