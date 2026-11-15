/**
 * Миграции формата сохранения (3.1.3).
 *
 * Правило: сохранение старой версии обязано грузиться (3.1.8).
 * Поэтому любое изменение структуры GameState сопровождается миграцией
 * и поднятием SAVE_VERSION.
 */

import { SAVE_VERSION } from './state'

export type SaveRecord = Record<string, unknown>

/** Миграция поднимает сохранение с версии `from` до `from + 1`. */
type Migration = (data: SaveRecord) => SaveRecord

/**
 * Ключ — версия, С КОТОРОЙ мигрируем. Пока формат не менялся, словарь пуст.
 *
 * Пример на будущее:
 *   1: (data) => ({ ...data, inventory: {}, version: 2 })
 */
const migrations: Record<number, Migration> = {}

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
