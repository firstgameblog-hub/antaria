/**
 * Бой (8.1).
 *
 * Пошаговый, короткий: три действия, 5–8 ходов, проигрыш — потеря, а не конец.
 * Чистая логика без DOM и таймеров.
 */

import type { CombatAction, CombatOutcome, EnemyDef } from '../data/combat'

export interface CombatState {
  enemy: EnemyDef
  enemyHp: number
  playerHp: number
  playerMaxHp: number
  /** Игрок закрылся — урон по нему в этот ход меньше. */
  defending: boolean
  /** Охотник бьёт первым: враг отвечает только со второго хода. */
  playerFirst: boolean
  outcome: CombatOutcome | null
  log: string[]
}

export interface PlayerCombatStats {
  maxHp: number
  minDamage: number
  maxDamage: number
}

const LOG_LIMIT = 7

function roll(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function pushLog(state: CombatState, line: string): void {
  state.log.push(line)
  if (state.log.length > LOG_LIMIT) state.log.shift()
}

export function createCombat(
  enemy: EnemyDef,
  playerHp: number,
  stats: PlayerCombatStats,
  options: { playerFirst?: boolean } = {},
): CombatState {
  return {
    enemy,
    enemyHp: enemy.maxHp,
    playerHp: Math.max(1, Math.min(playerHp, stats.maxHp)),
    playerMaxHp: stats.maxHp,
    defending: false,
    playerFirst: options.playerFirst ?? false,
    outcome: null,
    log: [enemy.intro],
  }
}

/** Завершает бой, если кто-то не встал. */
function checkOutcome(state: CombatState): void {
  if (state.enemyHp <= 0) {
    state.enemyHp = 0
    state.outcome = 'victory'
  } else if (state.playerHp <= 0) {
    state.playerHp = 0
    state.outcome = 'defeat'
  }
}

/** Ход игрока и ответ врага. Возвращает тот же объект состояния. */
export function resolveTurn(
  state: CombatState,
  action: CombatAction,
  stats: PlayerCombatStats,
): CombatState {
  if (state.outcome !== null) return state

  if (action === 'flee') {
    if (Math.random() < 0.5) {
      pushLog(state, `Ты отступаешь. ${state.enemy.name} не преследует.`)
      state.outcome = 'fled'
      return state
    }

    pushLog(state, 'Ты пробуешь уйти — и слышишь за спиной быстрые шаги.')
  }

  if (action === 'attack') {
    const damage = roll(stats.minDamage, stats.maxDamage)
    state.enemyHp -= damage
    pushLog(state, `Ты бьёшь: ${damage} урона.`)
    checkOutcome(state)
    if (state.outcome !== null) return state

    // Раненый зверь может вырваться: тогда добычи не будет.
    if (
      state.enemy.escapesWhenHurt === true &&
      state.enemyHp <= state.enemy.maxHp / 2 &&
      Math.random() < 0.45
    ) {
      pushLog(state, `${state.enemy.name} вырывается и уходит в кусты.`)
      state.outcome = 'escaped'
      return state
    }
  }

  if (action === 'defend') {
    state.defending = true
    pushLog(state, 'Ты закрываешься и ждёшь.')
  }

  // Засада охотника: враг не успевает ответить на первый удар.
  if (state.playerFirst) {
    state.playerFirst = false
    pushLog(state, 'Ты успел первым — враг только разворачивается.')
    return state
  }

  // Ответ врага
  const raw = roll(state.enemy.minDamage, state.enemy.maxDamage)
  const damage = state.defending ? Math.max(1, Math.floor(raw / 2)) : raw
  state.playerHp -= damage
  pushLog(state, `${state.enemy.name} достаёт тебя: ${damage} урона.`)
  state.defending = false

  checkOutcome(state)
  return state
}

export function healthRatio(state: CombatState): number {
  return Math.max(0, state.playerHp / Math.max(1, state.playerMaxHp))
}
