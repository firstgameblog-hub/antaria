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
  weakness: 'Левую лапу он бережёт и не ставит на неё — по ней и надо бить.',
  weakMultiplier: 1.8,
  enrages: true,
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
  weakness: 'Она хромает на заднюю ногу — далеко не уйдёт, если бить точно.',
  weakMultiplier: 1.6,
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
  weakness: 'У неё разорвано ухо, и с той стороны она почти не видит.',
  weakMultiplier: 1.7,
  loot: [{ itemId: 'meat', count: 1, chance: 0.4 }],
}

/** Таблица встреч у края деревни: кто выходит на шум. */
export const WILD_ENCOUNTERS: readonly { enemy: EnemyDef; weight: number }[] = [
  { enemy: DOG, weight: 3 },
  { enemy: WOLF, weight: 2 },
]

/** Главарь налётчиков: приходит, когда деревня начинает подниматься. */
export const BANDIT_LEADER: EnemyDef = {
  id: 'bandit_leader',
  name: 'Главарь налётчиков',
  maxHp: 22,
  minDamage: 4,
  maxDamage: 6,
  initiative: 1,
  intro: 'Он стоит впереди и не прячет лица. Значит, не боится, что его запомнят.',
  weakness: 'Под кольчугой на боку прореха — старая и плохо зашитая.',
  weakMultiplier: 1.9,
  enrages: true,
  loot: [{ itemId: 'meat', count: 2 }, { itemId: 'hide', count: 1 }],
}

/** Старый волк: босс ближнего леса. Толще, злее и с клыком, за который платят. */
export const OLD_WOLF: EnemyDef = {
  id: 'old_wolf',
  name: 'Старый волк',
  maxHp: 30,
  minDamage: 3,
  maxDamage: 5,
  initiative: 1,
  intro: 'Логово пахнет костями. Волк выходит не спеша — он старше тебя и тяжелее вдвое. У него нет правого глаза, и это единственное, что даёт тебе шанс.',
  weakness: 'Правый глаз вытек — с этой стороны он тебя не видит.',
  weakMultiplier: 1.7,
  enrages: true,
  loot: [
    { itemId: 'wolf_fang', count: 1 },
    { itemId: 'hide', count: 2 },
    { itemId: 'meat', count: 2 },
  ],
}

/** Атаман: второй босс, за старым частоколом. */
export const ATAMAN: EnemyDef = {
  id: 'ataman',
  name: 'Атаман',
  maxHp: 34,
  minDamage: 4,
  maxDamage: 6,
  initiative: 1,
  intro: 'Он ждёт у костра, будто это его деревня. Под рукой — сабля, за поясом — печать, которой он запечатывает письма в города.',
  weakness: 'Он бережёт левое плечо: старая рана не зажила.',
  weakMultiplier: 1.8,
  enrages: true,
  loot: [
    { itemId: 'bandit_seal', count: 1 },
    { itemId: 'meat', count: 2 },
    { itemId: 'hide', count: 1 },
  ],
}

/** Городской ратник: приходит с осадой, не за добычей. */
export const CITY_SOLDIER: EnemyDef = {
  id: 'city_soldier',
  name: 'Городской ратник',
  maxHp: 26,
  minDamage: 3,
  maxDamage: 6,
  initiative: 1,
  intro: 'Он идёт ровным шагом, будто уже считает нашу стену своей. Железо на нём чужое — с городского склада.',
  weakness: 'Он держит щит слишком высоко: под ним открыт бок.',
  weakMultiplier: 1.7,
  loot: [{ itemId: 'steel', count: 1, chance: 0.6 }, { itemId: 'meat', count: 1, chance: 0.5 }],
}

/** Воевода: последняя волна осады. */
export const SIEGE_CAPTAIN: EnemyDef = {
  id: 'siege_captain',
  name: 'Воевода',
  maxHp: 40,
  minDamage: 5,
  maxDamage: 7,
  initiative: 1,
  intro: 'Он не слезает с коня, пока не видит ворот. Потом слезает — медленно, будто делает нам одолжение.',
  weakness: 'Правая рука в кожаной перчатке: под ней не зажила рана.',
  weakMultiplier: 1.8,
  enrages: true,
  loot: [
    { itemId: 'steel', count: 2 },
    { itemId: 'hide', count: 1 },
  ],
}

export const ENEMIES: readonly EnemyDef[] = [
  WOLF,
  DEER,
  DOG,
  BANDIT_LEADER,
  OLD_WOLF,
  ATAMAN,
  CITY_SOLDIER,
  SIEGE_CAPTAIN,
]
