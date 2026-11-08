import type { ExperimentSession } from '../data/experimentTypes'

export type MutableStartRef<T> = { current: T }

export function acquireExperimentStartLock(lock: MutableStartRef<boolean>, hasActiveSession: boolean): boolean {
  if (lock.current || hasActiveSession) return false
  lock.current = true
  return true
}

export function getOrCreatePendingSession(
  pending: MutableStartRef<ExperimentSession | null>,
  create: () => ExperimentSession,
): ExperimentSession {
  if (!pending.current) pending.current = create()
  return pending.current
}
