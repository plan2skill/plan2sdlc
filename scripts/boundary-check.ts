/**
 * Boundary Check — verify agent stayed within its writable path.
 * Returns list of files that violate the domain boundary.
 */

import { execSync } from 'node:child_process';

/**
 * Get list of files changed since a given git commit hash.
 */
export function getChangedFiles(projectDir: string, sinceHash: string): string[] {
  try {
    const output = execSync(`git diff --name-only ${sinceHash} HEAD`, {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 10_000,
    });
    return output
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);
  } catch {
    return [];
  }
}

/**
 * Get current git HEAD hash.
 */
export function getHeadHash(projectDir: string): string {
  return execSync('git rev-parse HEAD', {
    cwd: projectDir,
    encoding: 'utf-8',
    timeout: 5_000,
  }).trim();
}

/**
 * Check if all changed files are within the writable path.
 * Returns violating files (empty array = all good).
 */
export function checkBoundary(changedFiles: string[], writablePath: string): string[] {
  const normalized = writablePath.replace(/\\/g, '/').replace(/\/$/, '');
  return changedFiles.filter(file => {
    const norm = file.replace(/\\/g, '/');
    return !norm.startsWith(normalized + '/') && norm !== normalized;
  });
}

/**
 * Revert specific files to HEAD state.
 */
export function revertFiles(projectDir: string, files: string[]): void {
  if (files.length === 0) return;
  const quoted = files.map(f => `"${f}"`).join(' ');
  execSync(`git checkout HEAD -- ${quoted}`, {
    cwd: projectDir,
    timeout: 10_000,
  });
}
