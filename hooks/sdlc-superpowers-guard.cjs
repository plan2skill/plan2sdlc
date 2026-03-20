#!/usr/bin/env node
'use strict';

/**
 * SDLC Superpowers Guard — PreToolUse hook
 * Blocks ALL superpowers skills when SDLC is active (.sdlc/config.yaml exists).
 * Superpowers patterns are internalized in claude-sdlc v2.
 */

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(input); } catch { process.exit(0); return; }

  if (data.tool_name !== 'Skill') { process.exit(0); return; }

  const skill = (data.tool_input || {}).skill || '';
  if (!skill.startsWith('superpowers:')) { process.exit(0); return; }

  const configPath = path.join(process.cwd(), '.sdlc', 'config.yaml');
  if (!fs.existsSync(configPath)) { process.exit(0); return; }

  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: 'claude-sdlc v2 has internalized superpowers patterns. Superpowers skills are blocked when SDLC is active. To use superpowers standalone, remove .sdlc/config.yaml.',
  }));
  process.exit(2);
});
