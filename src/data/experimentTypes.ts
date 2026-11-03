export type ExperimentCondition = 'A'
export type ExperimentTaskId = 'task_1' | 'task_2' | 'task_3'
export type ExperimentScreen = 'overview' | 'taskInstruction' | 'taskActive' | 'complete'
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

export type ExperimentSession = {
  schemaVersion: 1
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
}
