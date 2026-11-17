/**
 * Постройки первой стадии (M2.2).
 *
 * Колодец, амбар, горн и торговый навес — то, что превращает выжившую
 * деревню в место, где можно жить. Каждая стоит ресурсов со склада.
 */

import type { StructureDef } from '../data/buildings'

export const STRUCTURES: readonly StructureDef[] = [
  {
    id: 'well',
    name: 'Колодец',
    kind: 'well',
    x: 14,
    y: 7,
    w: 2,
    h: 2,
    description: 'Вода рядом с домом. Женщинам больше не нужно ходить к реке через всё поле.',
    cost: [
      { itemId: 'stone', count: 6 },
      { itemId: 'plank', count: 2 },
    ],
    minutes: 60,
    journal: 'Вырыли колодец. Вода в нём холодная и чистая — впервые за много лет не надо таскать её от реки.',
  },
  {
    id: 'barn',
    name: 'Амбар',
    kind: 'barn',
    x: 23,
    y: 6,
    w: 4,
    h: 3,
    description: 'Сухое место для зерна. Без него половина урожая сгниёт за зиму.',
    cost: [
      { itemId: 'log', count: 8 },
      { itemId: 'plank', count: 4 },
    ],
    minutes: 90,
    journal: 'Поставили амбар. Теперь зерно не будет мокнуть под снегом.',
  },
  {
    id: 'forge',
    name: 'Горн',
    kind: 'forge',
    x: 13,
    y: 15,
    w: 3,
    h: 2,
    description: 'Первый настоящий огонь для железа. Пока только горн, но с него начинается кузница.',
    cost: [
      { itemId: 'stone', count: 8 },
      { itemId: 'plank', count: 2 },
      { itemId: 'branch', count: 6 },
    ],
    minutes: 75,
    journal: 'Сложили горн. Старик долго смотрел на огонь и сказал, что теперь у деревни есть зубы.',
  },
  {
    id: 'stall',
    name: 'Торговый навес',
    kind: 'stall',
    x: 23,
    y: 15,
    w: 3,
    h: 2,
    description: 'Корнею надоело раскладывать товар на земле. Под навесом торговля пойдёт бойчее.',
    cost: [
      { itemId: 'plank', count: 4 },
      { itemId: 'branch', count: 6 },
    ],
    minutes: 45,
    journal: 'Поставили навес для торговли. Корней повесил на столб свою старую вывеску.',
  },
  {
    id: 'tower',
    name: 'Сторожевая башня',
    kind: 'tower',
    x: 30,
    y: 6,
    w: 2,
    h: 2,
    description: 'С неё видно дорогу на два дня вперёд. Если налётчики идут — их заметят заранее.',
    cost: [
      { itemId: 'stone', count: 12 },
      { itemId: 'plank', count: 4 },
      { itemId: 'log', count: 6 },
    ],
    minutes: 90,
    journal: 'Поставили сторожевую башню. Теперь на дороге есть глаза.',
  },
]

export function structureById(id: string): StructureDef | undefined {
  return STRUCTURES.find((structure) => structure.id === id)
}
