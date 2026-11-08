export type ExplorationStrategy = 'search_only' | 'scroll_only' | 'search_first' | 'scroll_first' | 'neither' | 'unknown'

export function elapsedMilliseconds(startedPerformanceMs: number | null, startedAt: string, nowPerformanceMs: number, wallNowMs: number): number {
  if (startedPerformanceMs !== null && Number.isFinite(startedPerformanceMs) && Number.isFinite(nowPerformanceMs) && nowPerformanceMs >= startedPerformanceMs) {
    return nowPerformanceMs - startedPerformanceMs
  }
  const wallStartMs = Date.parse(startedAt)
  return Number.isFinite(wallStartMs) ? Math.max(0, wallNowMs - wallStartMs) : 0
}

export function deriveTask3Exploration(response: Record<string, unknown>): { scrollUsed: boolean | null; explorationStrategy: ExplorationStrategy } {
  const scrollUsed = response.scrollUsed === true
    ? true
    : response.scrollTrackingStatus === 'monitored' && response.scrollOrderUncertain !== true
      ? false
      : null
  const firstSearchAt = typeof response.firstSearchAt === 'string' ? response.firstSearchAt : null
  const firstScrollAt = typeof response.firstScrollAt === 'string' ? response.firstScrollAt : null
  if (response.scrollOrderUncertain === true || scrollUsed === null) return { scrollUsed, explorationStrategy: 'unknown' }
  if (firstSearchAt && firstScrollAt) return { scrollUsed, explorationStrategy: firstSearchAt <= firstScrollAt ? 'search_first' : 'scroll_first' }
  if (firstSearchAt) return { scrollUsed, explorationStrategy: 'search_only' }
  if (scrollUsed) return { scrollUsed, explorationStrategy: 'scroll_only' }
  return { scrollUsed, explorationStrategy: 'neither' }
}
