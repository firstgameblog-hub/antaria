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
  requirements: readonly { itemId: string; count: number }[]
  getInventory: () => Inventory
  /** Вернуть сообщение об итоге; пустая строка — закрыть. */
  onDeliver: () => string
  /** Отказ: просьба закрывается навсегда, со своими последствиями. */
  onRefuse?: () => string
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
  const rows = options.requirements.map((requirement) => {
    const have = countOf(inventory, requirement.itemId)
    const enough = have >= requirement.count
    return {
      label: `${requirement.count} × ${itemName(requirement.itemId)}`,
      have,
      enough,
    }
  })
  const canDeliver = rows.every((row) => row.enough)

  overlay.innerHTML = `
    <div class="screen request" role="dialog" aria-modal="true" aria-label="Просьба">
      <header class="screen__head">
        <h2 class="screen__title">${escapeHtml(options.title)}</h2>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>

      <div class="request__body">
        <p class="request__text">${escapeHtml(options.text)}</p>
        <p class="request__need">
          ${rows
            .map(
              (row) =>
                `<span class="${row.enough ? 'request__ok' : 'request__lack'}">${escapeHtml(row.label)} (у тебя ${row.have})</span>`,
            )
            .join(' · ')}
        </p>
      </div>

      <footer class="request__foot">
        <button data-request="deliver" ${canDeliver ? '' : 'disabled'}>Помочь</button>
        ${
          options.onRefuse
            ? '<button data-request="refuse" class="request__refuse">Отказать</button>'
            : ''
        }
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

  overlay.querySelector('[data-request="refuse"]')?.addEventListener('click', () => {
    if (!options?.onRefuse) return
    status = options.onRefuse()
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
