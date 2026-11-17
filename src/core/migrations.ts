/**
 * Миграции формата сохранения (3.1.3, 3.1.8).
 *
 * Правило: сохранение старой версии обязано грузиться.
 * Поэтому любое изменение структуры GameState сопровождается миграцией
 * и поднятием SAVE_VERSION.
 */

import { SAVE_VERSION } from './state'

export type SaveRecord = Record<string, unknown>

/** Миграция поднимает сохранение с версии `from` до `from + 1`. */
type Migration = (data: SaveRecord) => SaveRecord

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/**
 * Ключ — версия, С КОТОРОЙ мигрируем.
 *
 * 1 → 2: появились инвентарь героя, экипировка и склад деревни (3.4).
 */
const migrations: Record<number, Migration> = {
  1: (data) => ({
    ...data,
    version: 2,
    player: {
      ...asRecord(data['player']),
      inventory: { capacityKg: 25, stacks: [] },
      equipment: { tool: null, weapon: null, armor: null },
    },
    village: {
      ...asRecord(data['village']),
      storage: { capacityKg: 1_000_000, stacks: [] },
    },
  }),
  // 2 → 3: герой получил место на сцене и направление взгляда (5.2).
  2: (data) => ({
    ...data,
    version: 3,
    player: {
      ...asRecord(data['player']),
      position: { x: 640, y: 608 },
      facing: 'down',
    },
  }),
  // 3 → 4: появились узлы сбора и их сроки восстановления (6.1).
  3: (data) => ({
    ...data,
    version: 4,
    world: { nodes: {} },
  }),
  // 4 → 5: монеты и торговец с доверием (6.4).
  4: (data) => ({
    ...data,
    version: 5,
    player: { ...asRecord(data['player']), money: 15 },
    world: {
      ...asRecord(data['world']),
      trader: { trust: 0 },
    },
  }),
  // 5 → 6: сюжетные сцены (9.2).
  5: (data) => ({
    ...data,
    version: 6,
    story: null,
  }),
  // 6 → 7: здоровье героя (3.5.3, 8.1).
  6: (data) => ({
    ...data,
    version: 7,
    player: { ...asRecord(data['player']), health: { current: 30, max: 30 } },
  }),
  // 7 → 8: постройки деревни (7.1).
  7: (data) => ({
    ...data,
    version: 8,
    world: { ...asRecord(data['world']), buildings: [] },
  }),
  // 8 → 9: повреждённые постройки (8.5).
  8: (data) => ({
    ...data,
    version: 9,
    world: { ...asRecord(data['world']), damaged: [] },
  }),
}

export class MigrationError extends Error {}

function readVersion(data: SaveRecord): number {
  const value = data['version']
  return typeof value === 'number' && Number.isInteger(value) ? value : 0
}

export function migrate(data: SaveRecord): SaveRecord {
  let current = data
  let version = readVersion(current)

  if (version < 1) throw new MigrationError('В сохранении нет номера версии')

  while (version < SAVE_VERSION) {
    const step = migrations[version]
    if (!step) throw new MigrationError(`Нет миграции с версии ${version}`)

    current = step(current)

    const next = readVersion(current)
    if (next <= version) {
      throw new MigrationError(`Миграция с версии ${version} не подняла версию`)
    }
    version = next
  }

  return current
}
