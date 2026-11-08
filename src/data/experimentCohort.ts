import { CURRENT_EXPERIMENT_VERSION, CURRENT_EXPERIMENT_SCHEMA_VERSION, type ExperimentCohortId, type ExperimentSession } from './experimentTypes'
import { isCohortRemoteWriteAllowed, resolveExperimentCohort } from './experimentCohortPolicy'

export const CURRENT_EXPERIMENT_COHORT_ID = resolveExperimentCohort(import.meta.env.VITE_EXPERIMENT_COHORT_ID, import.meta.env.DEV)

export function canUploadCohortToFirebase(cohortId: ExperimentCohortId | undefined) {
  return isCohortRemoteWriteAllowed(
    cohortId,
    Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY),
    import.meta.env.VITE_ENABLE_QA_FIREBASE_WRITE === 'true',
    import.meta.env.DEV,
  )
}

export function canUploadSessionToFirebase(session: Pick<ExperimentSession, 'experimentVersion' | 'schemaVersion' | 'cohortId'>) {
  return session.experimentVersion === CURRENT_EXPERIMENT_VERSION
    && session.schemaVersion === CURRENT_EXPERIMENT_SCHEMA_VERSION
    && canUploadCohortToFirebase(session.cohortId)
}
