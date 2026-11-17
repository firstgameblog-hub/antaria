/**
 * Модель времени (3.2.1), стоимость действий (3.2.2), сон (3.2.6), календарь (3.2.7).
 *
 * Главное правило темпа (1.3.7): время двигают только действия игрока и сон.
 * Никаких таймеров в реальном времени и офлайн-прогресса.
 */

import type { ClockState } from './state'

export const MINUTES_PER_DAY = 24 * 60
export const DAYS_PER_SEASON = 20
export const WAKE_MINUTES = 7 * 60

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS.length

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'весна',
  summer: 'лето',
  autumn: 'осень',
  winter: 'зима',
}

/**
 * Стоимость действий в игровых минутах. День — 12 рабочих часов,
 * поэтому каждое действие здесь стоит заметную часть дня (1.3.8, M2).
 */
export type ActionKind = 'move_short' | 'move_long' | 'gather' | 'craft' | 'talk' | 'trade' | 'fight'

export const ACTION_MINUTES: Record<ActionKind, number> = {
  move_short: 5,
  move_long: 15,
  gather: 60,
  craft: 120,
  talk: 60,
  trade: 60,
  fight: 60,
}

/** Вечер: после этого часа работать нельзя, только спать. */
export const DAY_END_MINUTES = 19 * 60
/** Утро: раньше этого часа тоже не работают. */
export const DAY_START_MINUTES = 6 * 60

export interface TimeStep {
  clock: ClockState
  /** Сколько суток прошло за шаг: нужно для ночных событий и следов пропущенных дней. */
  daysPassed: number
}

export function seasonOf(day: number): Season {
  const safeDay = Math.min(Math.max(Math.trunc(day), 1), DAYS_PER_YEAR)
  const index = Math.floor((safeDay - 1) / DAYS_PER_SEASON)
  return SEASONS[index] ?? 'winter'
}

export function dayOfSeason(day: number): number {
  return ((day - 1) % DAYS_PER_SEASON) + 1
}

export function addMinutes(clock: ClockState, minutes: number): TimeStep {
  const step = Math.max(0, Math.trunc(minutes))
  const total = clock.minutes + step

  const daysPassed = Math.floor(total / MINUTES_PER_DAY)
  const minutesOfDay = total % MINUTES_PER_DAY

  let day = clock.day + daysPassed
  let year = clock.year

  while (day > DAYS_PER_YEAR) {
    day -= DAYS_PER_YEAR
    year += 1
  }

  return { clock: { year, day, minutes: minutesOfDay }, daysPassed }
}

/** Сон до утра (3.2.6). Всегда вперёд: если уже утро, то до следующего. */
export function nextMorning(clock: ClockState): TimeStep {
  const untilWake = (WAKE_MINUTES - clock.minutes + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const gap = untilWake === 0 ? MINUTES_PER_DAY : untilWake
  return addMinutes(clock, gap)
}

export function formatTime(minutes: number): string {
  const safe = Math.min(Math.max(Math.trunc(minutes), 0), MINUTES_PER_DAY - 1)
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export function formatDate(clock: ClockState): string {
  return `Год ${clock.year} · ${SEASON_LABELS[seasonOf(clock.day)]} · ${dayOfSeason(clock.day)}-й день`
}

export function formatDateTime(clock: ClockState): string {
  return `${formatDate(clock)} · ${formatTime(clock.minutes)}`
}

/** Можно ли ещё работать: не ночь и не глухая темень. */
export function isWorkingHours(clock: ClockState): boolean {
  return clock.minutes >= DAY_START_MINUTES && clock.minutes < DAY_END_MINUTES
}

/** Время в абсолютных минутах от начала игры: удобно сравнивать сроки. */
export function absoluteMinutes(clock: ClockState): number {
  const dayIndex = (clock.year - 1) * DAYS_PER_YEAR + (clock.day - 1)
  return dayIndex * MINUTES_PER_DAY + clock.minutes
}
