---
name: sdlc-dashboard
description: Launch browser-based SDLC dashboard
user-invocable: true
---

# /sdlc dashboard

The dashboard must be launched from a **separate terminal** (not inside Claude Code).

## What to do

1. Detect the plugin installation path using Bash:
   ```bash
   find ~/.claude/plugins/cache -path "*/claude-sdlc/*/dashboard/server.cjs" 2>/dev/null | sort -V | tail -1
   ```

2. Get the current project directory (where .sdlc/ lives).

3. Tell the user to run this command in a **new terminal window**:

```
Open a new PowerShell/terminal and run:

  node {plugin_path}/dashboard/server.cjs {project_directory}

For example:
  node ~/.claude/plugins/cache/plan2skill-plugins/claude-sdlc/0.1.9/dashboard/server.cjs /path/to/your/project

This opens http://localhost:3456 with:
  • Left: Pixel office — agent visualization
  • Right: Claude CLI terminal (orchestrator)
  • Bottom: Workflow progress bar
  • Top: Status bar (tasks, cost, active workflows)
```

Do NOT run the server via Bash tool — it will fail with "cannot launch inside Claude Code session".
