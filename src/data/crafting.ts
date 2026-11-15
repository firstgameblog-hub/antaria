/**
 * Схема рецепта (2.3.3).
 *
 * Рецепт превращает одни предметы в другие за игровое время.
 * Станок и навык появятся вместе с 6.2 и 7.1 — поля под них уже есть.
 */

export interface RecipeInput {
  itemId: string
  count: number
}

export interface Recipe {
  id: string
  name: string
  inputs: readonly RecipeInput[]
  output: { itemId: string; count: number }
  /** Сколько игровых минут занимает работа. */
  minutes: number
  /** Где делается: «у костра», «на верстаке». Пока не проверяется. */
  station?: string
}
