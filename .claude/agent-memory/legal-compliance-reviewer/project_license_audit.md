---
name: project_license_audit
description: License audit results for claude-sdlc plugin — 5 MIT sources, 1 MIT extension, CC-BY-NC-ND source correctly blocked
type: project
---

Project license: MIT (Copyright 2026 plan2skill). LICENSE file present at root. package.json declares MIT.

Six third-party sources attributed in THIRD_PARTY_NOTICES.md:
1. VoltAgent/awesome-claude-code-subagents — MIT
2. affaan-m/everything-claude-code — MIT
3. davepoon/buildwithclaude — MIT
4. alirezarezvani/claude-skills — MIT
5. iannuttall/claude-agents — MIT
6. pablodelucca/pixel-agents — MIT (optional integration)

BLOCKED source: hesreallyhim/awesome-claude-code — CC BY-NC-ND 4.0 (correctly excluded)

**Why:** All MIT-to-MIT is compatible but individual agent files lack per-file source attribution headers, and the JIK-A-4 sprite pack upstream license is unresolved.

**How to apply:** Before distribution, verify per-file attribution is added to adapted agents and JIK-A-4 license is confirmed or pixel-agents integration is gated.
