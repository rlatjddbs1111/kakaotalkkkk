export type ExperimentCondition = 'A'
export const CURRENT_EXPERIMENT_VERSION = 'condition-a-v4'
export const CURRENT_EXPERIMENT_SCHEMA_VERSION = 2 as const
export type ExperimentCohortId = 'condition-a-v4-main' | 'condition-a-v4-qa'
export type ExperimentTaskId = 'task_1' | 'task_2' | 'task_3'
export type ExperimentScreen = 'overview' | 'taskInstruction' | 'taskActive' | 'feedback' | 'complete'
export type CompletionStatus = 'inProgress' | 'success' | 'failure' | 'abandoned' | 'timeout'

export type ExperimentTaskResult = {
  taskId: ExperimentTaskId
  taskAttemptId: string
  startTime: string
  endTime: string | null
  duration: number | null
  success: boolean | null
  completionStatus: CompletionStatus
  wrongAttempts: number
  clickCount: number
  visitedRooms: string[]
  answerAccuracy: number | null
  searchQueries: string[]
  actualResponse: Record<string, unknown>
  registrationPath?: 'plus' | 'drawer'
}

export type ExperimentFeedback = {
  feedbackId: string
  difficultyRating: 1 | 2 | 3 | 4 | 5 | null
  comment: string
  skipped: boolean
  submittedAt: string
}

export type ExperimentSession = {
  schemaVersion: 1 | 2
  experimentVersion?: string
  cohortId?: ExperimentCohortId
  participantId: string
  participantName: string
  condition: ExperimentCondition
  sessionId: string
  firebaseOwnerUid?: string
  createdAt: string
  startedAt: string
  referenceDate?: string
  endedAt: string | null
  screen: ExperimentScreen
  currentTaskIndex: number
  currentAttempt: ExperimentTaskResult | null
  taskResults: ExperimentTaskResult[]
  feedback?: ExperimentFeedback
}
