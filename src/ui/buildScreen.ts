/**
 * Экран постройки (7.1, 4.3.8).
 *
 * Черновик: что это, сколько стоит, сколько времени займёт.
 * Строительство мгновенное, но стоит игровых часов и материалов со склада.
 */

import { escapeHtml } from './html'

export interface BuildCostRow {
  label: string
  have: number
  need: number
}

export interface BuildScreenOptions {
  name: string
  description: string
  costs: readonly BuildCostRow[]
  minutes: number
  onBuild: () => string
  onClose: () => void
}

let overlay: HTMLDivElement | null = null
let options: BuildScreenOptions | null = null
let status = ''

export function closeBuildScreen(): void {
  overlay?.remove()
  overlay = null
  options = null
}

function render(): void {
  if (!overlay || !options) return

  const canBuild = options.costs.every((row) => row.have >= row.need)

  overlay.innerHTML = `
    <div class="screen build" role="dialog" aria-modal="true" aria-label="Постройка">
      <header class="screen__head">
        <h2 class="screen__title">${escapeHtml(options.name)}</h2>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>

      <div class="build__body">
        <p class="build__text">${escapeHtml(options.description)}</p>
        <ul class="village__list">
          ${options.costs
            .map(
              (row) => `
            <li class="village__row ${row.have >= row.need ? 'village__row--done' : ''}">
              <span>${escapeHtml(row.label)}</span>
              <span class="village__count">${row.have} / ${row.need}</span>
            </li>`,
            )
            .join('')}
        </ul>
        <p class="build__time">Работы: ${options.minutes} минут игрового времени.</p>
      </div>

      <footer class="village__foot">
        <button data-build="build" ${canBuild ? '' : 'disabled'}>Строить</button>
        <button data-build="later">Позже</button>
      </footer>

      <p class="screen__status">${escapeHtml(status)}</p>
    </div>
  `

  overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    options?.onClose()
    closeBuildScreen()
  })

  overlay.querySelector('[data-build="later"]')?.addEventListener('click', () => {
    options?.onClose()
    closeBuildScreen()
  })

  overlay.querySelector('[data-build="build"]')?.addEventListener('click', () => {
    if (!options) return
    status = options.onBuild()
    render()
  })
}

export function openBuildScreen(screenOptions: BuildScreenOptions): void {
  options = screenOptions
  status = ''

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeBuildScreen()
  })

  document.body.append(overlay)
  render()
}
