#!/usr/bin/env node
'use strict';

/**
 * SDLC Entry Check — SessionStart hook
 * 1. Detects if SDLC is not initialized → suggests /sdlc init
 * 2. Warns when not running as orchestrator
 */

const fs = require('fs');
const path = require('path');

function main() {
  const agentName = process.env.CLAUDE_AGENT_NAME || '';
  const cwd = process.env.SDLC_PROJECT_DIR || process.cwd();
  const sdlcDir = path.join(cwd, '.sdlc');
  const sdlcExists = fs.existsSync(sdlcDir) && fs.existsSync(path.join(sdlcDir, 'config.yaml'));

  // Case 1: SDLC not initialized — suggest init
  if (!sdlcExists) {
    const welcome = [
      '\u2728 CLAUDE SDLC PLUGIN INSTALLED',
      '',
      'SDLC is not initialized for this project yet.',
      '',
      'To get started:',
      '  1. Run: claude --agent orchestrator',
      '  2. Type: /sdlc init',
      '',
      'This will scan your project, detect tech stack and domains,',
      'and set up the SDLC governance pipeline.',
      '',
      'Quick start:  /sdlc init',
      'Full docs:    /sdlc help',
      '',
      'claude-sdlc by Plan2Skill \u2014 https://plan2skill.com',
    ].join('\n');

    const result = JSON.stringify({ result: welcome });
    process.stdout.write(result);
    process.exit(0);
    return;
  }

  // Case 2: SDLC initialized but not running as orchestrator
  if (agentName !== 'orchestrator') {
    const warning = [
      '\u26a0 SDLC PLUGIN DETECTED \u2014 NOT RUNNING AS ORCHESTRATOR',
      '',
      'You launched claude without --agent orchestrator.',
      'This means:',
      '  \u2022 No SDLC governance pipeline',
      '  \u2022 No team composition from registry',
      '  \u2022 No backlog tracking or cost logging',
      '  \u2022 No review gates or safety checks',
      '  \u2022 Changes go directly to working tree (no worktree isolation)',
      '',
      'To use SDLC flow:  exit and run: claude --agent orchestrator',
      'To continue anyway: this is fine for quick exploration/research',
      '',
      'claude-sdlc by Plan2Skill \u2014 https://plan2skill.com',
    ].join('\n');

    const result = JSON.stringify({ result: warning });
    process.stdout.write(result);
  }

  // Case 3: Running as orchestrator with SDLC initialized — silent (all good)
  process.exit(0);
}

main();
