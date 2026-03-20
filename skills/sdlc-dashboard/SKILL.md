---
name: sdlc-dashboard
description: Launch browser-based SDLC dashboard
user-invocable: true
---

# /sdlc dashboard

Launch the Pixel Agents browser dashboard.

## Process

1. Start the dashboard server:
   ```bash
   node dashboard/server.cjs
   ```
   This opens http://localhost:3456 in your default browser.

2. The dashboard shows:
   - **Left**: Pixel office with agent visualization
   - **Right**: Locked Claude CLI terminal (orchestrator)
   - **Bottom**: Workflow progress bar
   - **Top**: Status bar (tasks, cost, active workflows)

3. To stop: press Ctrl+C in the terminal where you launched it, or close the browser tab.

## Requirements
- Node.js 18+
- The dashboard runs on localhost:3456 (configurable via SDLC_DASHBOARD_PORT env var)
