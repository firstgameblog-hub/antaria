/**
 * Экран сцены (4.3.5, 9.2).
 *
 * Книжная вёрстка: тёмный фон, крупный текст, минимум украшений.
 * Продолжение — клик или Enter. Выбор — кнопками, без таймеров.
 */

import type { StoryChoice, StoryScene } from '../data/story'
import { drawIllustration } from './illustrations'
import { escapeHtml } from './html'

export interface StoryScreenOptions {
  scene: StoryScene
  startBeat: number
  /** Сохранить прогресс, чтобы перезагрузка не откатывала сцену. */
  onBeat: (beat: number) => void
  onChoice: (beat: number, choice: StoryChoice) => void
  onFinish: () => void
}

let overlay: HTMLDivElement | null = null
let options: StoryScreenOptions | null = null
let beatIndex = 0
let extraText: string | null = null
/** Картинка к тексту, который показан после выбора. */
let extraArt: string | undefined

function close(): void {
  globalThis.removeEventListener('keydown', onKeyDown)
  overlay?.remove()
  overlay = null
  options = null
}

function finish(): void {
  const current = options
  close()
  current?.onFinish()
}

function advance(): void {
  if (!options) return

  const beat = options.scene.beats[beatIndex]
  if (extraText === null && beat?.choices && beat.choices.length > 0) return

  extraText = null
  extraArt = undefined
  beatIndex += 1

  if (beatIndex >= options.scene.beats.length) {
    finish()
    return
  }

  options.onBeat(beatIndex)
  render()
}

function choose(choice: StoryChoice): void {
  if (!options) return

  options.onChoice(beatIndex, choice)
  extraText = choice.after ?? null
  extraArt = choice.art

  if (extraText === null) {
    advance()
    return
  }

  render()
}

function onKeyDown(event: KeyboardEvent): void {
  if (!options) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    advance()
    return
  }

  const beat = options.scene.beats[beatIndex]
  const choices = extraText === null ? (beat?.choices ?? []) : []
  const number = Number.parseInt(event.key, 10)
  if (!Number.isNaN(number) && number >= 1 && number <= choices.length) {
    const choice = choices[number - 1]
    if (choice) choose(choice)
  }
}

function render(): void {
  if (!overlay || !options) return

  const beat = options.scene.beats[beatIndex]
  const text = extraText ?? beat?.text ?? ''
  const choices = extraText === null ? (beat?.choices ?? []) : []
  const art = extraText === null ? (beat?.art ?? options.scene.art) : extraArt

  overlay.innerHTML = `
    <div class="story">
      <div class="story__chapter">${escapeHtml(options.scene.title)}</div>
      ${art !== undefined ? '<canvas class="story__art" aria-hidden="true"></canvas>' : ''}
      <p class="story__text">${escapeHtml(text)}</p>
      ${
        choices.length > 0
          ? `<div class="story__choices">
               ${choices
                 .map(
                   (choice, index) =>
                     `<button class="story__choice" data-choice="${index}">${escapeHtml(choice.text)}</button>`,
                 )
                 .join('')}
             </div>`
          : `<div class="story__hint">нажми, чтобы продолжить</div>`
      }
    </div>
  `

  if (art !== undefined) {
    const canvas = overlay.querySelector<HTMLCanvasElement>('canvas.story__art')
    if (canvas) {
      const ratio = Math.min(2, globalThis.devicePixelRatio || 1)
      const width = Math.max(320, Math.min(680, Math.round(canvas.clientWidth || 640)))
      const height = Math.round((width * 9) / 16)

      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        drawIllustration(ctx, art, width, height)
      }
    }
  }

  overlay.querySelectorAll<HTMLButtonElement>('button[data-choice]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      const index = Number.parseInt(button.dataset['choice'] ?? '', 10)
      const choice = choices[index]
      if (choice) choose(choice)
    })
  })
}

export function openStoryScreen(screenOptions: StoryScreenOptions): void {
  options = screenOptions
  beatIndex = Math.max(0, Math.min(screenOptions.startBeat, screenOptions.scene.beats.length - 1))
  extraText = null
  extraArt = undefined

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'story-overlay'
  overlay.addEventListener('click', () => {
    if (extraText !== null || (options?.scene.beats[beatIndex]?.choices?.length ?? 0) === 0) {
      advance()
    }
  })

  document.body.append(overlay)
  globalThis.addEventListener('keydown', onKeyDown)
  render()
}
