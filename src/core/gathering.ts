/**
 * Состояние узлов сбора (6.1).
 *
 * Храним только время восстановления в абсолютных игровых минутах.
 * Нет записи — значит узел нетронут и готов.
 */

export type NodeReadyAt = Record<string, number>

export function isReady(nodes: NodeReadyAt, id: string, now: number): boolean {
  const readyAt = nodes[id]
  return readyAt === undefined || now >= readyAt
}

export function minutesUntilReady(nodes: NodeReadyAt, id: string, now: number): number {
  const readyAt = nodes[id]
  if (readyAt === undefined) return 0
  return Math.max(0, readyAt - now)
}

export function markGathered(
  nodes: NodeReadyAt,
  id: string,
  now: number,
  restoreMinutes: number,
): void {
  nodes[id] = now + Math.max(1, Math.round(restoreMinutes))
}

/** Понятная человеку запись «через сколько вернётся». */
export function describeRestore(minutes: number): string {
  if (minutes <= 0) return 'готово'
  if (minutes < 60) return `через ${Math.ceil(minutes)} мин`
  if (minutes < 24 * 60) return `через ${Math.ceil(minutes / 60)} ч`
  return `через ${Math.ceil(minutes / (24 * 60))} дн`
}
