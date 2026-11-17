/**
 * Рецепты стартовой деревни (6.3).
 *
 * Шесть первых: от простой доски до топора. Всё делается «у костра» —
 * станки появятся с постройками (7.1), и тогда поле station начнёт проверяться.
 */

import type { Recipe } from '../data/crafting'

export const RECIPES: readonly Recipe[] = [
  {
    id: 'plank',
    name: 'Доска',
    inputs: [{ itemId: 'log', count: 2 }],
    output: { itemId: 'plank', count: 1 },
    minutes: 20,
    station: 'campfire',
  },
  {
    id: 'rope',
    name: 'Верёвка',
    inputs: [{ itemId: 'herb', count: 3 }],
    output: { itemId: 'rope', count: 1 },
    minutes: 15,
    station: 'campfire',
  },
  {
    id: 'torch',
    name: 'Факел',
    inputs: [
      { itemId: 'branch', count: 1 },
      { itemId: 'rope', count: 1 },
      { itemId: 'herb', count: 1 },
    ],
    output: { itemId: 'torch', count: 1 },
    minutes: 15,
    station: 'campfire',
  },
  {
    id: 'broth',
    name: 'Ягодный отвар',
    inputs: [
      { itemId: 'berry', count: 2 },
      { itemId: 'herb', count: 1 },
    ],
    output: { itemId: 'broth', count: 1 },
    minutes: 25,
    station: 'campfire',
  },
  {
    id: 'knife',
    name: 'Нож',
    inputs: [
      { itemId: 'branch', count: 1 },
      { itemId: 'stone', count: 1 },
      { itemId: 'rope', count: 1 },
    ],
    output: { itemId: 'knife', count: 1 },
    minutes: 30,
    station: 'campfire',
  },
  {
    id: 'axe',
    name: 'Топор',
    inputs: [
      { itemId: 'branch', count: 2 },
      { itemId: 'stone', count: 1 },
      { itemId: 'rope', count: 1 },
    ],
    output: { itemId: 'axe', count: 1 },
    minutes: 45,
    station: 'campfire',
  },
  {
    id: 'pickaxe',
    name: 'Кирка',
    inputs: [
      { itemId: 'branch', count: 2 },
      { itemId: 'stone', count: 3 },
      { itemId: 'rope', count: 1 },
    ],
    output: { itemId: 'pickaxe', count: 1 },
    minutes: 120,
    station: 'forge',
  },
  {
    id: 'bread',
    name: 'Хлеб',
    inputs: [{ itemId: 'grain', count: 3 }],
    output: { itemId: 'bread', count: 1 },
    minutes: 60,
    station: 'campfire',
  },
  {
    id: 'steel',
    name: 'Сталь',
    inputs: [
      { itemId: 'ore', count: 2 },
      { itemId: 'branch', count: 1 },
    ],
    output: { itemId: 'steel', count: 1 },
    minutes: 90,
    station: 'forge',
  },
  {
    id: 'steel_knife',
    name: 'Стальной нож',
    inputs: [
      { itemId: 'steel', count: 2 },
      { itemId: 'branch', count: 1 },
    ],
    output: { itemId: 'steel_knife', count: 1 },
    minutes: 60,
    station: 'forge',
  },
  {
    id: 'steel_axe',
    name: 'Стальной топор',
    inputs: [
      { itemId: 'steel', count: 3 },
      { itemId: 'plank', count: 1 },
    ],
    output: { itemId: 'steel_axe', count: 1 },
    minutes: 90,
    station: 'forge',
  },
  {
    id: 'steel_pickaxe',
    name: 'Стальная кирка',
    inputs: [
      { itemId: 'steel', count: 3 },
      { itemId: 'branch', count: 2 },
      { itemId: 'plank', count: 1 },
    ],
    output: { itemId: 'steel_pickaxe', count: 1 },
    minutes: 120,
    station: 'forge',
  },
  {
    id: 'rod',
    name: 'Удочка',
    inputs: [
      { itemId: 'branch', count: 2 },
      { itemId: 'rope', count: 1 },
    ],
    output: { itemId: 'rod', count: 1 },
    minutes: 40,
    station: 'campfire',
  },
]

export function recipeById(id: string): Recipe | undefined {
  return RECIPES.find((recipe) => recipe.id === id)
}
