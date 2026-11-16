/**
 * Сериализация и разбор сохранения (3.1.1–3.1.3, 3.1.6).
 *
 * Задача разбора — не доверять файлу. Любое поле может отсутствовать,
 * быть не тем типом или содержать мусор: игра обязана либо восстановить
 * разумное значение, либо внятно сказать, что сохранение испорчено.
 */

import { migrate, MigrationError, type SaveRecord } from './migrations'
import type { Equipment, Inventory, Stack } from './inventory'
import type { Facing, Point } from './movement'
import { DAYS_PER_YEAR } from './time'
import {
  PLAYER_CAPACITY_KG,
  SAVE_VERSION,
  SPAWN_POINT,
  VILLAGE_STORAGE_KG,
  type ClockState,
  type FlagValue,
  type Flags,
  type GameState,
  type JournalEntry,
  type StoryProgress,
} from './state'

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

function asNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(value, min), max)
}

function normalizePosition(value: unknown): Point {
  const source = asRecord(value)
  return {
    x: asNumber(source['x'], SPAWN_POINT.x, -10_000, 100_000),
    y: asNumber(source['y'], SPAWN_POINT.y, -10_000, 100_000),
  }
}

function normalizeFacing(value: unknown): Facing {
  return value === 'up' || value === 'down' || value === 'left' || value === 'right' ? value : 'down'
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

    const entry: JournalEntry = {
      year: asInt(raw['year'], 1, 1, 9999),
      day: asInt(raw['day'], 1, 1, 360),
      text,
    }

    const minutes = raw['minutes']
    if (typeof minutes === 'number' && Number.isFinite(minutes)) {
      entry.minutes = asInt(minutes, 0, 0, 24 * 60 - 1)
    }

    entries.push(entry)
  }
  return entries
}

function normalizeInventory(value: unknown, capacityKg: number): Inventory {
  const source = asRecord(value)
  const rawCapacity = source['capacityKg']
  const capacity =
    typeof rawCapacity === 'number' && Number.isFinite(rawCapacity) && rawCapacity > 0
      ? rawCapacity
      : capacityKg

  const stacks: Stack[] = []
  const rawStacks = source['stacks']
  if (Array.isArray(rawStacks)) {
    for (const entry of rawStacks) {
      if (!isRecord(entry)) continue

      const id = asString(entry['id'])
      const count = asInt(entry['count'], 0, 0, 1_000_000)
      if (id === '' || count <= 0) continue

      const rawQuality = entry['quality']
      const quality =
        typeof rawQuality === 'number' && Number.isFinite(rawQuality)
          ? Math.min(1, Math.max(0, rawQuality))
          : 1

      stacks.push({ id, count, quality })
    }
  }

  return { capacityKg: capacity, stacks }
}

function normalizeNodes(value: unknown): Record<string, number> {
  const source = asRecord(value)
  const nodes: Record<string, number> = {}
  for (const [key, raw] of Object.entries(source)) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      nodes[key] = Math.trunc(raw)
    }
  }
  return nodes
}

function normalizeEquipment(value: unknown): Equipment {  const source = asRecord(value)
  const readSlot = (key: string): string | null => {
    const raw = source[key]
    return typeof raw === 'string' && raw !== '' ? raw : null
  }

  return {
    tool: readSlot('tool'),
    weapon: readSlot('weapon'),
    armor: readSlot('armor'),
  }
}

function normalizeStory(value: unknown): StoryProgress | null {
  if (!isRecord(value)) return null

  const sceneId = asString(value['sceneId']).trim()
  if (sceneId === '') return null

  return {
    sceneId,
    beat: asInt(value['beat'], 0, 0, 10_000),
  }
}

function normalizeClock(value: unknown): ClockState {
  const clock = asRecord(value)
  return {
    year: asInt(clock['year'], 1, 1, 9999),
    day: asInt(clock['day'], 1, 1, DAYS_PER_YEAR),
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
    player: {
      name: asString(player['name']),
      position: normalizePosition(player['position']),
      facing: normalizeFacing(player['facing']),
      money: asInt(player['money'], 0, 0, 1_000_000_000),
      inventory: normalizeInventory(player['inventory'], PLAYER_CAPACITY_KG),
      equipment: normalizeEquipment(player['equipment']),
    },
    village: {
      stageId: asString(village['stageId'], 'stage_dying') || 'stage_dying',
      population: asInt(village['population'], 20, 0, 1_000_000),
      storage: normalizeInventory(village['storage'], VILLAGE_STORAGE_KG),
    },
    world: {
      nodes: normalizeNodes(asRecord(data['world'])['nodes']),
      trader: {
        trust: asInt(asRecord(asRecord(data['world'])['trader'])['trust'], 0, 0, 100),
      },
    },
    flags: normalizeFlags(data['flags']),
    journal: normalizeJournal(data['journal']),
    story: normalizeStory(data['story']),
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
