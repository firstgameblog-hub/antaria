/**
 * Содержание деревни и зима (7.8, M2.3).
 *
 * Каждую ночь деревня ест и жжёт дрова. Не хватило — кто-то собирает узел
 * и уходит. Зимой расход вдвое больше.
 */

import { countOf, removeItems, type Inventory } from './inventory'
import type { Season } from './time'

export const FOOD_ITEMS: readonly string[] = ['bread', 'broth', 'meat', 'berry', 'grain']
export const FUEL_ITEMS: readonly string[] = ['log', 'branch']

export interface DailyNeeds {
  food: number
  fuel: number
  winter: boolean
}

export interface UpkeepResult extends DailyNeeds {
  foodEaten: number
  fuelBurned: number
  /** Сколько жителей ушло из-за нехватки. */
  lost: number
}

export function dailyNeeds(population: number, season: Season): DailyNeeds {
  const winter = season === 'winter'
  const multiplier = winter ? 2 : 1

  return {
    food: Math.max(1, Math.ceil(population / 4)) * multiplier,
    fuel: Math.max(1, Math.ceil(population / 8)) * multiplier,
    winter,
  }
}

function takeFrom(storage: Inventory, items: readonly string[], amount: number): number {
  let left = amount
  let taken = 0

  for (const id of items) {
    if (left <= 0) break
    const available = countOf(storage, id)
    const take = Math.min(left, available)
    if (take <= 0) continue

    removeItems(storage, id, take)
    taken += take
    left -= take
  }

  return taken
}

export function applyDailyUpkeep(
  storage: Inventory,
  population: number,
  season: Season,
): UpkeepResult {
  const needs = dailyNeeds(population, season)

  const foodEaten = takeFrom(storage, FOOD_ITEMS, needs.food)
  const fuelBurned = takeFrom(storage, FUEL_ITEMS, needs.fuel)

  const deficit = needs.food - foodEaten + (needs.fuel - fuelBurned)
  const lost = deficit > 0 ? Math.min(Math.max(0, population - 1), Math.ceil(deficit / 2)) : 0

  return {
    ...needs,
    foodEaten,
    fuelBurned,
    lost,
  }
}
