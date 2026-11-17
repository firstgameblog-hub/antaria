/**
 * Налёт на деревню (8.3, M3).
 *
 * Не бой в лесу: за спиной дома и люди. Три выхода — драться, откупиться,
 * спрятаться за частоколом. Каждый что-то стоит.
 */

import { escapeHtml } from './html'

export interface RaidScreenOptions {
  text: string
  payCost: number
  canPay: boolean
  onFight: () => void
  onPay: () => void
  onHide: () => void
  /** Надпись над текстом. По умолчанию — обычная ночь у ворот. */
  title?: string
  fightLabel?: string
  payLabel?: string
  hideLabel?: string
}

let overlay: HTMLDivElement | null = null

export function closeRaidScreen(): void {
  overlay?.remove()
  overlay = null
}

export function openRaidScreen(options: RaidScreenOptions): void {
  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'combat-overlay'

  overlay.innerHTML = `
    <div class="raid">
      <div class="story__chapter">${escapeHtml(options.title ?? 'Ночь. У ворот')}</div>
      <p class="story__text">${escapeHtml(options.text)}</p>
      <div class="raid__actions">
        <button class="combat__button" data-raid="fight">${escapeHtml(options.fightLabel ?? 'Выйти против них')}</button>
        <button class="combat__button" data-raid="pay" ${options.canPay ? '' : 'disabled'}>${escapeHtml(options.payLabel ?? `Откупиться (${options.payCost} монет)`)}</button>
        <button class="combat__button" data-raid="hide">${escapeHtml(options.hideLabel ?? 'Спрятаться за частоколом')}</button>
      </div>
    </div>
  `

  document.body.append(overlay)

  overlay.querySelector('[data-raid="fight"]')?.addEventListener('click', () => {
    closeRaidScreen()
    options.onFight()
  })

  overlay.querySelector('[data-raid="pay"]')?.addEventListener('click', () => {
    closeRaidScreen()
    options.onPay()
  })

  overlay.querySelector('[data-raid="hide"]')?.addEventListener('click', () => {
    closeRaidScreen()
    options.onHide()
  })
}
