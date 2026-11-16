/**
 * Экран сцены (4.3.5, 9.2).
 *
 * Книжная вёрстка: тёмный фон, крупный текст, минимум украшений.
 * Продолжение — клик или Enter. Выбор — кнопками, без таймеров.
 */

import type { StoryChoice, StoryScene } from '../data/story'
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

  overlay.innerHTML = `
    <div class="story">
      <div class="story__chapter">${escapeHtml(options.scene.title)}</div>
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
