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

/** Голодная собака: слабее волка, но пугает внезапностью. */
export const DOG: EnemyDef = {
  id: 'hungry_dog',
  name: 'Голодная собака',
  maxHp: 9,
  minDamage: 1,
  maxDamage: 2,
  initiative: 1,
  intro: 'Из-под частокола выбирается тощая собака. Она не лает — только скалится и отходит на шаг, если шагнуть к ней.',
  loot: [{ itemId: 'meat', count: 1, chance: 0.4 }],
}

/** Таблица встреч у края деревни: кто выходит на шум. */
export const WILD_ENCOUNTERS: readonly { enemy: EnemyDef; weight: number }[] = [
  { enemy: DOG, weight: 3 },
  { enemy: WOLF, weight: 2 },
]

export const ENEMIES: readonly EnemyDef[] = [WOLF, DEER, DOG]
