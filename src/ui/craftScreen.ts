/**
 * Окно крафта (4.3.3, 6.3).
 *
 * Показывает рецепты, чего не хватает и сколько это займёт игрового времени.
 * Саму работу выполняет ядро — окно только спрашивает и показывает ответ.
 */

import type { Inventory } from '../core/inventory'
import { countOf } from '../core/inventory'
import { RECIPES } from '../content/recipes'
import { itemName } from '../content/items'
import { escapeHtml } from './html'

export interface CraftScreenOptions {
  getInventory: () => Inventory
  canCraft: (recipeId: string) => boolean
  onCraft: (recipeId: string) => string
}

let overlay: HTMLDivElement | null = null
let status = ''
let options: CraftScreenOptions | null = null

export function openCraftScreen(screenOptions: CraftScreenOptions): void {
  options = screenOptions
  status = ''

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeCraftScreen()
  })

  document.body.append(overlay)
  render()
}

export function closeCraftScreen(): void {
  overlay?.remove()
  overlay = null
  options = null
}

function renderInputs(recipeInputs: (typeof RECIPES)[number]['inputs'], inventory: Inventory): string {
  return recipeInputs
    .map((input) => {
      const have = countOf(inventory, input.itemId)
      const enough = have >= input.count
      const className = enough ? 'recipe__have' : 'recipe__lack'
      return `<span class="${className}">${input.count} × ${escapeHtml(itemName(input.itemId))} <small>(${have})</small></span>`
    })
    .join(' · ')
}

function renderRecipe(recipe: (typeof RECIPES)[number]): string {
  const inventory = options?.getInventory()
  if (!inventory) return ''

  const available = options?.canCraft(recipe.id) ?? false

  return `
    <li class="recipe">
      <div class="recipe__info">
        <div class="recipe__name">${escapeHtml(recipe.name)}</div>
        <div class="recipe__inputs">${renderInputs(recipe.inputs, inventory)}</div>
        <div class="recipe__meta">${recipe.minutes} мин · даёт ${escapeHtml(itemName(recipe.output.itemId))} ×${recipe.output.count}</div>
      </div>
      <button data-recipe="${recipe.id}" ${available ? '' : 'disabled'}>Сделать</button>
    </li>
  `
}

function render(): void {
  if (!overlay || !options) return

  overlay.innerHTML = `
    <div class="screen" role="dialog" aria-modal="true" aria-label="Ремесло">
      <header class="screen__head">
        <h2 class="screen__title">Ремесло у костра</h2>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>
      <ul class="recipes">${RECIPES.map(renderRecipe).join('')}</ul>
      <p class="screen__status">${escapeHtml(status)}</p>
    </div>
  `

  overlay.querySelector('[data-action="close"]')?.addEventListener('click', closeCraftScreen)

  overlay.querySelectorAll<HTMLButtonElement>('button[data-recipe]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset['recipe']
      if (!id || !options) return
      status = options.onCraft(id)
      render()
    })
  })
}
