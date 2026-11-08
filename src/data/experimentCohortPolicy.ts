import { CURRENT_EXPERIMENT_VERSION, CURRENT_EXPERIMENT_SCHEMA_VERSION, type ExperimentCohortId, type ExperimentSession } from './experimentTypes.ts'

export function usesCurrentInstrumentation(session: Pick<ExperimentSession, 'experimentVersion' | 'schemaVersion'>) {
  return session.experimentVersion === CURRENT_EXPERIMENT_VERSION && session.schemaVersion === CURRENT_EXPERIMENT_SCHEMA_VERSION
}

export function resolveExperimentCohort(configuredCohort: string | undefined, isDevelopment: boolean): ExperimentCohortId {
  if (configuredCohort === 'condition-a-v4-main') return 'condition-a-v4-main'
  if (configuredCohort === 'condition-a-v4-qa') return 'condition-a-v4-qa'
  return isDevelopment ? 'condition-a-v4-qa' : 'condition-a-v4-main'
}

export function isCohortRemoteWriteAllowed(cohortId: ExperimentCohortId | undefined, firebaseConfigured: boolean, allowQaFirebaseWrite: boolean, isDevelopment: boolean) {
  if (!firebaseConfigured) return false
  if (cohortId === 'condition-a-v4-main') return !isDevelopment
  if (cohortId === 'condition-a-v4-qa') return allowQaFirebaseWrite
  return false
}
