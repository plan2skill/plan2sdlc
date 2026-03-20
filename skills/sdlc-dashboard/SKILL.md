---
name: sdlc-dashboard
description: Launch browser-based SDLC dashboard
user-invocable: true
---

# /sdlc dashboard

⚠ **The dashboard must be launched from a separate terminal, not from inside Claude Code.**

Tell the user:

```
The SDLC Dashboard includes a built-in Claude CLI terminal,
so it cannot run inside an existing Claude Code session.

Open a new PowerShell/terminal window and run:

  cd {project_directory}
  node node_modules/claude-sdlc/dashboard/server.cjs

Or if you have the plugin source:

  node C:\plan2sdlc\dashboard\server.cjs

This will open http://localhost:3456 with:
  • Left: Pixel office with agent visualization
  • Right: Claude CLI terminal (orchestrator)
  • Bottom: Workflow progress bar
  • Top: Status bar (tasks, cost, active workflows)
```

Do NOT try to run `node dashboard/server.cjs` via Bash tool — it will fail with "cannot launch inside Claude Code session".
