import { doc, setDoc } from 'firebase/firestore'
import type { ExperimentSession, ExperimentTaskResult } from './experimentTypes'
import { firebaseConfigured, firestore, getAnonymousUser } from './firebaseClient'

type InteractionEvent = {
  eventId: string
  eventType: 'click' | 'searchQuery' | 'searchResultSelected' | 'taskHintToggle' | 'task1TargetRoomOpened' | 'task2CalendarOpen' | 'task2CalendarReturn' | 'task3UserScroll'
  occurredAt: string
  [key: string]: unknown
}

export interface RemoteExperimentRepository {
  readonly configured: boolean
  save(session: ExperimentSession): Promise<void>
}

const lastSyncedEvents = new Map<string, Set<string>>()
const saveQueues = new Map<string, Promise<void>>()

function firestoreSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function eventsFromAttempt(attempt: ExperimentTaskResult | null): InteractionEvent[] {
  const events = attempt?.actualResponse.interactionEvents
  return Array.isArray(events) ? events as InteractionEvent[] : []
}

async function syncSession(session: ExperimentSession) {
  if (!firestore) throw new Error('Firestore가 초기화되지 않았습니다.')
  if (session.endedAt) {
    const requiredTasks = ['task_1', 'task_2', 'task_3']
    const hasAllTaskResults = requiredTasks.every((taskId) => session.taskResults.some((result) => result.taskId === taskId))
    if (!hasAllTaskResults) throw new Error('완료 세션의 과업 결과가 모두 준비되지 않았습니다.')
    if (session.experimentVersion && session.screen === 'complete' && !session.feedback) {
      throw new Error('설문 응답 또는 건너뛰기 기록이 준비되지 않았습니다.')
    }
  }
  const user = await getAnonymousUser()
  const uid = user.uid
  if (session.firebaseOwnerUid && session.firebaseOwnerUid !== uid) {
    throw new Error('현재 익명 인증 계정이 이 실험 세션의 소유 계정과 다릅니다.')
  }
  const sessionRef = doc(firestore, 'participants', uid, 'sessions', session.sessionId)
  const { taskResults: _taskResults, currentAttempt, firebaseOwnerUid: _firebaseOwnerUid, feedback: _feedback, ...sessionSummary } = session
  const safeSummary = firestoreSafe({
    ...sessionSummary,
    ownerUid: uid,
    updatedAt: new Date().toISOString(),
    currentAttemptId: currentAttempt?.taskAttemptId ?? null,
  })
  await setDoc(sessionRef, safeSummary, { merge: true })

  const attempts = [...session.taskResults, ...(currentAttempt ? [currentAttempt] : [])]
  await Promise.all(attempts.map((attempt) => setDoc(
    doc(sessionRef, 'taskResults', attempt.taskAttemptId),
    firestoreSafe({ ...attempt, ownerUid: uid, participantId: session.participantId, sessionId: session.sessionId, updatedAt: new Date().toISOString() }),
    { merge: true },
  )))

  const syncedKey = `${uid}:${session.sessionId}`
  const syncedIds = lastSyncedEvents.get(syncedKey) ?? new Set<string>()
  const events = attempts.flatMap(eventsFromAttempt).filter((event) => !syncedIds.has(event.eventId))
  await Promise.all(events.map(async (event) => {
    await setDoc(
      doc(sessionRef, 'events', event.eventId),
      firestoreSafe({ ...event, ownerUid: uid, participantId: session.participantId, sessionId: session.sessionId }),
    )
    syncedIds.add(event.eventId)
  }))
  lastSyncedEvents.set(syncedKey, syncedIds)

  if (session.feedback) {
    await setDoc(
      doc(sessionRef, 'feedback', session.feedback.feedbackId),
      firestoreSafe({ ...session.feedback, ownerUid: uid, participantId: session.participantId, sessionId: session.sessionId, condition: session.condition }),
      { merge: true },
    )
  }
}

export const firebaseExperimentRepository: RemoteExperimentRepository = {
  configured: firebaseConfigured,
  save(session) {
    const previous = saveQueues.get(session.sessionId) ?? Promise.resolve()
    const next = previous.catch(() => undefined).then(() => syncSession(session))
    saveQueues.set(session.sessionId, next)
    void next.finally(() => {
      if (saveQueues.get(session.sessionId) === next) saveQueues.delete(session.sessionId)
    }).catch(() => undefined)
    return next
  },
}
