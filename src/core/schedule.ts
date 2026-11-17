/**
 * Распорядок жителей (9.9, продолжение).
 *
 * У каждого человека есть места на день: где он утром, где днём, где вечером.
 * Ночью он спит, и на улице его нет. Время берётся из игровых часов,
 * реальные таймеры не используются (1.3.7).
 */

export interface ScheduleStop {
  /** С какого часа действует это место, в минутах от полуночи. */
  from: number
  /** Где человек стоит. */
  x: number
  y: number
  /** Что он там делает: подпись для подсказки. */
  note?: string
}

export interface ScheduleView {
  x: number
  y: number
  note: string | null
}

/** Распорядок по умолчанию: с 6 до 21 человек на улице, потом спит. */
export const WAKE_FROM = 6 * 60
export const WAKE_TO = 21 * 60

export function isAsleep(minutes: number): boolean {
  return minutes < WAKE_FROM || minutes >= WAKE_TO
}

/**
 * Где человек сейчас. Возвращает null, если он спит.
 * Останавливается на последней остановке, которая уже наступила.
 */
export function positionAt(
  stops: readonly ScheduleStop[],
  minutes: number,
): ScheduleView | null {
  if (stops.length === 0) return null
  if (isAsleep(minutes)) return null

  let current = stops[0]
  for (const stop of stops) {
    if (stop.from <= minutes) current = stop
  }

  if (!current) return null
  return { x: current.x, y: current.y, note: current.note ?? null }
}
