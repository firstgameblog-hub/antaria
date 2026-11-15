/**
 * Состояние игры — единственное дерево изменяемых данных.
 *
 * Всё, чего здесь нет, считается статичным контентом из `src/content`
 * и только читается (см. 2.2.5). Любое изменение мира идёт через этот объект.
 *
 * Заглушки: разделы игрока и деревни уточняются в 3.4–3.5, время — в 3.2.
 */

/** Версия формата сохранения. Поднимается при несовместимом изменении структуры. */
export const SAVE_VERSION = 1

export interface ClockState {
  /** Год от начала игры. */
  year: number
  /** День года, начиная с 1. */
  day: number
  /** Минуты внутри суток, 0..1439. */
  minutes: number
}

export interface PlayerState {
  /** Имя, которое игрок введёт или получит по сюжету. Пустое — значит ещё не назван. */
  name: string
}

export interface VillageState {
  /** Строковый id стадии (2.2.6). Номера стадий в коде не используются. */
  stageId: string
  population: number
}

export type FlagValue = string | number | boolean

/** Произвольные отметки мира: что уже случилось, что обещано, о чём знает игрок. */
export type Flags = Record<string, FlagValue>

export interface JournalEntry {
  year: number
  day: number
  text: string
}

export interface GameState {
  version: number
  clock: ClockState
  player: PlayerState
  village: VillageState
  flags: Flags
  journal: JournalEntry[]
  /** Наигранное время в миллисекундах. */
  playtimeMs: number
  /** Когда сохранение было записано (Unix ms). */
  savedAt: number
}

export function createInitialState(now: number = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    clock: { year: 1, day: 1, minutes: 8 * 60 },
    player: { name: '' },
    village: { stageId: 'stage_dying', population: 20 },
    flags: {},
    journal: [],
    playtimeMs: 0,
    savedAt: now,
  }
}
