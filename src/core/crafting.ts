/**
 * Крафт (6.3).
 *
 * Проверяем три вещи: есть ли материалы, влезет ли результат по весу
 * и не потеряются ли предметы, если места не хватит.
 */

import type { Recipe } from '../data/crafting'
import type { ItemDef } from '../data/items'
import { addItems, countOf, freeSpaceKg, MAX_QUALITY, qualityLabel, removeItems, type Inventory } from './inventory'
import type { GameState } from './state'

export type Defs = ReadonlyMap<string, ItemDef>

export type CraftResult = { ok: true; message: string } | { ok: false; reason: string }

export function hasInputs(recipe: Recipe, inventory: Inventory): boolean {
  return recipe.inputs.every((input) => countOf(inventory, input.itemId) >= input.count)
}

function weightOfInputs(recipe: Recipe, defs: Defs): number {
  return recipe.inputs.reduce((sum, input) => {
    const def = defs.get(input.itemId)
    return sum + (def ? def.weight * input.count : 0)
  }, 0)
}

export function canCraft(recipe: Recipe, inventory: Inventory, defs: Defs): boolean {
  if (!hasInputs(recipe, inventory)) return false

  const outputDef = defs.get(recipe.output.itemId)
  if (!outputDef) return false

  const gain = outputDef.weight * recipe.output.count - weightOfInputs(recipe, defs)
  if (gain <= 0) return true

  return freeSpaceKg(inventory, defs) >= gain
}

export function craftRecipe(state: GameState, recipe: Recipe, defs: Defs): CraftResult {
  const inventory = state.player.inventory

  if (!hasInputs(recipe, inventory)) {
    return { ok: false, reason: 'Не хватает материалов' }
  }

  if (!canCraft(recipe, inventory, defs)) {
    return { ok: false, reason: 'Не хватает места в грузе' }
  }

  const outputDef = defs.get(recipe.output.itemId)
  if (!outputDef) return { ok: false, reason: 'Такого предмета нет в игре' }

  // Качество: горн даёт одно деление, академия — второе.
  const forgeReady =
    state.world.buildings.includes('forge') && !state.world.damaged.includes('forge')
  const academyReady =
    state.world.buildings.includes('academy') && !state.world.damaged.includes('academy')

  let quality = 1
  if (recipe.station === 'forge' && forgeReady) quality += 1
  if (academyReady) quality += 1
  quality = Math.min(MAX_QUALITY, quality)

  for (const input of recipe.inputs) {
    removeItems(inventory, input.itemId, input.count)
  }

  const added = addItems(inventory, outputDef, recipe.output.count, quality, defs)

  if (added < recipe.output.count) {
    // Не влезло — возвращаем материалы, чтобы не пропали.
    for (const input of recipe.inputs) {
      const def = defs.get(input.itemId)
      if (def) addItems(inventory, def, input.count, 1, defs)
    }
    return { ok: false, reason: 'Не хватает места в грузе' }
  }

  return {
    ok: true,
    message:
      quality > 1
        ? `Готово: ${outputDef.name} ×${added} · ${qualityLabel(quality)}`
        : `Готово: ${outputDef.name} ×${added}`,
  }
}
