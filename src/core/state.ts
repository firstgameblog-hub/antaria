/**
 * Состояние игры — единственное дерево изменяемых данных.
 *
 * Всё, чего здесь нет, считается статичным контентом из `src/content`
 * и только читается (см. 2.2.5). Любое изменение мира идёт через этот объект.
 */

import { createEquipment, createInventory, type Equipment, type Inventory } from './inventory'
import type { NodeReadyAt } from './gathering'
import type { Facing, Point } from './movement'

/** Версия формата сохранения. Поднимается при несовместимом изменении структуры. */
export const SAVE_VERSION = 6

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
  /** Положение на сцене в мировых пикселях. */
  position: Point
  facing: Facing
  /** Монеты (6.6). */
  money: number
  inventory: Inventory
  equipment: Equipment
}

export interface VillageState {
  /** Строковый id стадии (2.2.6). Номера стадий в коде не используются. */
  stageId: string
  population: number
  /** Общий склад деревни (3.4.3). */
  storage: Inventory
}

export type FlagValue = string | number | boolean

/** Произвольные отметки мира: что уже случилось, что обещано, о чём знает игрок. */
export type Flags = Record<string, FlagValue>

export interface JournalEntry {
  year: number
  day: number
  text: string
}

/** Где остановилась сюжетная сцена: переживёт перезагрузку страницы. */
export interface StoryProgress {
  sceneId: string
  beat: number
}

export interface GameState {
  version: number
  clock: ClockState
  player: PlayerState
  village: VillageState
  world: WorldState
  flags: Flags
  journal: JournalEntry[]
  /** Текущая сцена, если она не закончена. */
  story: StoryProgress | null
  /** Наигранное время в миллисекундах. */
  playtimeMs: number
  /** Когда сохранение было записано (Unix ms). */
  savedAt: number
}

/** Мир вокруг деревни: состояние узлов сбора и прочие отметки местности. */
export interface WorldState {
  /** id узла → абсолютные игровые минуты, когда он снова готов. */
  nodes: NodeReadyAt
  trader: TraderState
}

export interface TraderState {
  /** Доверие 0..100: сглаживает цены в обе стороны. */
  trust: number
}

/** Сколько килограммов герой уносит на себе. */
export const PLAYER_CAPACITY_KG = 25

/** Склад деревни практически безграничен, но не бесконечен: число должно выжить в JSON. */
export const VILLAGE_STORAGE_KG = 1_000_000

/** Где герой появляется: чуть южнее костра, на утоптанном месте. */
export const SPAWN_POINT: Point = { x: 20 * 32, y: 19 * 32 }

export function createInitialState(now: number = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    clock: { year: 1, day: 1, minutes: 8 * 60 },
    player: {
      name: '',
      position: { ...SPAWN_POINT },
      facing: 'down',
      money: 15,
      inventory: createInventory(PLAYER_CAPACITY_KG),
      equipment: createEquipment(),
    },
    village: {
      stageId: 'stage_dying',
      population: 20,
      storage: createInventory(VILLAGE_STORAGE_KG),
    },
    world: { nodes: {}, trader: { trust: 0 } },
    flags: {},
    journal: [],
    story: null,
    playtimeMs: 0,
    savedAt: now,
  }
}