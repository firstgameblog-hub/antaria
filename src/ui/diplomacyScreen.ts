/**
 * Посол Тихой Пади (10.1, 10.4).
 *
 * Один разговор, три исхода. Дальше отношения живут сами: караваны ходят
 * чаще или реже, цены лучше или хуже.
 */

import { escapeHtml } from './html'

export interface DiplomacyOptions {
  text: string
  tributeCost: number
  canPay: boolean
  onAlly: () => void
  onTribute: () => void
  onRefuse: () => void
}

let overlay: HTMLDivElement | null = null

function close(): void {
  overlay?.remove()
  overlay = null
}

export function openDiplomacyScreen(options: DiplomacyOptions): void {
  close()
  overlay = document.createElement('div')
  overlay.className = 'combat-overlay'

  overlay.innerHTML = `
    <div class="raid">
      <div class="story__chapter">Посол Тихой Пади</div>
      <p class="story__text">${escapeHtml(options.text)}</p>
      <div class="raid__actions">
        <button class="combat__button" data-diplo="ally">Заключить торговый союз</button>
        <button class="combat__button" data-diplo="tribute" ${options.canPay ? '' : 'disabled'}>Заплатить дань (${options.tributeCost} монет)</button>
        <button class="combat__button" data-diplo="refuse">Отказать</button>
      </div>
    </div>
  `

  document.body.append(overlay)

  overlay.querySelector('[data-diplo="ally"]')?.addEventListener('click', () => {
    close()
    options.onAlly()
  })
  overlay.querySelector('[data-diplo="tribute"]')?.addEventListener('click', () => {
    close()
    options.onTribute()
  })
  overlay.querySelector('[data-diplo="refuse"]')?.addEventListener('click', () => {
    close()
    options.onRefuse()
  })
}

export function closeDiplomacyScreen(): void {
  close()
}
