/**
 * HUD (4.3.1).
 *
 * Здесь только рамка и слоты. Показатели появляются по мере того, как
 * возникают их системы (правило 0.2.6): ресурсы — с 3.4, деньги — с 6.6,
 * здоровье и усталость — с 3.5.3, погода — с 6.13. Пустые слоты не рисуются.
 */

import type { ClockState } from '../core/state'
import { formatDateTime } from '../core/time'
import { escapeHtml } from './html'

export interface HudResource {
  label: string
  value: number
}

export interface HudStatus {
  label: string
  value: number
  max: number
}

export interface HudData {
  clock: ClockState
  stage: string
  population: number
  notes: readonly string[]
  resources: readonly HudResource[]
  statuses: readonly HudStatus[]
  weather?: string
}

export interface HudHandlers {
  onSleep: () => void
  onSaves: () => void
  onCraft: () => void
  onJournal: () => void
  onSound: () => void
  onVillage: () => void
}

export interface Hud {
  element: HTMLElement
  update: (data: HudData) => void
  setSoundEnabled: (enabled: boolean) => void
}

function renderResources(container: HTMLElement, resources: readonly HudResource[]): void {
  if (resources.length === 0) {
    container.hidden = true
    container.replaceChildren()
    return
  }

  container.hidden = false
  container.innerHTML = resources
    .map(
      (resource) => `
        <span class="chip">
          <span class="chip__label">${escapeHtml(resource.label)}</span>
          <span class="chip__value">${resource.value}</span>
        </span>`,
    )
    .join('')
}

function renderStatuses(container: HTMLElement, statuses: readonly HudStatus[]): void {
  if (statuses.length === 0) {
    container.hidden = true
    container.replaceChildren()
    return
  }

  container.hidden = false
  container.innerHTML = statuses
    .map((status) => {
      const max = Math.max(1, status.max)
      const percent = Math.max(0, Math.min(100, (status.value / max) * 100))
      return `
        <div class="bar">
          <span class="bar__label">${escapeHtml(status.label)}</span>
          <span class="bar__track"><span class="bar__fill" style="width: ${percent}%"></span></span>
        </div>`
    })
    .join('')
}

export function createHud(handlers: HudHandlers): Hud {
  const element = document.createElement('div')
  element.className = 'hud-layer'
  element.innerHTML = `
    <header class="hud hud--top">
      <span class="hud__date" data-ref="date"></span>
      <div class="hud__meta">
        <span class="hud__weather" data-ref="weather" hidden></span>
        <span class="hud__stage" data-ref="stage"></span>
        <button class="hud__sound" data-action="sound" aria-label="Звук" aria-pressed="true">♪</button>
      </div>
    </header>
    <div class="hud hud--bottom">
      <div class="hud__row" data-ref="resources" hidden></div>
      <div class="hud__row hud__row--bars" data-ref="statuses" hidden></div>
      <p class="hud__note" data-ref="note" hidden></p>
      <div class="hud__actions">
        <button class="hud__button" data-action="village">Деревня</button>
        <button class="hud__button" data-action="journal">Хроника</button>
        <button class="hud__button" data-action="craft">Ремесло</button>
        <button class="hud__button" data-action="sleep">Лечь спать</button>
        <button class="hud__button" data-action="saves">Сохранения</button>
      </div>
    </div>
  `

  const dateEl = element.querySelector<HTMLElement>('[data-ref="date"]')
  const weatherEl = element.querySelector<HTMLElement>('[data-ref="weather"]')
  const stageEl = element.querySelector<HTMLElement>('[data-ref="stage"]')
  const resourcesEl = element.querySelector<HTMLElement>('[data-ref="resources"]')
  const statusesEl = element.querySelector<HTMLElement>('[data-ref="statuses"]')
  const noteEl = element.querySelector<HTMLElement>('[data-ref="note"]')

  element.querySelector<HTMLButtonElement>('[data-action="sleep"]')?.addEventListener('click', () => {
    handlers.onSleep()
  })
  element.querySelector<HTMLButtonElement>('[data-action="saves"]')?.addEventListener('click', () => {
    handlers.onSaves()
  })
  element.querySelector<HTMLButtonElement>('[data-action="craft"]')?.addEventListener('click', () => {
    handlers.onCraft()
  })
  element.querySelector<HTMLButtonElement>('[data-action="journal"]')?.addEventListener('click', () => {
    handlers.onJournal()
  })
  element.querySelector<HTMLButtonElement>('[data-action="village"]')?.addEventListener('click', () => {
    handlers.onVillage()
  })

  const soundButton = element.querySelector<HTMLButtonElement>('[data-action="sound"]')
  soundButton?.addEventListener('click', () => {
    handlers.onSound()
  })

  return {
    element,
    setSoundEnabled(enabled: boolean) {
      if (!soundButton) return
      soundButton.classList.toggle('hud__sound--off', !enabled)
      soundButton.setAttribute('aria-pressed', String(enabled))
    },
    update(data: HudData) {
      if (dateEl) dateEl.textContent = formatDateTime(data.clock)

      if (weatherEl) {
        if (data.weather === undefined) {
          weatherEl.hidden = true
          weatherEl.textContent = ''
        } else {
          weatherEl.hidden = false
          weatherEl.textContent = data.weather
        }
      }

      if (stageEl) {
        stageEl.textContent = data.stage
      }

      if (resourcesEl) renderResources(resourcesEl, data.resources)
      if (statusesEl) renderStatuses(statusesEl, data.statuses)

      if (noteEl) {
        const text = data.notes.filter((note) => note !== '').join(' ')
        noteEl.textContent = text
        noteEl.hidden = text === ''
      }
    },
  }
}
