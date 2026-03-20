/**
 * Domain Detector
 *
 * Scans a project directory (read-only) to detect domain groupings
 * (bounded contexts). Returns a DomainMap with detected domains,
 * each annotated with tech stack and description.
 */
import type { DomainMap } from '../src/types/detection.js';
export declare function detectDomains(projectDir: string): Promise<DomainMap>;
