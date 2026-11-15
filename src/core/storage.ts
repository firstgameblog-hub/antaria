/**
 * Хранение сохранений в браузере (3.1.4, 3.1.6).
 *
 * Три ручных слота плюс автосохранение. Перед перезаписью слой снимает
 * резервную копию: если запись оборвётся или данные окажутся битыми,
 * есть куда вернуться.
 */

import { parseSave, SaveError, serialize } from './save'
import type { GameState } from './state'

export const SAVE_SLOTS = ['auto', 'slot1', 'slot2', 'slot3'] as const
export type SaveSlotId = (typeof SAVE_SLOTS)[number]
export const AUTO_SLOT: SaveSlotId = 'auto'

const NAMESPACE = 'antaria.v1'

export interface SlotSummary {
  slot: SaveSlotId
  year: number
  day: number
  stageId: string
  population: number
  savedAt: number
  bytes: number
}

export interface SlotInfo {
  slot: SaveSlotId
  status: 'empty' | 'ok' | 'corrupt'
  summary?: SlotSummary
  reason?: string
}

export type SlotRead =
  | { status: 'empty' }
  | { status: 'ok'; state: GameState }
  | { status: 'corrupt'; reason: string }

export type WriteResult = { ok: true } | { ok: false; reason: string }

function slotKey(slot: SaveSlotId): string {
  return `${NAMESPACE}.save.${slot}`
}

function backupKey(slot: SaveSlotId): string {
  return `${NAMESPACE}.backup.${slot}`
}

/** localStorage может быть недоступен: приватный режим, запрет хранилища, политика браузера. */
function getStore(): Storage | null {
  try {
    const store = globalThis.localStorage
    const probe = `${NAMESPACE}.probe`
    store.setItem(probe, '1')
    store.removeItem(probe)
    return store
  } catch {
    return null
  }
}

function readRaw(slot: SaveSlotId): string | null {
  const store = getStore()
  if (!store) return null
  try {
    return store.getItem(slotKey(slot))
  } catch {
    return null
  }
}

export function readSlot(slot: SaveSlotId): SlotRead {
  const raw = readRaw(slot)
  if (raw === null) return { status: 'empty' }

  try {
    return { status: 'ok', state: parseSave(raw) }
  } catch (error) {
    const reason = error instanceof SaveError ? error.message : 'Сохранение не читается'
    return { status: 'corrupt', reason }
  }
}

export function writeSlot(slot: SaveSlotId, state: GameState): WriteResult {
  const store = getStore()
  if (!store) return { ok: false, reason: 'Браузер не даёт доступ к хранилищу' }

  try {
    const previous = store.getItem(slotKey(slot))
    if (previous !== null) store.setItem(backupKey(slot), previous)

    store.setItem(slotKey(slot), serialize(state))
    return { ok: true }
  } catch (error) {
    const reason =
      error instanceof DOMException && error.name === 'QuotaExceededError'
        ? 'Место в хранилище кончилось'
        : 'Не удалось записать сохранение'
    return { ok: false, reason }
  }
}

export function deleteSlot(slot: SaveSlotId): void {
  const store = getStore()
  if (!store) return
  try {
    store.removeItem(slotKey(slot))
    store.removeItem(backupKey(slot))
  } catch {
    // молча: удаление не критично
  }
}

export function hasBackup(slot: SaveSlotId): boolean {
  const store = getStore()
  if (!store) return false
  try {
    return store.getItem(backupKey(slot)) !== null
  } catch {
    return false
  }
}

/** Возвращает сохранение из резервной копии, если основное испорчено. */
export function readBackup(slot: SaveSlotId): SlotRead {
  const store = getStore()
  if (!store) return { status: 'empty' }

  let raw: string | null
  try {
    raw = store.getItem(backupKey(slot))
  } catch {
    return { status: 'empty' }
  }
  if (raw === null) return { status: 'empty' }

  try {
    return { status: 'ok', state: parseSave(raw) }
  } catch (error) {
    const reason = error instanceof SaveError ? error.message : 'Резервная копия не читается'
    return { status: 'corrupt', reason }
  }
}

export function listSlots(): SlotInfo[] {
  return SAVE_SLOTS.map((slot) => {
    const read = readSlot(slot)
    if (read.status === 'empty') return { slot, status: 'empty' as const }
    if (read.status === 'corrupt') {
      return { slot, status: 'corrupt' as const, reason: read.reason }
    }
    const state = read.state
    return {
      slot,
      status: 'ok' as const,
      summary: {
        slot,
        year: state.clock.year,
        day: state.clock.day,
        stageId: state.village.stageId,
        population: state.village.population,
        savedAt: state.savedAt,
        bytes: serialize(state).length,
      },
    }
  })
}
