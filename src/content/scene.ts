/**
 * Раскладка стартовой деревни (4.2.1).
 *
 * Координаты в тайлах, x/y — левый верхний угол основания.
 * Это контент: при переходе стадий он будет приходить из таблицы стадий (7.5),
 * здесь лежит только нулевая стадия.
 */

export type BuildingKind = 'headman_hut' | 'workers_house' | 'field' | 'campfire'

export interface PlacedBuilding {
  id: string
  kind: BuildingKind
  x: number
  y: number
  w: number
  h: number
  /** Подпись для подсказки при наведении. Пока простая строка. */
  label: string
}

export const SCENE_TILES = { w: 40, h: 32 } as const

export const START_VILLAGE: readonly PlacedBuilding[] = [
  { id: 'hut', kind: 'headman_hut', x: 17, y: 5, w: 5, h: 4, label: 'Лачуга главы' },
  { id: 'barracks_a', kind: 'workers_house', x: 8, y: 12, w: 5, h: 4, label: 'Барак' },
  { id: 'barracks_b', kind: 'workers_house', x: 26, y: 12, w: 5, h: 4, label: 'Барак' },
  { id: 'field_a', kind: 'field', x: 7, y: 21, w: 7, h: 5, label: 'Поле' },
  { id: 'field_b', kind: 'field', x: 26, y: 21, w: 7, h: 5, label: 'Поле' },
  { id: 'campfire', kind: 'campfire', x: 19, y: 16, w: 2, h: 2, label: 'Костёр' },
]
