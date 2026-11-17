/**
 * Облачко мыслей (9.x).
 *
 * Как строится: облако — это не картинка и не SVG, а стопка кругов и одного
 * скруглённого прямоугольника одного цвета. Круги стоят по процентам, поэтому
 * форма тянется под любой размер: меняешь только width у .thought — и облако
 * остаётся облаком. Тень — drop-shadow на обёртке: она обводит общий силуэт,
 * а не отдельные круги.
 *
 * Размеры на будущее: small (320px), medium (480px), large (640px).
 */

import { escapeHtml } from './html'

export type ThoughtSize = 'small' | 'medium' | 'large'

export interface ThoughtOptions {
  text: string
  /** Надпись на кнопке. По умолчанию «Идти». */
  button?: string
  size?: ThoughtSize
  onClose?: () => void
}

const SIZES: Record<ThoughtSize, string> = {
  small: '20rem',
  medium: '30rem',
  large: '40rem',
}

let overlay: HTMLDivElement | null = null

export function closeThought(): void {
  overlay?.remove()
  overlay = null
}

export function isThoughtOpen(): boolean {
  return overlay !== null
}

export function openThought(options: ThoughtOptions): void {
  closeThought()

  overlay = document.createElement('div')
  overlay.className = 'thought-overlay'

  const width = SIZES[options.size ?? 'medium']

  overlay.innerHTML = `
    <div class="thought" style="--thought-width: ${width}" role="dialog" aria-modal="true" aria-label="Мысли">
      <div class="thought__cloud" aria-hidden="true">
        <span class="thought__blob thought__blob--base"></span>
        <span class="thought__blob thought__blob--tl"></span>
        <span class="thought__blob thought__blob--tr"></span>
        <span class="thought__blob thought__blob--bl"></span>
        <span class="thought__blob thought__blob--br"></span>
        <span class="thought__blob thought__blob--l"></span>
        <span class="thought__blob thought__blob--r"></span>
        <span class="thought__tail thought__tail--big"></span>
        <span class="thought__tail thought__tail--small"></span>
      </div>

      <div class="thought__body">
        <p class="thought__text">${escapeHtml(options.text)}</p>
        <button class="thought__button" data-thought="close">${escapeHtml(options.button ?? 'Идти')}</button>
      </div>
    </div>
  `

  overlay.querySelector('[data-thought="close"]')?.addEventListener('click', () => {
    closeThought()
    options.onClose?.()
  })

  document.body.append(overlay)
}
