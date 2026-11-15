/**
 * Узлы сбора стартовой деревни.
 *
 * Пока всё внутри частокола: выходить за него герой сможет, когда появятся
 * окрестности (5.6). Тогда сюда добавятся лес, луг и река.
 */

import type { GatheringNodeDef } from '../data/gathering'

export const GATHERING_NODES: readonly GatheringNodeDef[] = [
  {
    id: 'herb_northwest',
    kind: 'herb',
    name: 'Пучок травы',
    x: 150,
    y: 330,
    itemId: 'herb',
    count: 2,
    restoreMinutes: 720,
  },
  {
    id: 'herb_northeast',
    kind: 'herb',
    name: 'Пучок травы',
    x: 1090,
    y: 330,
    itemId: 'herb',
    count: 2,
    restoreMinutes: 720,
  },
  {
    id: 'herb_west',
    kind: 'herb',
    name: 'Пучок травы',
    x: 130,
    y: 560,
    itemId: 'herb',
    count: 2,
    restoreMinutes: 720,
  },
  {
    id: 'berry_southwest',
    kind: 'berry',
    name: 'Ягодный куст',
    x: 170,
    y: 900,
    itemId: 'berry',
    count: 3,
    restoreMinutes: 1440,
  },
  {
    id: 'berry_southeast',
    kind: 'berry',
    name: 'Ягодный куст',
    x: 1080,
    y: 900,
    itemId: 'berry',
    count: 3,
    restoreMinutes: 1440,
  },
  {
    id: 'branch_near_pile',
    kind: 'branch',
    name: 'Хворост',
    x: 470,
    y: 615,
    itemId: 'branch',
    count: 3,
    restoreMinutes: 1440,
  },
  {
    id: 'branch_east',
    kind: 'branch',
    name: 'Хворост',
    x: 790,
    y: 650,
    itemId: 'branch',
    count: 3,
    restoreMinutes: 1440,
  },
  {
    id: 'stone_center',
    kind: 'stone',
    name: 'Камни',
    x: 700,
    y: 880,
    itemId: 'stone',
    count: 2,
    restoreMinutes: 2880,
  },
  {
    id: 'stone_east',
    kind: 'stone',
    name: 'Камни',
    x: 950,
    y: 560,
    itemId: 'stone',
    count: 2,
    restoreMinutes: 2880,
  },
]
