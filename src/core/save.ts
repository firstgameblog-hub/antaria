/**
 * Сериализация и разбор сохранения (3.1.1–3.1.3, 3.1.6).
 *
 * Задача разбора — не доверять файлу. Любое поле может отсутствовать,
 * быть не тем типом или содержать мусор: игра обязана либо восстановить
 * разумное значение, либо внятно сказать, что сохранение испорчено.
 */

import { migrate, MigrationError, type SaveRecord } from './migrations'
import { SAVE_VERSION, type ClockState, type FlagValue, type Flags, type GameState, type JournalEntry } from './state'

export class SaveError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function asInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const int = Math.trunc(value)
  if (int < min) return min
  if (int > max) return max
  return int
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asFlagValue(value: unknown): FlagValue | undefined {
  if (typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

function normalizeFlags(value: unknown): Flags {
  const source = asRecord(value)
  const result: Flags = {}
  for (const [key, raw] of Object.entries(source)) {
    const flag = asFlagValue(raw)
    if (flag !== undefined) result[key] = flag
  }
  return result
}

function normalizeJournal(value: unknown): JournalEntry[] {
  if (!Array.isArray(value)) return []
  const entries: JournalEntry[] = []
  for (const raw of value) {
    if (!isRecord(raw)) continue
    const text = asString(raw['text']).trim()
    if (text === '') continue
    entries.push({
      year: asInt(raw['year'], 1, 1, 9999),
      day: asInt(raw['day'], 1, 1, 360),
      text,
    })
  }
  return entries
}

function normalizeClock(value: unknown): ClockState {
  const clock = asRecord(value)
  return {
    year: asInt(clock['year'], 1, 1, 9999),
    day: asInt(clock['day'], 1, 1, 360),
    minutes: asInt(clock['minutes'], 8 * 60, 0, 24 * 60 - 1),
  }
}

/** Приводит произвольные данные к валидному GameState, подставляя разумные значения. */
export function normalizeSave(data: SaveRecord): GameState {
  const player = asRecord(data['player'])
  const village = asRecord(data['village'])

  return {
    version: SAVE_VERSION,
    clock: normalizeClock(data['clock']),
    player: { name: asString(player['name']) },
    village: {
      stageId: asString(village['stageId'], 'stage_dying') || 'stage_dying',
      population: asInt(village['population'], 20, 0, 1_000_000),
    },
    flags: normalizeFlags(data['flags']),
    journal: normalizeJournal(data['journal']),
    playtimeMs: asInt(data['playtimeMs'], 0, 0, Number.MAX_SAFE_INTEGER),
    savedAt: asInt(data['savedAt'], Date.now(), 0, Number.MAX_SAFE_INTEGER),
  }
}

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

/**
 * Разбирает сохранение: JSON -> проверка версии -> миграции -> нормализация.
 * Бросает SaveError с понятной причиной, если файл действительно не спасти.
 */
export function parseSave(raw: string): GameState {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new SaveError('Сохранение повреждено: это не файл сохранения')
  }

  if (!isRecord(data)) {
    throw new SaveError('Сохранение повреждено: неверная структура')
  }

  const version = data['version']
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new SaveError('Сохранение повреждено: не указана версия формата')
  }

  if (version > SAVE_VERSION) {
    throw new SaveError(
      `Сохранение сделано в более новой версии игры (${version}), эта версия понимает до ${SAVE_VERSION}`,
    )
  }

  let migrated: SaveRecord
  try {
    migrated = migrate(data)
  } catch (error) {
    if (error instanceof MigrationError) {
      throw new SaveError(`Сохранение не удалось обновить: ${error.message}`)
    }
    throw error
  }

  return normalizeSave(migrated)
}
