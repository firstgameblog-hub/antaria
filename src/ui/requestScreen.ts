/**
 * Экран просьбы (9.5, 7.13).
 *
 * Не «квест с наградой», а разговор: вот беда, вот что нужно, вот что у тебя есть.
 */

import { countOf, type Inventory } from '../core/inventory'
import { itemName } from '../content/items'
import { escapeHtml } from './html'

export interface RequestScreenOptions {
  title: string
  text: string
  requirement: { itemId: string; count: number }
  getInventory: () => Inventory
  /** Вернуть сообщение об итоге; пустая строка — закрыть. */
  onDeliver: () => string
  onClose: () => void
}

let overlay: HTMLDivElement | null = null
let options: RequestScreenOptions | null = null
let status = ''

export function closeRequestScreen(): void {
  overlay?.remove()
  overlay = null
  options = null
}

function render(): void {
  if (!overlay || !options) return

  const inventory = options.getInventory()
  const have = countOf(inventory, options.requirement.itemId)
  const enough = have >= options.requirement.count

  overlay.innerHTML = `
    <div class="screen request" role="dialog" aria-modal="true" aria-label="Просьба">
      <header class="screen__head">
        <h2 class="screen__title">${escapeHtml(options.title)}</h2>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>

      <div class="request__body">
        <p class="request__text">${escapeHtml(options.text)}</p>
        <p class="request__need">
          Нужно: ${options.requirement.count} × ${escapeHtml(itemName(options.requirement.itemId))}
          <span class="request__have">(у тебя ${have})</span>
        </p>
      </div>

      <footer class="request__foot">
        <button data-request="deliver" ${enough ? '' : 'disabled'}>Помочь</button>
        <button data-request="later">Позже</button>
      </footer>

      <p class="screen__status">${escapeHtml(status)}</p>
    </div>
  `

  overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    options?.onClose()
    closeRequestScreen()
  })

  overlay.querySelector('[data-request="later"]')?.addEventListener('click', () => {
    options?.onClose()
    closeRequestScreen()
  })

  overlay.querySelector('[data-request="deliver"]')?.addEventListener('click', () => {
    if (!options) return
    status = options.onDeliver()
    render()
  })
}

export function openRequestScreen(screenOptions: RequestScreenOptions): void {
  options = screenOptions
  status = ''

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeRequestScreen()
  })

  document.body.append(overlay)
  render()
}
