#!/usr/bin/env node
'use strict';

/**
 * SDLC Superpowers Guard — PreToolUse hook
 * Blocks superpowers skill invocations when disabled in .sdlc/config.yaml
 *
 * Intercepts the Skill tool and checks if the requested superpowers skill
 * is enabled in the project's SDLC config.
 */

const fs = require('fs');
const path = require('path');

// Map superpowers skill names to config keys
const SKILL_TO_CONFIG = {
  'superpowers:brainstorming': 'brainstorming',
  'superpowers:brainstorm': 'brainstorming',
  'superpowers:writing-plans': 'writingPlans',
  'superpowers:write-plan': 'writingPlans',
  'superpowers:test-driven-development': 'tdd',
  'superpowers:systematic-debugging': 'debugging',
  'superpowers:requesting-code-review': 'codeReview',
  'superpowers:verification-before-completion': 'verification',
  'superpowers:executing-plans': 'writingPlans',
  'superpowers:execute-plan': 'writingPlans',
  'superpowers:subagent-driven-development': 'writingPlans',
  'superpowers:using-superpowers': '_master',
  'superpowers:using-git-worktrees': '_always',
  'superpowers:finishing-a-development-branch': '_always',
  'superpowers:receiving-code-review': 'codeReview',
  'superpowers:dispatching-parallel-agents': '_always',
  'superpowers:writing-skills': '_always',
};

function loadConfig() {
  const configPath = path.join(process.cwd(), '.sdlc', 'config.yaml');
  if (!fs.existsSync(configPath)) return null;

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    // Simple YAML parsing for the integrations section
    // Look for integrations.superpowers.enabled and individual skill toggles
    const result = { enabled: true };

    const lines = content.split('\n');
    let inSuperpowers = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === 'superpowers:') {
        inSuperpowers = true;
        continue;
      }
      if (inSuperpowers && trimmed.startsWith('enabled:')) {
        result.enabled = trimmed.includes('true');
      }
      if (inSuperpowers && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^(\w+):\s*(true|false)/);
        if (match) {
          result[match[1]] = match[2] === 'true';
        }
      }
      // Exit superpowers section when we hit another top-level key
      if (inSuperpowers && !line.startsWith(' ') && !line.startsWith('\t') && trimmed !== '' && !trimmed.startsWith('#') && trimmed !== 'superpowers:') {
        inSuperpowers = false;
      }
    }

    return result;
  } catch {
    return null;
  }
}

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    let data;
    try {
      data = JSON.parse(input);
    } catch {
      process.exit(0);
      return;
    }

    const toolName = data.tool_name;
    if (toolName !== 'Skill') {
      process.exit(0);
      return;
    }

    const skillName = (data.tool_input || {}).skill || '';

    // Only guard superpowers skills
    if (!skillName.startsWith('superpowers:')) {
      process.exit(0);
      return;
    }

    const configKey = SKILL_TO_CONFIG[skillName];

    // Always allow utility skills (worktrees, parallel agents, etc.)
    if (configKey === '_always') {
      process.exit(0);
      return;
    }

    const config = loadConfig();

    // No config = no SDLC initialized = allow (superpowers works standalone)
    if (!config) {
      process.exit(0);
      return;
    }

    // Master toggle
    if (config.enabled === false) {
      const result = JSON.stringify({
        decision: 'block',
        reason: 'SDLC config: superpowers integration is disabled (integrations.superpowers.enabled: false). Enable with /sdlc enable superpowers',
      });
      process.stdout.write(result);
      process.exit(2);
      return;
    }

    // Block using-superpowers auto-invocation when SDLC is active
    // This prevents superpowers from hijacking the orchestrator flow
    if (configKey === '_master') {
      const agentName = process.env.CLAUDE_AGENT_NAME || '';
      if (agentName === 'orchestrator') {
        const result = JSON.stringify({
          decision: 'block',
          reason: 'SDLC orchestrator controls superpowers invocation. Superpowers auto-discovery is disabled in SDLC mode.',
        });
        process.stdout.write(result);
        process.exit(2);
        return;
      }
      // Allow for non-orchestrator sessions (user might be using plain claude)
      process.exit(0);
      return;
    }

    // Per-skill toggle
    if (configKey && config[configKey] === false) {
      const result = JSON.stringify({
        decision: 'block',
        reason: `SDLC config: superpowers:${configKey} is disabled. Enable in .sdlc/config.yaml or with /sdlc enable superpowers`,
      });
      process.stdout.write(result);
      process.exit(2);
      return;
    }

    // Allowed
    process.exit(0);
  });
}

main();
