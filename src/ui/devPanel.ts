/**
 * Отладочная панель (2.4.1).
 *
 * Живёт только в dev-режиме. Показывает состояние и даёт быстрые действия.
 * По мере появления систем сюда добавятся «дать предмет» и «перейти на стадию» —
 * сейчас их не к чему применить (правило 0.2.6).
 */

import type { GameState } from '../core/state'
import { ITEMS } from '../content/items'
import { escapeHtml } from './html'

export interface DevPanelHandlers {
  getState: () => GameState
  nextDay: () => void
  reset: () => void
  refitCamera: () => void
  toggleGrid: () => void
  giveItem: (id: string, count: number) => void
}

export interface DevPanel {
  element: HTMLElement
  toggle: () => void
  isOpen: () => boolean
}

export function createDevPanel(handlers: DevPanelHandlers): DevPanel {
  const element = document.createElement('section')
  element.className = 'dev-panel'
  element.hidden = true

  function render(): void {
    const state = handlers.getState()
    element.innerHTML = `
      <header class="dev-panel__head">
        <span>Разработчик</span>
        <span class="dev-panel__hint">F2 — скрыть</span>
      </header>
      <div class="dev-panel__actions">
        <button data-dev="next-day">Следующий день</button>
        <button data-dev="refit">Вписать камеру</button>
        <button data-dev="grid">Сетка</button>
        <button data-dev="reset">Сбросить игру</button>
      </div>
      <div class="dev-panel__actions dev-panel__give">
        ${ITEMS.map((item) => `<button data-give="${item.id}">+5 ${escapeHtml(item.name)}</button>`).join('')}
      </div>
      <pre class="dev-panel__state">${escapeHtml(
        JSON.stringify(
          {
            clock: state.clock,
            player: state.player,
            village: state.village,
            flags: state.flags,
            journal: state.journal.length,
            playtimeMs: state.playtimeMs,
            savedAt: state.savedAt,
          },
          null,
          2,
        ),
      )}</pre>
      <p class="dev-panel__note">
        Дать предмет и перейти на стадию появятся вместе с инвентарём (3.4) и стадиями (7.5).
      </p>
    `

    element.querySelector('[data-dev="next-day"]')?.addEventListener('click', () => {
      handlers.nextDay()
      render()
    })
    element.querySelector('[data-dev="refit"]')?.addEventListener('click', () => {
      handlers.refitCamera()
    })
    element.querySelector('[data-dev="grid"]')?.addEventListener('click', () => {
      handlers.toggleGrid()
      render()
    })
    element.querySelector('[data-dev="reset"]')?.addEventListener('click', () => {
      handlers.reset()
      render()
    })

    element.querySelectorAll<HTMLButtonElement>('button[data-give]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset['give']
        if (!id) return
        handlers.giveItem(id, 5)
        render()
      })
    })
  }

  return {
    element,
    toggle() {
      element.hidden = !element.hidden
      if (!element.hidden) render()
    },
    isOpen() {
      return !element.hidden
    },
  }
}
