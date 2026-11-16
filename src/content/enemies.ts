/**
 * Противники (8.2).
 *
 * Пока один: худой волк, который выходит на шум в чаще.
 * Числа-заглушки, калибруются вместе с балансом (11.9).
 */

import type { EnemyDef } from '../data/combat'

export const WOLF: EnemyDef = {
  id: 'thin_wolf',
  name: 'Худой волк',
  maxHp: 14,
  minDamage: 2,
  maxDamage: 4,
  initiative: 1,
  intro: 'Из кустов выходит худой волк. Он не рычит — просто смотрит и ждёт, когда ты ошибёшься.',
  loot: [
    { itemId: 'hide', count: 1 },
    { itemId: 'meat', count: 1, chance: 0.7 },
  ],
}

/** Косуля: добыча мяса и шкуры, но раненой часто уходит. */
export const DEER: EnemyDef = {
  id: 'roe_deer',
  name: 'Косуля',
  maxHp: 14,
  minDamage: 2,
  maxDamage: 3,
  initiative: 0,
  intro: 'Следы выводят на поляну. Косуля вскидывает голову — ты успеваешь ударить первым.',
  escapesWhenHurt: true,
  loot: [
    { itemId: 'meat', count: 2 },
    { itemId: 'hide', count: 1, chance: 0.8 },
  ],
}

export const ENEMIES: readonly EnemyDef[] = [WOLF, DEER]
