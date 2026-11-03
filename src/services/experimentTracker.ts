import type { ExperimentTaskId, ExperimentTaskResult } from '../data/experimentTypes'

export function createAttempt(taskId: ExperimentTaskId): ExperimentTaskResult {
  return {
    taskId,
    taskAttemptId: crypto.randomUUID(),
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
    success: null,
    completionStatus: 'inProgress',
    wrongAttempts: 0,
    clickCount: 0,
    visitedRooms: [],
    answerAccuracy: null,
    searchQueries: [],
    actualResponse: {},
  }
}

export function finishAttempt(attempt: ExperimentTaskResult, completionStatus: Exclude<ExperimentTaskResult['completionStatus'], 'inProgress'>, success: boolean, answerAccuracy: number | null) {
  const endTime = new Date()
  const startTime = new Date(attempt.startTime)
  return {
    ...attempt,
    endTime: endTime.toISOString(),
    duration: Math.max(0, endTime.getTime() - startTime.getTime()),
    success,
    completionStatus,
    answerAccuracy,
  }
}

export function csvEscape(value: unknown) {
  let text = typeof value === 'string' ? value : value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
