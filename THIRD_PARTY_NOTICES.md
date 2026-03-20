# Third-Party Notices

This plugin includes adapted agent prompts from the following MIT-licensed projects.
Original copyright notices are preserved as required by the MIT License.

## VoltAgent/awesome-claude-code-subagents
Copyright (c) 2025 VoltAgent
License: MIT
https://github.com/VoltAgent/awesome-claude-code-subagents

## affaan-m/everything-claude-code
Copyright (c) 2026 Affaan Mustafa
License: MIT
https://github.com/affaan-m/everything-claude-code

## davepoon/buildwithclaude
Copyright (c) 2025 davepoon
License: MIT
https://github.com/davepoon/buildwithclaude

## alirezarezvani/claude-skills
Copyright (c) 2025 Alireza Rezvani
License: MIT
https://github.com/alirezarezvani/claude-skills

## iannuttall/claude-agents
Copyright (c) 2025 ian nuttall
License: MIT
https://github.com/iannuttall/claude-agents

## pablodelucca/pixel-agents (optional integration)
Copyright (c) 2026 Pablo De Lucca
License: MIT
https://github.com/pablodelucca/pixel-agents
Note: character sprites based on JIK-A-4 Metro City pack — verify upstream license independently

## obra/superpowers
Copyright (c) Jesse Vincent
License: MIT
https://github.com/obra/superpowers

Patterns adapted for claude-sdlc v2:
- Subagent dispatch protocol (status codes, fresh subagent per task, self-review,
  honest escalation) — adapted for domain-scoped execution
- TDD discipline (RED → verify fail → GREEN → verify pass → REFACTOR) —
  adapted for domain-scoped test commands
- Systematic debugging (4-phase: root cause → pattern analysis → hypothesis →
  implementation) — adapted for domain-scoped investigation
- Verification before completion (evidence before claims, fresh verification
  runs) — adapted for domain-specific verification commands
- Implementation planning (task decomposition with domain assignments) —
  adapted for per-domain wave-based planning
- Session context injection (state payload at session start) —
  adapted for SDLC state injection

## anthropic/code-review
Copyright (c) Anthropic
License: MIT

Patterns adapted for claude-sdlc v2:
- Parallel review agent architecture — adapted from 5-agent to 3-agent
  (governance+coverage merged, bugs+security merged, domain boundary new)
- Confidence scoring system (0-100, threshold >= 80) — used unchanged

## anthropic/ralph-loop
Copyright (c) Anthropic
License: MIT

Patterns adapted for claude-sdlc v2:
- Iterative execution pattern — adapted as prompt-driven retry loop inside
  subagent dispatch (not Stop hook, since Stop doesn't fire for subagents)

## anthropic/claude-md-management
Copyright (c) Anthropic
License: MIT

Patterns adapted for claude-sdlc v2:
- Quality rubric scoring system (6-criterion, A-F grades) — adapted from
  file quality scoring to agent health scoring for RETRO sessions

## anthropic/frontend-design
Copyright (c) Anthropic
License: MIT

Patterns adapted for claude-sdlc v2:
- Anti-pattern lists in prompts — adapted for domain-specific anti-patterns
  in BRAINSTORM spec drafting
