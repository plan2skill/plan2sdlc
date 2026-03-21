#!/usr/bin/env node
'use strict';

/**
 * SDLC Secrets Guard — PreToolUse hook
 * Blocks read/write access to sensitive files (credentials, keys).
 */

const TOOLS_WITH_FILE_PATH = ['Read', 'Edit', 'Write'];
const TOOLS_WITH_PATTERN = ['Glob'];
const TOOLS_WITH_COMMAND = ['Bash'];
const CHECKED_TOOLS = [...TOOLS_WITH_FILE_PATH, ...TOOLS_WITH_PATTERN, ...TOOLS_WITH_COMMAND];

// Write-only blocked patterns (in addition to never-read)
const WRITE_ONLY_PATTERNS = [
  /(?:^|[\\/]).npmrc$/i,
  /(?:^|[\\/]).pypirc$/i,
];

// Never-read patterns (also blocked on write)
const NEVER_READ_PATTERNS = [
  // .env files (but not .env.example or .env.template)
  /(?:^|[\\/])\.env(?:\..+)?$/i,
  // credentials
  /(?:^|[\\/])credentials/i,
  // secrets directory (path component, not substring)
  /[\\/]secrets[\\/]/i,
  // key/cert files
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  // service account / gcloud keys
  /(?:^|[\\/])service-account[^\\/]*\.json$/i,
  /(?:^|[\\/])gcloud-key[^\\/]*\.json$/i,
  // files named secret(s).* (but not hook source files like *-guard.cjs)
  /(?:^|[\\/])secrets?(?![-_]guard)\b[^\\/]*$/i,
  // SSH keys
  /(?:^|[\\/])id_rsa/i,
  /(?:^|[\\/])id_ed25519/i,
];

// Exception patterns (always allowed)
function isException(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  // .env.example and .env.template are always OK
  if (/(?:^|[\\/])\.env\.example$/i.test(filePath)) return true;
  if (/(?:^|[\\/])\.env\.template$/i.test(filePath)) return true;
  // docs about security are OK
  if (/^docs[\\/\/]/i.test(normalized) || /[\\/\/]docs[\\/\/]/i.test(normalized)) {
    return true;
  }
  // Plugin hook source files are always OK to read
  if (/[\\/]hooks[\\/]sdlc-[a-z-]+\.cjs$/i.test(normalized)) {
    return true;
  }
  return false;
}

// Bash command patterns that could expose actual credential files.
// Only match when a file-accessing command targets a sensitive path.
const BASH_SECRET_FILE_COMMANDS = [
  // Direct file reads of .env (not .env.example/.env.template, not inside heredoc/string content)
  /(?:cat|less|more|head|tail|source|\.)\s+[^\n|;]*[\\/]?\.env(?!\.(?:example|template))\b/i,
  // Copying/moving credential files
  /(?:cp|mv|rm)\s+[^\n|;]*[\\/]?\.env(?!\.(?:example|template))\b/i,
  // Direct reads of key/cert files
  /(?:cat|less|more|head|tail)\s+[^\n|;]*\.(?:pem|p12|pfx)\b/i,
  /(?:cat|less|more|head|tail)\s+[^\n|;]*[\\/]id_(?:rsa|ed25519)\b/i,
  /(?:cat|less|more|head|tail)\s+[^\n|;]*[\\/]credentials\b/i,
];

const BASH_ENV_EXPOSURE_PATTERNS = [
  /\bprintenv\b/,
  /\benv\s*\|/,
  /\bset\s*\|/,
  /\becho\s+\$/,
  /\becho\s+"\$/,
  /\bsource\s+\.env\b/,
];

function isBashCommandBlocked(command) {
  if (!command) return false;

  // Check for secret file access commands
  for (const pattern of BASH_SECRET_FILE_COMMANDS) {
    if (pattern.test(command)) return true;
  }

  // Check for environment variable exposure
  for (const pattern of BASH_ENV_EXPOSURE_PATTERNS) {
    if (pattern.test(command)) return true;
  }

  return false;
}

function isBlocked(filePath, toolName) {
  if (isException(filePath)) return false;

  // Check never-read patterns (apply to all checked tools)
  for (const pattern of NEVER_READ_PATTERNS) {
    if (pattern.test(filePath)) return true;
  }

  // Check write-only patterns (apply to Edit, Write)
  if (toolName === 'Edit' || toolName === 'Write') {
    for (const pattern of WRITE_ONLY_PATTERNS) {
      if (pattern.test(filePath)) return true;
    }
  }

  return false;
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
      // Can't parse input, allow by default
      process.exit(0);
      return;
    }

    const toolName = data.tool_name;
    if (!CHECKED_TOOLS.includes(toolName)) {
      process.exit(0);
      return;
    }

    const toolInput = data.tool_input || {};

    // Handle Bash tool separately — inspect the command string
    if (TOOLS_WITH_COMMAND.includes(toolName)) {
      const command = toolInput.command || '';
      if (isBashCommandBlocked(command)) {
        const result = JSON.stringify({
          decision: 'block',
          reason: `SDLC guard: Bash command may access credentials — ${command.slice(0, 100)}`,
        });
        process.stdout.write(result);
        process.exit(2);
      } else {
        process.exit(0);
      }
      return;
    }

    let filePath;

    if (TOOLS_WITH_FILE_PATH.includes(toolName)) {
      filePath = toolInput.file_path || '';
    } else if (toolName === 'Glob') {
      filePath = toolInput.pattern || '';
    }

    if (!filePath) {
      process.exit(0);
      return;
    }

    if (isBlocked(filePath, toolName)) {
      const result = JSON.stringify({
        decision: 'block',
        reason: `SDLC guard: ${filePath} matches protected pattern`,
      });
      process.stdout.write(result);
      process.exit(2);
    } else {
      process.exit(0);
    }
  });
}

main();
