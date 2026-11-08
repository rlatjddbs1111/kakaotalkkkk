import { CURRENT_EXPERIMENT_VERSION, CURRENT_EXPERIMENT_SCHEMA_VERSION, type ExperimentTaskId, type ExperimentTaskResult } from '../data/experimentTypes.ts'

export function createAttempt(taskId: ExperimentTaskId, experimentVersion?: string, schemaVersion?: number): ExperimentTaskResult {
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
    actualResponse: experimentVersion === CURRENT_EXPERIMENT_VERSION && schemaVersion === CURRENT_EXPERIMENT_SCHEMA_VERSION
      ? taskId === 'task_2'
        ? {
            interactionEvents: [],
            task2ScheduleSubmissions: [],
            firstCalendarOpenAt: null,
            firstCalendarOpenPath: null,
            timeToCalendarOpen: null,
            timeAfterCalendarOpen: null,
          }
        : taskId === 'task_3'
          ? {
              interactionEvents: [],
              task3AnswerSubmissions: [],
              scrollUsed: null,
              firstScrollAt: null,
              firstSearchAt: null,
              explorationStrategy: 'unknown',
              scrollTrackingStatus: 'unknown',
              scrollOrderUncertain: false,
            }
          : taskId === 'task_1'
            ? {
                interactionEvents: [],
                firstTargetRoomOpenAt: null,
                timeToFirstTargetRoomOpen: null,
                firstTargetRoomOpenVisitIndex: null,
              }
            : {}
      : {},
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
