/**
 * Tech Stack Detector
 *
 * Scans a project directory (read-only) to detect its tech stack:
 * package manager, languages, frameworks, ORMs, databases, CI/CD,
 * monorepo tools, features, project type, and test frameworks.
 */
import type { ProjectProfile } from '../src/types/detection.js';
export declare function detectTechStack(projectDir: string): Promise<ProjectProfile>;
