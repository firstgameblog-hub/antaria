/**
 * Состояние узлов сбора (6.1).
 *
 * Храним только время восстановления в абсолютных игровых минутах.
 * Нет записи — значит узел нетронут и готов.
 */

import type { NodeKind } from '../data/gathering'
import type { Season } from './time'

export type NodeReadyAt = Record<string, number>

/** Что растёт круглый год, а что зависит от сезона (6.12). */
const SEASONAL: Partial<Record<NodeKind, Record<Season, number>>> = {
  herb: { spring: 1, summer: 1, autumn: 0.5, winter: 0 },
  berry: { spring: 0.5, summer: 1, autumn: 1, winter: 0 },
}

export function seasonalFactor(kind: NodeKind, season: Season): number {
  return SEASONAL[kind]?.[season] ?? 1
}

/** Сколько даст узел сейчас: зимой трава и ягода не дают ничего. */
export function seasonalYield(count: number, kind: NodeKind, season: Season): number {
  const factor = seasonalFactor(kind, season)
  if (factor <= 0) return 0
  return Math.max(1, Math.floor(count * factor))
}

/** Почему пусто: «зимой не растёт» вместо молчаливого нуля. */
export function dormantReason(kind: NodeKind, season: Season): string | null {
  if (seasonalFactor(kind, season) > 0) return null
  if (kind === 'herb') return 'зимой трава ушла под снег'
  if (kind === 'berry') return 'зимой ягоды не бывает'
  return 'сейчас здесь пусто'
}

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
