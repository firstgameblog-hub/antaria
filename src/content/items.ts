/**
 * Предметы стартовой деревни.
 *
 * Восемь ресурсов из M1 плюс два инструмента, чтобы было чем проверить
 * экипировку. Числа — заглушки: цены и вес калибруются вместе с экономикой (11.1).
 */

import type { ItemDef } from '../data/items'

export const ITEMS: readonly ItemDef[] = [
  {
    id: 'branch',
    name: 'Ветка',
    category: 'resource',
    stack: 50,
    weight: 0.2,
    price: 1,
    tags: ['wood'],
  },
  {
    id: 'log',
    name: 'Бревно',
    category: 'resource',
    stack: 20,
    weight: 4,
    price: 5,
    tags: ['wood'],
  },
  {
    id: 'herb',
    name: 'Трава',
    category: 'resource',
    stack: 100,
    weight: 0.05,
    price: 2,
    tags: ['herb'],
  },
  {
    id: 'berry',
    name: 'Ягода',
    category: 'food',
    stack: 100,
    weight: 0.1,
    price: 1,
    tags: ['food', 'herb'],
  },
  {
    id: 'stone',
    name: 'Камень',
    category: 'resource',
    stack: 30,
    weight: 1.5,
    price: 3,
    tags: ['stone'],
  },
  {
    id: 'clay',
    name: 'Глина',
    category: 'resource',
    stack: 40,
    weight: 1.2,
    price: 2,
    tags: ['clay'],
  },
  {
    id: 'hide',
    name: 'Шкура',
    category: 'resource',
    stack: 20,
    weight: 0.8,
    price: 6,
    tags: ['hide'],
  },
  {
    id: 'meat',
    name: 'Мясо',
    category: 'food',
    stack: 20,
    weight: 1,
    price: 4,
    tags: ['food'],
  },
  {
    id: 'axe',
    name: 'Топор',    category: 'tool',
    stack: 1,
    weight: 2,
    price: 25,
    slot: 'tool',
    tags: ['tool', 'wood'],
  },
  {
    id: 'knife',
    name: 'Нож',
    category: 'tool',
    stack: 1,
    weight: 0.5,
    price: 15,
    slot: 'tool',
    tags: ['tool', 'hide'],
  },
  {
    id: 'plank',
    name: 'Доска',
    category: 'resource',
    stack: 20,
    weight: 1.5,
    price: 8,
    tags: ['wood'],
  },
  {
    id: 'rope',
    name: 'Верёвка',
    category: 'resource',
    stack: 30,
    weight: 0.3,
    price: 6,
    tags: ['rope'],
  },
  {
    id: 'torch',
    name: 'Факел',
    category: 'tool',
    stack: 10,
    weight: 0.4,
    price: 4,
    tags: ['light'],
  },
  {
    id: 'broth',
    name: 'Ягодный отвар',
    category: 'food',
    stack: 10,
    weight: 0.5,
    price: 5,
    tags: ['food'],
  },
  {
    id: 'ore',
    name: 'Руда',
    category: 'resource',
    stack: 20,
    weight: 2,
    price: 9,
    tags: ['ore', 'metal'],
  },
  {
    id: 'pickaxe',
    name: 'Кирка',
    category: 'tool',
    stack: 1,
    weight: 2.5,
    price: 40,
    slot: 'tool',
    tags: ['tool', 'ore'],
  },
  {
    id: 'wolf_fang',
    name: 'Клык старого волка',
    category: 'resource',
    stack: 5,
    weight: 0.2,
    price: 60,
    tags: ['trophy'],
  },
  {
    id: 'grain',
    name: 'Зерно',
    category: 'food',
    stack: 100,
    weight: 0.3,
    price: 2,
    tags: ['food', 'grain'],
  },
  {
    id: 'bread',
    name: 'Хлеб',
    category: 'food',
    stack: 20,
    weight: 0.4,
    price: 6,
    tags: ['food'],
  },
  {
    id: 'bandit_seal',
    name: 'Печать атамана',
    category: 'resource',
    stack: 3,
    weight: 0.3,
    price: 80,
    tags: ['trophy'],
  },
]

export const ITEM_BY_ID: ReadonlyMap<string, ItemDef> = new Map(
  ITEMS.map((item) => [item.id, item]),
)

export function itemDef(id: string): ItemDef | undefined {
  return ITEM_BY_ID.get(id)
}

export function itemName(id: string): string {
  return ITEM_BY_ID.get(id)?.name ?? id
}
