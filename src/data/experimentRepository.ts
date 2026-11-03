import type { ExperimentSession } from './experimentTypes'

const STORAGE_KEY = 'kakao-study-experiment-results-v1'

export interface ExperimentRepository {
  readAll(): ExperimentSession[]
  save(session: ExperimentSession): void
  getActive(): ExperimentSession | null
}

export const localExperimentRepository: ExperimentRepository = {
  readAll() {
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
      return Array.isArray(value) ? value as ExperimentSession[] : []
    } catch {
      return []
    }
  },
  save(session) {
    const sessions = this.readAll()
    const index = sessions.findIndex((item) => item.sessionId === session.sessionId)
    if (index < 0) sessions.push(session)
    else sessions[index] = session
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  },
  getActive() {
    return this.readAll().find((session) => !session.endedAt) ?? null
  },
}
