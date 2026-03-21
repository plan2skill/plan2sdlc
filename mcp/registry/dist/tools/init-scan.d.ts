import type { DomainInfo } from '../types.js';
interface ScanResult {
    entities_created: number;
    by_type: Record<string, number>;
}
export declare function registryInitScan(projectDir: string, domains?: DomainInfo[]): ScanResult;
export {};
