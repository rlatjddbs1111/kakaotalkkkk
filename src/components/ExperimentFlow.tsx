import { createContext, useContext, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { experimentTaskOrder, getTaskExpectedResponse, taskInstructions } from '../data/experimentTasks'
import { getSeoulDate } from '../data/experimentDates'
import { localExperimentRepository } from '../data/experimentRepository'
import { beginAnonymousParticipant, firebaseConfigured, getAnonymousUser } from '../data/firebaseClient'
import { firebaseExperimentRepository } from '../data/firebaseExperimentRepository'
import type { ExperimentSession, ExperimentTaskId, ExperimentTaskResult, ExperimentScreen } from '../data/experimentTypes'
import { createAttempt, csvEscape, finishAttempt } from '../services/experimentTracker'
import type { RegisteredItem } from '../data/registeredItems'
import { conversations } from '../data/conversations'

type ExperimentContextValue = {
  session: ExperimentSession
  taskId: ExperimentTaskId
  attempt: ExperimentTaskResult | null
  recordClick: () => void
  visitRoom: (roomId: string) => void
  chooseRoom: (roomId: string) => void
  notFound: () => void
  recordSearchQuery: (query: string) => void
  selectSearchHit: (roomId: string, messageNumber: number, query: string) => void
  recordSchedule: (item: RegisteredItem, path: 'plus' | 'drawer') => void
  isTask2ScheduleCorrect: (item: RegisteredItem) => boolean
  recordIncorrectTask2Schedule: (item: RegisteredItem, path: 'plus' | 'drawer') => void
  recordIncorrectTask2Type: () => void
  completeTask2Schedule: (item: RegisteredItem, path: 'plus' | 'drawer') => void
  addRegisteredItem: (item: RegisteredItem) => void
  finishCurrentTask: () => void
  submitTask3Answer: (date: string, time: string) => boolean
  dismissTaskFeedback: () => void
  openAbandonDialog: () => void
  closeAbandonDialog: () => void
  confirmAbandon: () => void
  setScreen: (screen: ExperimentScreen) => void
}

const ExperimentContext = createContext<ExperimentContextValue | null>(null)

export function useExperiment() {
  const value = useContext(ExperimentContext)
  if (!value) throw new Error('useExperiment must be used inside ExperimentFlow')
  return value
}

const PARTICIPANT_NAME_DRAFT_KEY = 'kakao-study-participant-name-draft-v1'
const NEW_SESSION_INTENT_KEY = 'kakao-study-new-session-intent-v1'
type FirebaseUploadStatus = 'uploading' | 'synced' | 'pending' | 'error'

function classifyUploadError(error: unknown): FirebaseUploadStatus {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (!navigator.onLine || ['unavailable', 'deadline-exceeded', 'network-request-failed', 'resource-exhausted', 'internal', 'aborted'].some((part) => code.includes(part))) return 'pending'
  return 'error'
}

function readParticipantNameDraft() {
  try {
    return window.localStorage.getItem(PARTICIPANT_NAME_DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

function getRestoredSession() {
  const active = localExperimentRepository.getActive()
  if (active) return active
  try {
    if (window.localStorage.getItem(NEW_SESSION_INTENT_KEY) === 'true') return null
  } catch {
    // Fall through to the latest saved session when storage is unavailable.
  }
  return localExperimentRepository.readAll()
    .filter((item) => item.endedAt)
    .sort((left, right) => (right.endedAt ?? '').localeCompare(left.endedAt ?? ''))[0] ?? null
}

function newSession(participantName: string, firebaseOwnerUid?: string): ExperimentSession {
  const now = new Date()
  const sessionId = crypto.randomUUID()
  const participantNumbers = localExperimentRepository.readAll()
    .map((item) => /^P(\d+)$/.exec(item.participantId)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number)
  const nextParticipantNumber = Math.max(0, ...participantNumbers) + 1
  const participantId = `P${String(nextParticipantNumber).padStart(3, '0')}`
  return {
    schemaVersion: 1,
    participantId,
    participantName,
    condition: 'A',
    sessionId,
    ...(firebaseOwnerUid ? { firebaseOwnerUid } : {}),
    createdAt: now.toISOString(),
    startedAt: now.toISOString(),
    referenceDate: getSeoulDate(now),
    endedAt: null,
    screen: 'overview',
    currentTaskIndex: 0,
    currentAttempt: null,
    taskResults: [],
  }
}

function SystemBottom() {
  return <div className="system-bottom-space" aria-hidden="true"><span className="home-indicator" /></div>
}

const csvHeaders = ['participantId', 'participantName', 'condition', 'sessionId', 'taskId', 'taskAttemptId', 'startTime', 'endTime', 'duration', 'success', 'completionStatus', 'wrongAttempts', 'clickCount', 'visitedRooms', 'answerAccuracy', 'searchQueries', 'submittedAnswers', 'actualResponse', 'registrationPath']

export function downloadSessionsCsv(sessions: ExperimentSession[]) {
  const rows = sessions.flatMap((session) => session.taskResults.map((result) => {
    const submittedAnswers = [
      ...(Array.isArray(result.actualResponse.task2ScheduleSubmissions) ? result.actualResponse.task2ScheduleSubmissions : []),
      ...(Array.isArray(result.actualResponse.task3AnswerSubmissions) ? result.actualResponse.task3AnswerSubmissions : []),
    ]
    return [session.participantId, session.participantName, session.condition, session.sessionId, result.taskId, result.taskAttemptId, result.startTime, result.endTime, result.duration, result.success, result.completionStatus, result.wrongAttempts, result.clickCount, result.visitedRooms, result.answerAccuracy, result.searchQueries, submittedAnswers, result.actualResponse, result.registrationPath]
  }))
  const csv = `\uFEFF${[csvHeaders, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')}`
  const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `kakao-study-results-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(href)
}

function ExperimentFrame({ children }: { children: ReactNode }) {
  return <main className="app-stage"><div className="mobile-frame experiment-frame"><div className="experiment-status"><span>9:41</span><span>● ● ▰</span></div>{children}<SystemBottom /></div></main>
}

export function ExperimentFlow({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ExperimentSession | null>(() => getRestoredSession())
  const [participantNameDraft, setParticipantNameDraft] = useState(readParticipantNameDraft)
  const [showAbandon, setShowAbandon] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [firebaseSyncState, setFirebaseSyncState] = useState<{ sessionId: string; status: FirebaseUploadStatus } | null>(() => {
    const restored = getRestoredSession()
    return restored ? { sessionId: restored.sessionId, status: firebaseConfigured ? 'uploading' : 'pending' } : null
  })
  const sessionRef = useRef(session)
  const syncRequestRef = useRef(0)
  sessionRef.current = session

  useEffect(() => {
    try {
      window.localStorage.setItem(PARTICIPANT_NAME_DRAFT_KEY, participantNameDraft.slice(0, 20))
    } catch {
      // Name draft persistence is best-effort; experiment results retain their own backup.
    }
  }, [participantNameDraft])

  async function uploadFirebaseSession(targetSession: ExperimentSession) {
    const requestId = ++syncRequestRef.current
    if (sessionRef.current?.sessionId === targetSession.sessionId) {
      setFirebaseSyncState({ sessionId: targetSession.sessionId, status: firebaseConfigured ? 'uploading' : 'pending' })
    }
    if (!firebaseConfigured) return
    try {
      await firebaseExperimentRepository.save(targetSession)
      if (requestId === syncRequestRef.current && sessionRef.current?.sessionId === targetSession.sessionId) {
        setFirebaseSyncState({ sessionId: targetSession.sessionId, status: 'synced' })
      }
    } catch (error) {
      if (requestId === syncRequestRef.current && sessionRef.current?.sessionId === targetSession.sessionId) {
        setFirebaseSyncState({ sessionId: targetSession.sessionId, status: classifyUploadError(error) })
      }
    }
  }

  useEffect(() => {
    if (!session) return
    try {
      localExperimentRepository.save(session)
      setStorageError('')
    } catch {
      setStorageError('이 기기에 실험 기록을 저장하지 못했습니다. 저장 공간을 확인해 주세요.')
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    void uploadFirebaseSession(session)
  }, [session])

  const activeTask2Attempt = session?.currentAttempt?.taskId === 'task_2' ? session.currentAttempt : null
  useEffect(() => {
    if (!activeTask2Attempt || activeTask2Attempt.completionStatus !== 'inProgress') return
    const attemptId = activeTask2Attempt.taskAttemptId
    const startedAt = activeTask2Attempt.startTime
    const totalMessages = conversations.room_1.messages.length
    const updateVisibleCount = () => {
      const count = Math.min(totalMessages, Math.floor(Math.max(0, Date.now() - Date.parse(startedAt)) / 400))
      setSession((current) => {
        const attempt = current?.currentAttempt
        if (!current || !attempt || attempt.taskAttemptId !== attemptId) return current
        if (attempt.actualResponse.visibleMessageCount === count) return current
        return { ...current, currentAttempt: { ...attempt, actualResponse: { ...attempt.actualResponse, visibleMessageCount: count } } }
      })
    }
    updateVisibleCount()
    const intervalId = window.setInterval(updateVisibleCount, 100)
    return () => window.clearInterval(intervalId)
  }, [activeTask2Attempt?.taskAttemptId, activeTask2Attempt?.startTime, activeTask2Attempt?.completionStatus])

  function updateAttempt(update: (attempt: ExperimentTaskResult) => ExperimentTaskResult) {
    setSession((current) => current?.currentAttempt ? { ...current, currentAttempt: update(current.currentAttempt) } : current)
  }

  function recordInteraction(eventType: 'click' | 'searchQuery' | 'searchResultSelected', details: Record<string, unknown> = {}) {
    const interactionEvent = { eventId: crypto.randomUUID(), eventType, occurredAt: new Date().toISOString(), ...details }
    updateAttempt((attempt) => ({
      ...attempt,
      clickCount: attempt.clickCount + (eventType === 'click' ? 1 : 0),
      actualResponse: {
        ...attempt.actualResponse,
        interactionEvents: [
          ...(Array.isArray(attempt.actualResponse.interactionEvents) ? attempt.actualResponse.interactionEvents : []),
          interactionEvent,
        ],
      },
    }))
  }

  async function startNew() {
    const participantName = participantNameDraft.trim().slice(0, 20)
    if (!participantName) return
    let firebaseOwnerUid: string | undefined
    if (firebaseConfigured) {
      try {
        const currentUser = await getAnonymousUser()
        const previousSessions = localExperimentRepository.readAll()
          .filter((item) => item.endedAt && item.firebaseOwnerUid === currentUser.uid)
        let previousSessionsSynced = true
        for (const previousSession of previousSessions) {
          try {
            await firebaseExperimentRepository.save(previousSession)
          } catch {
            previousSessionsSynced = false
          }
        }
        firebaseOwnerUid = previousSessionsSynced
          ? (await beginAnonymousParticipant())?.uid
          : currentUser.uid
      } catch {
        // Keep the LocalStorage backup and let the completed screen report the unconfirmed upload.
      }
    }
    setParticipantNameDraft(participantName)
    try {
      window.localStorage.removeItem(NEW_SESSION_INTENT_KEY)
    } catch {
      // The newly created in-memory session can still proceed.
    }
    setSession(newSession(participantName, firebaseOwnerUid))
  }

  function prepareAnotherSession(participantName: string) {
    setParticipantNameDraft(participantName)
    try {
      window.localStorage.setItem(NEW_SESSION_INTENT_KEY, 'true')
    } catch {
      // Best-effort persistence for the registration screen.
    }
    setFirebaseSyncState(null)
    setSession(null)
  }

  function startTask() {
    setSession((current) => current ? { ...current, screen: 'taskActive', currentAttempt: createAttempt(experimentTaskOrder[current.currentTaskIndex]) } : current)
  }

  function complete(status: 'success' | 'failure' | 'abandoned' | 'timeout', success: boolean, accuracy: number | null, extra: Record<string, unknown> = {}) {
    setSession((current) => {
      if (!current?.currentAttempt || current.currentAttempt.completionStatus !== 'inProgress') return current
      const taskResult = finishAttempt({ ...current.currentAttempt, actualResponse: { ...current.currentAttempt.actualResponse, ...extra } }, status, success, accuracy)
      const taskResults = [...current.taskResults.filter((item) => item.taskAttemptId !== taskResult.taskAttemptId), taskResult]
      const nextIndex = current.currentTaskIndex + 1
      const lastTask = nextIndex >= experimentTaskOrder.length
      return {
        ...current,
        endedAt: lastTask ? taskResult.endTime : null,
        screen: lastTask ? 'complete' : 'taskInstruction',
        currentTaskIndex: lastTask ? current.currentTaskIndex : nextIndex,
        currentAttempt: null,
        taskResults,
      }
    })
    setShowAbandon(false)
  }

  function finishCurrentTask() {
    if (!session?.currentAttempt) return
    const taskId = session.currentAttempt.taskId
    const expected = getTaskExpectedResponse(taskId, session)
    const response = session.currentAttempt.actualResponse
    if (taskId === 'task_1') {
      const success = response.selectedRoomId === expected.roomId
      complete(success ? 'success' : 'failure', success, success ? 1 : 0)
      return
    }
    if (taskId === 'task_2') {
      const registered = response.registeredSchedule as { date?: string; time?: string; location?: string } | undefined
      const fields = [registered?.date === expected.date, registered?.time === expected.time, registered?.location?.trim() === expected.location]
      const accuracy = fields.filter(Boolean).length / fields.length
      complete(accuracy === 1 ? 'success' : 'failure', accuracy === 1, accuracy)
      return
    }
    const selection = response.selectedMessage as { roomId?: string; messageNumber?: number } | undefined
    const success = selection?.roomId === expected.roomId && selection?.messageNumber === expected.messageNumber
    complete(success ? 'success' : 'failure', success, success ? 1 : 0)
  }

  function contextClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('[data-count-experiment-click="true"]')) {
      const countedControl = target.closest('[data-count-experiment-click="true"]')
      recordInteraction('click', { target: countedControl?.getAttribute('aria-label') || countedControl?.textContent?.trim().slice(0, 80) || 'experiment-control' })
      return
    }
    if (target.closest('[data-experiment-ui="true"]')) return
    const control = target.closest('button, a, input, select, textarea, [role="button"]')
    if (control) {
      recordInteraction('click', {
        target: control.getAttribute('aria-label') || control.getAttribute('title') || control.tagName.toLowerCase(),
        controlType: control.tagName.toLowerCase(),
      })
    }
  }

  function recordSchedule(item: RegisteredItem, path: 'plus' | 'drawer') {
    if (item.kind !== 'schedule') return
    updateAttempt((attempt) => {
      const expected = getTaskExpectedResponse('task_2', session!)
      const submissions = Array.isArray(attempt.actualResponse.task2ScheduleSubmissions) ? attempt.actualResponse.task2ScheduleSubmissions as unknown[] : []
      return {
        ...attempt,
        registrationPath: path,
        actualResponse: {
          ...attempt.actualResponse,
          registeredSchedule: { id: item.id, title: item.title, date: item.date, time: item.time, location: item.location },
          task2ScheduleSubmissions: [...submissions, { date: item.date, time: item.time, title: item.title, location: item.location, submittedAt: new Date().toISOString(), correct: item.date === expected.date && item.time === expected.time }],
        },
      }
    })
  }

  function isTask2ScheduleCorrect(item: RegisteredItem) {
    if (item.kind !== 'schedule') return false
    const expected = getTaskExpectedResponse('task_2', session!)
    return item.date === expected.date && item.time === expected.time
  }

  function recordIncorrectTask2Schedule(item: RegisteredItem, path: 'plus' | 'drawer') {
    if (item.kind !== 'schedule') return
    updateAttempt((attempt) => ({
      ...attempt,
      wrongAttempts: attempt.wrongAttempts + 1,
      registrationPath: path,
      actualResponse: {
        ...attempt.actualResponse,
        task2ScheduleSubmissions: [...(Array.isArray(attempt.actualResponse.task2ScheduleSubmissions) ? attempt.actualResponse.task2ScheduleSubmissions as unknown[] : []), { date: item.date, time: item.time, title: item.title, location: item.location, submittedAt: new Date().toISOString(), correct: false }],
        taskFeedback: 'task2Schedule',
        taskFeedbackDismissed: false,
      },
    }))
  }

  function recordIncorrectTask2Type() {
    updateAttempt((attempt) => ({
      ...attempt,
      wrongAttempts: attempt.wrongAttempts + 1,
      actualResponse: { ...attempt.actualResponse, taskFeedback: 'task2Type', taskFeedbackDismissed: false },
    }))
  }

  function submitTask3Answer(date: string, time: string) {
    if (!session?.currentAttempt || session.currentAttempt.taskId !== 'task_3') return false
    const expected = getTaskExpectedResponse('task_3', session)
    const correct = date === expected.date && time === expected.time
    updateAttempt((attempt) => ({
      ...attempt,
      wrongAttempts: attempt.wrongAttempts + (correct ? 0 : 1),
      actualResponse: {
        ...attempt.actualResponse,
        lastTask3Answer: { date, time },
        task3AnswerSubmissions: [...(Array.isArray(attempt.actualResponse.task3AnswerSubmissions) ? attempt.actualResponse.task3AnswerSubmissions as unknown[] : []), { date, time, submittedAt: new Date().toISOString(), correct }],
        taskFeedback: correct ? null : 'task3Answer',
        taskFeedbackDismissed: false,
      },
    }))
    if (correct) complete('success', true, 1, { finalTask3Answer: { date, time } })
    return correct
  }

  function dismissTaskFeedback() {
    updateAttempt((attempt) => ({ ...attempt, actualResponse: { ...attempt.actualResponse, taskFeedbackDismissed: true } }))
  }

  function openAbandonDialog() {
    dismissTaskFeedback()
    setShowAbandon(true)
  }

  const taskId = session ? experimentTaskOrder[session.currentTaskIndex] : 'task_1'
  const contextValue = useMemo<ExperimentContextValue | null>(() => session ? ({
    session,
    taskId,
    attempt: session.currentAttempt,
    recordClick: () => recordInteraction('click', { target: 'explicit-click' }),
    visitRoom: (roomId) => updateAttempt((attempt) => ({ ...attempt, visitedRooms: [...attempt.visitedRooms, roomId] })),
    chooseRoom: (roomId) => {
      const correct = roomId === 'room_1'
      updateAttempt((attempt) => ({ ...attempt, wrongAttempts: attempt.wrongAttempts + (correct ? 0 : 1), actualResponse: { ...attempt.actualResponse, selectedRoomId: roomId } }))
      if (correct) complete('success', true, 1, { selectedRoomId: roomId })
    },
    notFound: () => complete('failure', false, 0, { selectedRoomId: null, response: 'notFound' }),
    recordSearchQuery: (query) => {
      const value = query.trim()
      if (!value) return
      const interactionEvent = { eventId: crypto.randomUUID(), eventType: 'searchQuery', occurredAt: new Date().toISOString(), query: value }
      updateAttempt((attempt) => ({
        ...attempt,
        searchQueries: [...attempt.searchQueries, value],
        actualResponse: { ...attempt.actualResponse, interactionEvents: [...(Array.isArray(attempt.actualResponse.interactionEvents) ? attempt.actualResponse.interactionEvents : []), interactionEvent] },
      }))
    },
    selectSearchHit: (roomId, messageNumber, query) => {
      const expected = getTaskExpectedResponse('task_3', session)
      const correct = roomId === expected.roomId && messageNumber === expected.messageNumber
      updateAttempt((attempt) => ({
        ...attempt,
        wrongAttempts: attempt.wrongAttempts + (correct ? 0 : 1),
        searchQueries: query.trim() && attempt.searchQueries.at(-1) !== query.trim() ? [...attempt.searchQueries, query.trim()] : attempt.searchQueries,
        actualResponse: {
          ...attempt.actualResponse,
          selectedMessage: { roomId, messageNumber, query: query.trim() },
          interactionEvents: [
            ...(Array.isArray(attempt.actualResponse.interactionEvents) ? attempt.actualResponse.interactionEvents : []),
            { eventId: crypto.randomUUID(), eventType: 'searchResultSelected', occurredAt: new Date().toISOString(), roomId, messageNumber, query: query.trim() },
          ],
        },
      }))
    },
    recordSchedule,
    isTask2ScheduleCorrect,
    recordIncorrectTask2Schedule,
    recordIncorrectTask2Type,
    completeTask2Schedule: (item, path) => {
      recordSchedule(item, path)
      complete('success', true, 1)
    },
    addRegisteredItem: (item) => updateAttempt((attempt) => ({ ...attempt, actualResponse: { ...attempt.actualResponse, registeredItemId: item.id } })),
    finishCurrentTask,
    submitTask3Answer,
    dismissTaskFeedback,
    openAbandonDialog,
    closeAbandonDialog: () => setShowAbandon(false),
    confirmAbandon: () => complete('abandoned', false, 0, { abandoned: true }),
    setScreen: (screen) => setSession((current) => current ? { ...current, screen } : current),
  }) : null, [session, taskId])

  if (!session) {
    return <ExperimentFrame><section className="experiment-page experiment-welcome">
      <p className="experiment-eyebrow">인간공학 사용성 실험</p>
      <h1>카카오톡 사용성 실험</h1>
      <p>실험 결과를 구분하기 위한 이름을 입력해 주세요.<br />실명 대신 별명을 사용해도 됩니다.</p>
      <label className="participant-name-field">
        <span>이름 또는 별명</span>
        <input
          type="text"
          value={participantNameDraft}
          onChange={(event) => setParticipantNameDraft(event.currentTarget.value.slice(0, 20))}
          onBlur={(event) => setParticipantNameDraft(event.currentTarget.value.trim().slice(0, 20))}
          placeholder="이름 또는 별명 입력"
          maxLength={20}
          autoComplete="nickname"
          aria-label="이름 또는 별명 입력"
        />
      </label>
      {storageError && <p role="alert" className="experiment-error">{storageError}</p>}
      {!firebaseConfigured && <p className="experiment-cloud-note">Firebase 설정 대기 중 · 현재 기기에만 저장됩니다.</p>}
      <button type="button" className="experiment-primary" onClick={startNew} disabled={!participantNameDraft.trim()}>실험 시작</button>
    </section></ExperimentFrame>
  }

  if (session.screen === 'overview') {
    return <ExperimentFrame><section className="experiment-page">
      <p className="experiment-eyebrow">실험 준비</p><h1>시작 안내</h1>
      <div className="experiment-info-card"><span>참가자 ID</span><strong>{session.participantId}</strong><span>실험용 이름</span><strong>{session.participantName}</strong><span>실험 조건</span><strong>Condition A</strong></div>
      <p>화면에 표시되는 안내에 따라 3개의 과업을 순서대로 수행해 주세요.</p>
      {storageError && <p role="alert" className="experiment-error">{storageError}</p>}
      {!firebaseConfigured && <p className="experiment-cloud-note">Firebase 설정 대기 중 · 현재 기기에만 저장됩니다.</p>}
      <button type="button" className="experiment-primary" onClick={() => setSession((current) => current ? { ...current, screen: 'taskInstruction' } : current)}>안내 확인</button>
    </section></ExperimentFrame>
  }

  if (session.screen === 'taskInstruction') {
    const task = taskInstructions[taskId]
    return <ExperimentFrame><section className="experiment-page">
      <p className="experiment-eyebrow">{session.currentTaskIndex + 1} / {experimentTaskOrder.length}</p><h1>{task.title}</h1>
      <p className="experiment-task-prompt">{task.prompt}</p>
      <button type="button" className="experiment-primary" data-experiment-ui="true" onClick={startTask}>과업 시작</button>
    </section></ExperimentFrame>
  }

  if (session.screen === 'complete') {
    const finishedSession = session
    const uploadStatus = firebaseSyncState?.sessionId === finishedSession.sessionId
      ? firebaseSyncState.status
      : firebaseConfigured ? 'uploading' : 'pending'
    const uploadMessage = !firebaseConfigured
      ? '⚠ Firebase 설정이 없어 서버 전송을 확인할 수 없습니다. 결과는 이 기기에 저장되어 있습니다.'
      : uploadStatus === 'synced'
        ? '✓ 실험 결과가 정상적으로 제출되었습니다.'
        : uploadStatus === 'uploading'
          ? '⏳ 실험 결과를 전송하고 있습니다.'
          : uploadStatus === 'pending'
            ? '⚠ 실험 결과를 아직 전송하지 못했습니다. 인터넷 연결을 확인해 주세요.'
            : '⚠ 실험 결과를 전송하지 못했습니다. 진행자에게 알려주세요.'
    return <ExperimentFrame><section className="experiment-page experiment-complete">
      <p className="experiment-eyebrow">실험 완료</p><h1>실험이 완료되었습니다.</h1>
      <p>참가자 ID: <strong>{finishedSession.participantId}</strong></p>
      <div className="experiment-result-list">{finishedSession.taskResults.map((result) => <article key={result.taskAttemptId}><strong>{taskInstructions[result.taskId].title}</strong><span>{result.completionStatus === 'success' ? '성공' : result.completionStatus === 'abandoned' ? '중단' : '미완료'} · {result.duration === null ? '—' : `${(result.duration / 1000).toFixed(1)}초`}</span></article>)}</div>
      {storageError && <p role="alert" className="experiment-error">{storageError}</p>}
      <section className={`experiment-upload-state is-${uploadStatus}`} aria-live="polite" aria-label="실험 결과 저장 상태">
        <h2>실험 결과 저장 상태</h2>
        <p>{uploadMessage}</p>
        {(uploadStatus === 'pending' || uploadStatus === 'error') && <button type="button" className="experiment-secondary" onClick={() => { void uploadFirebaseSession(finishedSession) }}>다시 전송</button>}
      </section>
      <button type="button" className="experiment-primary" onClick={() => prepareAnotherSession(finishedSession.participantName)}>다시하기</button>
    </section></ExperimentFrame>
  }

  if (!contextValue) return null
  return <ExperimentContext.Provider value={contextValue}>
    <div className="experiment-active" onClickCapture={contextClick}>
      {children}
      {Boolean(session.currentAttempt?.actualResponse.taskFeedback && !session.currentAttempt.actualResponse.taskFeedbackDismissed && !showAbandon) && <div className="experiment-dialog-backdrop" data-experiment-ui="true"><section role="alertdialog" aria-modal="true" className="experiment-confirm-dialog"><h2>{session.currentAttempt?.actualResponse.taskFeedback === 'task2Schedule' ? '등록한 일정의 날짜 또는 시간이 올바르지 않습니다.' : session.currentAttempt?.actualResponse.taskFeedback === 'task2Type' ? '일정으로 등록해 주세요.' : '입력한 날짜 또는 시간이 올바르지 않습니다.'}</h2><button type="button" onClick={dismissTaskFeedback}>다시 시도</button><button type="button" onClick={openAbandonDialog}>과업 포기</button></section></div>}
      {showAbandon && <div className="experiment-dialog-backdrop" data-experiment-ui="true"><section role="dialog" aria-modal="true" className="experiment-confirm-dialog"><h2>과업을 중단하시겠습니까?</h2><p>중단하면 현재 과업은 완료되지 않은 것으로 기록됩니다.</p><button type="button" onClick={() => setShowAbandon(false)}>계속 진행</button><button type="button" onClick={() => complete('abandoned', false, 0, { abandoned: true })}>과업 중단</button></section></div>}
      {storageError && <div className="experiment-storage-warning" role="alert">{storageError}</div>}
    </div>
  </ExperimentContext.Provider>
}

export function TaskControls({ taskId, selectedRoomId, onAbandon, onWrongRoom }: { taskId: ExperimentTaskId; selectedRoomId?: string; onAbandon: () => void; onWrongRoom: () => void }) {
  const experiment = useExperiment()
  const savedAnswer = experiment.attempt?.actualResponse.lastTask3Answer as { date?: string; time?: string } | undefined
  const [date, setDate] = useState(savedAnswer?.date ?? '')
  const [time, setTime] = useState(savedAnswer?.time ?? '')
  const submittingRef = useRef(false)
  if (taskId === 'task_1') {
    return <div className="experiment-task-controls" data-experiment-ui="true">
      {selectedRoomId && <button type="button" data-count-experiment-click="true" onClick={() => { experiment.chooseRoom(selectedRoomId); if (selectedRoomId !== 'room_1') onWrongRoom() }}>이 채팅방입니다</button>}
      <button type="button" data-count-experiment-click="true" onClick={experiment.notFound}>찾지 못했습니다</button>
    </div>
  }
  if (taskId === 'task_2') return <div className="experiment-task-controls" data-experiment-ui="true"><button type="button" data-count-experiment-click="true" className="experiment-abandon-button" onClick={onAbandon}>과업 포기</button></div>

  return <div className="experiment-task-controls task3-answer-controls" data-experiment-ui="true">
    <form className="task3-answer-form" onSubmit={(event) => { event.preventDefault(); if (submittingRef.current) return; submittingRef.current = true; if (!experiment.submitTask3Answer(date, normalizeTaskTime(time))) submittingRef.current = false }}>
      <label>정모 날짜<input aria-label="정모 날짜 답안" type="date" value={date} onChange={(event) => setDate(event.currentTarget.value)} /></label>
      <label>정모 시간<input aria-label="정모 시간 답안" type="time" value={time} onChange={(event) => setTime(event.currentTarget.value)} /></label>
      <button type="submit" data-count-experiment-click="true" disabled={!date || !time}>정답 제출</button>
    </form>
    <button type="button" data-count-experiment-click="true" className="experiment-abandon-button" onClick={onAbandon}>과업 포기</button>
  </div>
}

function normalizeTaskTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)(?:\s*(AM|PM))?$/i)
  if (!match) return ''
  let hour = Number(match[1])
  const meridiem = match[3]?.toUpperCase()
  if (meridiem) {
    if (hour < 1 || hour > 12) return ''
    hour = (hour % 12) + (meridiem === 'PM' ? 12 : 0)
  }
  if (hour < 0 || hour > 23) return ''
  return `${String(hour).padStart(2, '0')}:${match[2]}`
}
