# Pixel Agents Browser Dashboard — Design Spec

**Date:** 2026-03-20
**Status:** Approved

## Summary

Browser-based SDLC dashboard combining pixel-agents office visualization with a locked Claude CLI terminal. Runs on localhost, no external dependencies.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  SDLC Dashboard — Plan2Skill                    [status bar] │
├────────────────────────────────────┬─────────────────────────┤
│                                    │  🏛 SDLC Orchestrator   │
│     Pixel Office (Canvas)          │                         │
│                                    │  > fix login bug        │
│  Real-time agent animations        │  📋 TASK-001: Fix login │
│  Click agent → details popup       │  Type: bugfix | S       │
│  Zoom/pan                          │  Chain: QUICK_FIX→MERGE │
│  Furniture layout                  │                         │
│                                    │  > /sdlc status         │
│                                    │  BACKLOG (3 items)...   │
│                                    │                         │
├────────────────────────────────────┤  > _                    │
│  Progress bar: ✅▶⬚⬚ EXECUTE      │                         │
└────────────────────────────────────┴─────────────────────────┘
```

## Architecture

```
Browser (localhost:3456)
├── Left: Pixel Office (React + Canvas 2D, extracted from pixel-agents)
├── Right: Claude CLI chat (xterm.js → WebSocket → node-pty → claude)
├── Bottom: Workflow progress bar
└── Status bar: task count, cost, active workflows

Server (Node.js)
├── HTTP: serve static HTML/JS/CSS/assets
├── WebSocket /ws/terminal: xterm.js ↔ node-pty (claude process)
├── WebSocket /ws/state: push .sdlc/ state changes to pixel office
├── File watcher: .sdlc/state.json, backlog.json, history/
└── Locked: spawns only `claude --agent claude-sdlc:orchestrator`
```

## Components

1. server.cjs — Express + ws + node-pty + chokidar
2. index.html — SPA loading office + terminal
3. dashboard/office/ — extracted pixel-agents React + Canvas
4. dashboard/terminal-adapter.js — xterm.js + input filtering
5. dashboard/state-bridge.js — .sdlc/ watcher → office state updates

## Input Filtering

Locked to Claude Code only:
- Allow: natural language text, /sdlc commands, y/n for HITL, Ctrl+C
- Block: shell commands (cd, rm, cat, node, etc.)

## Dependencies

express, ws, node-pty, chokidar

## Launch

`/sdlc dashboard` → localhost:3456 → browser auto-opens
