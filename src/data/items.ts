/**
 * Схема предмета (2.3.1).
 *
 * Содержимое живёт в `src/content/items.ts`, здесь только форма.
 */

export type ItemCategory = 'resource' | 'food' | 'tool' | 'weapon' | 'armor'

export type EquipmentSlot = 'tool' | 'weapon' | 'armor'

export interface ItemDef {
  id: string
  name: string
  category: ItemCategory
  /** Максимум штук в одном стеке. */
  stack: number
  /** Вес одной штуки в килограммах. */
  weight: number
  /** Базовая цена в монетах (6.6). */
  price: number
  /** В какой слот надевается, если это снаряжение. */
  slot?: EquipmentSlot
  /** Насколько оружие усиливает удар: прибавка к урону. */
  power?: number
  /** Теги для рецептов и условий: «дерево», «съедобное», «трава». */
  tags?: readonly string[]
}
