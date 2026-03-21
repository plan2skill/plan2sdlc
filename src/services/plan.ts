/**
 * Plan Service — CRUD operations for .sdlc/plan.json
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Plan, PlanTask, TaskStatus, PlanStatus, WaveStatus } from '../types/plan.js';

export async function loadPlan(planPath: string): Promise<Plan> {
  const content = await readFile(planPath, 'utf-8');
  return JSON.parse(content) as Plan;
}

export async function savePlan(planPath: string, plan: Plan): Promise<void> {
  await writeFile(planPath, JSON.stringify(plan, null, 2), 'utf-8');
}

export function planExists(planPath: string): boolean {
  return existsSync(planPath);
}

export function updateTaskStatus(
  plan: Plan,
  taskId: string,
  status: TaskStatus,
  extra?: Partial<Pick<PlanTask, 'result' | 'error' | 'changedFiles' | 'boundaryViolations' | 'startedAt' | 'completedAt' | 'attempts'>>,
): void {
  for (const wave of plan.waves) {
    const task = wave.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (extra) Object.assign(task, extra);
      return;
    }
  }
  throw new Error(`Task ${taskId} not found in plan`);
}

export function resetTask(plan: Plan, taskId: string): void {
  updateTaskStatus(plan, taskId, 'pending', {
    attempts: 0,
    result: null,
    error: null,
    changedFiles: [],
    boundaryViolations: [],
    startedAt: null,
    completedAt: null,
  });
}

export function getNextPendingWave(plan: Plan): number | null {
  for (const wave of plan.waves) {
    if (wave.status !== 'completed') return wave.id;
  }
  return null;
}

export function getNextPendingTask(plan: Plan, waveId: number): PlanTask | null {
  const wave = plan.waves.find(w => w.id === waveId);
  if (!wave) return null;
  return wave.tasks.find(t => t.status === 'pending' || t.status === 'running') ?? null;
}

export function isWaveComplete(plan: Plan, waveId: number): boolean {
  const wave = plan.waves.find(w => w.id === waveId);
  if (!wave) return false;
  return wave.tasks.every(t => t.status === 'done');
}

export function isPlanComplete(plan: Plan): boolean {
  return plan.waves.every(w => w.status === 'completed');
}

export function updateWaveStatus(plan: Plan, waveId: number, status: WaveStatus): void {
  const wave = plan.waves.find(w => w.id === waveId);
  if (wave) wave.status = status;
}

export function updatePlanStatus(plan: Plan, status: PlanStatus): void {
  plan.status = status;
}
