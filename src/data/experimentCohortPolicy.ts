import { CURRENT_EXPERIMENT_VERSION, VERSION_3_SCHEMA_VERSION, type ExperimentCohortId, type ExperimentSession } from './experimentTypes.ts'

export function usesCurrentV3Instrumentation(session: Pick<ExperimentSession, 'experimentVersion' | 'schemaVersion'>) {
  return session.experimentVersion === CURRENT_EXPERIMENT_VERSION && session.schemaVersion === VERSION_3_SCHEMA_VERSION
}

export function resolveExperimentCohort(configuredCohort: string | undefined, isDevelopment: boolean): ExperimentCohortId {
  if (configuredCohort === 'condition-a-v3-main') return 'condition-a-v3-main'
  if (configuredCohort === 'condition-a-v3-qa') return 'condition-a-v3-qa'
  return isDevelopment ? 'condition-a-v3-qa' : 'condition-a-v3-main'
}

export function isCohortRemoteWriteAllowed(cohortId: ExperimentCohortId | undefined, firebaseConfigured: boolean, allowQaFirebaseWrite: boolean, isDevelopment: boolean) {
  if (!firebaseConfigured) return false
  if (cohortId === 'condition-a-v3-main') return !isDevelopment
  if (cohortId === 'condition-a-v3-qa') return allowQaFirebaseWrite
  return false
}
