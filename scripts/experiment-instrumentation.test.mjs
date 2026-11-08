import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveTask3Exploration, elapsedMilliseconds } from '../src/services/experimentInstrumentation.ts'
import { createAttempt } from '../src/services/experimentTracker.ts'
import { acquireExperimentStartLock, getOrCreatePendingSession } from '../src/services/experimentStart.ts'
import { isCohortRemoteWriteAllowed, resolveExperimentCohort, usesCurrentV3Instrumentation } from '../src/data/experimentCohortPolicy.ts'

test('elapsed measurement prefers the monotonic performance clock', () => {
  assert.equal(elapsedMilliseconds(100, '2026-11-06T00:00:00.000Z', 550, 0), 450)
})

test('elapsed measurement restores safely from the stored ISO time when the monotonic anchor is unavailable', () => {
  assert.equal(elapsedMilliseconds(null, '2026-11-06T00:00:00.000Z', 10, Date.parse('2026-11-06T00:00:01.250Z')), 1250)
})

test('Task 3 strategy classifies no action and each search/scroll order', () => {
  const monitored = { scrollTrackingStatus: 'monitored', scrollUsed: false }
  assert.deepEqual(deriveTask3Exploration(monitored), { scrollUsed: false, explorationStrategy: 'neither' })
  assert.deepEqual(deriveTask3Exploration({ ...monitored, firstSearchAt: '2026-11-06T00:00:01.000Z' }), { scrollUsed: false, explorationStrategy: 'search_only' })
  assert.deepEqual(deriveTask3Exploration({ ...monitored, scrollUsed: true, firstScrollAt: '2026-11-06T00:00:01.000Z' }), { scrollUsed: true, explorationStrategy: 'scroll_only' })
  assert.equal(deriveTask3Exploration({ ...monitored, scrollUsed: true, firstSearchAt: '2026-11-06T00:00:01.000Z', firstScrollAt: '2026-11-06T00:00:02.000Z' }).explorationStrategy, 'search_first')
  assert.equal(deriveTask3Exploration({ ...monitored, scrollUsed: true, firstSearchAt: '2026-11-06T00:00:02.000Z', firstScrollAt: '2026-11-06T00:00:01.000Z' }).explorationStrategy, 'scroll_first')
})

test('unmonitored and ambiguous scroll histories remain unknown, not false', () => {
  assert.deepEqual(deriveTask3Exploration({ scrollUsed: null, scrollTrackingStatus: 'unknown' }), { scrollUsed: null, explorationStrategy: 'unknown' })
  assert.deepEqual(deriveTask3Exploration({ scrollUsed: false, scrollTrackingStatus: 'uncertain', scrollOrderUncertain: true }), { scrollUsed: null, explorationStrategy: 'unknown' })
})

test('only V3 schema 2 initializes new fields; old schema and versions stay unchanged', () => {
  const attempt = createAttempt('task_1', 'condition-a-v3', 2)
  assert.equal(attempt.actualResponse.firstTargetRoomOpenAt, null)
  assert.equal(attempt.actualResponse.timeToFirstTargetRoomOpen, null)
  assert.equal(attempt.actualResponse.firstTargetRoomOpenVisitIndex, null)
  assert.deepEqual(createAttempt('task_1', 'condition-a-v3', 1).actualResponse, {})
  assert.deepEqual(createAttempt('task_1', 'condition-a-v2').actualResponse, {})
  assert.equal(usesCurrentV3Instrumentation({ experimentVersion: 'condition-a-v3', schemaVersion: 2 }), true)
  assert.equal(usesCurrentV3Instrumentation({ experimentVersion: 'condition-a-v3', schemaVersion: 1 }), false)
})

test('V3 cohort defaults to QA in development and main in production; QA writes require explicit opt-in', () => {
  assert.equal(resolveExperimentCohort(undefined, true), 'condition-a-v3-qa')
  assert.equal(resolveExperimentCohort(undefined, false), 'condition-a-v3-main')
  assert.equal(resolveExperimentCohort('condition-a-v3-main', true), 'condition-a-v3-main')
  assert.equal(isCohortRemoteWriteAllowed('condition-a-v3-qa', true, false, true), false)
  assert.equal(isCohortRemoteWriteAllowed('condition-a-v3-qa', true, true, true), true)
  assert.equal(isCohortRemoteWriteAllowed('condition-a-v3-main', true, false, true), false)
  assert.equal(isCohortRemoteWriteAllowed('condition-a-v3-main', true, false, false), true)
  assert.equal(isCohortRemoteWriteAllowed(undefined, true, false, true), false)
})

test('experiment start is synchronously locked and one pending session is reused across retries', () => {
  const lock = { current: false }
  const pending = { current: null }
  let createCount = 0
  assert.equal(acquireExperimentStartLock(lock, false), true)
  assert.equal(acquireExperimentStartLock(lock, false), false)
  const first = getOrCreatePendingSession(pending, () => { createCount += 1; return { sessionId: 'stable-session' } })
  lock.current = false // equivalent to unlocking after a definite local failure for retry
  assert.equal(acquireExperimentStartLock(lock, false), true)
  const retry = getOrCreatePendingSession(pending, () => { createCount += 1; return { sessionId: 'new-session' } })
  assert.equal(first, retry)
  assert.equal(retry.sessionId, 'stable-session')
  assert.equal(createCount, 1)
  assert.equal(acquireExperimentStartLock({ current: false }, true), false)
})
