import './styles.css'
import { createInitialState, type GameState } from './core/state'
import { AUTO_SLOT, readBackup, readSlot, writeSlot } from './core/storage'
import { formatDateTime, nextMorning } from './core/time'
import { openSaveScreen } from './ui/saveScreen'
import { escapeHtml } from './ui/html'
import { stageLabel } from './ui/labels'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('Не найден корневой элемент #app')
const app: HTMLDivElement = root

let state: GameState
let statusNote = ''
let nightNote = ''

function loadState(): GameState {
  const read = readSlot(AUTO_SLOT)
  if (read.status === 'ok') return read.state

  if (read.status === 'corrupt') {
    const backup = readBackup(AUTO_SLOT)
    if (backup.status === 'ok') {
      statusNote = `Основное сохранение не читается: ${read.reason}. Мир восстановлен из резервной копии.`
      return backup.state
    }
    statusNote = `Сохранение не читается: ${read.reason}. Начата новая игра.`
  }

  return createInitialState()
}

function render(): void {
  const name = state.player.name || 'сын старосты'
  const notes = [statusNote, nightNote].filter((note) => note !== '')

  app.innerHTML = `
    <main class="boot">
      <h1 class="boot__title">Хроники Антарии</h1>
      <p class="boot__subtitle">${escapeHtml(name)}</p>
      <p class="clock">${escapeHtml(formatDateTime(state.clock))}</p>
      <p class="settlement">${escapeHtml(stageLabel(state.village.stageId))} · людей: ${state.village.population}</p>
      ${notes.map((note) => `<p class="notice">${escapeHtml(note)}</p>`).join('')}
      <div class="buttons">
        <button class="menu-button" data-action="sleep">Лечь спать</button>
        <button class="menu-button" data-action="saves">Сохранения</button>
      </div>
      <p class="boot__note">Каркас проекта. Сцена деревни появится на вехе M0.</p>
    </main>
  `

  app.querySelector<HTMLButtonElement>('[data-action="sleep"]')?.addEventListener('click', sleep)
  app.querySelector<HTMLButtonElement>('[data-action="saves"]')?.addEventListener('click', () => {
    openSaveScreen({
      getState: () => state,
      onLoad: (loaded) => {
        state = loaded
        statusNote = ''
        nightNote = ''
        persist()
        render()
      },
    })
  })
}

/** Ночь (3.2.6). Время идёт вперёд, утром — сводка. Следы в деревне появятся с 7.16. */
function sleep(): void {
  const step = nextMorning(state.clock)
  state.clock = step.clock
  nightNote =
    step.daysPassed > 1
      ? `Ты проспал мимо ${step.daysPassed} ночей. В деревне пока тихо.`
      : 'Ночь прошла. В деревне пока тихо.'
  persist()
  render()
}

function persist(): void {
  state.savedAt = Date.now()
  const result = writeSlot(AUTO_SLOT, state)
  if (!result.ok) {
    statusNote = `Автосохранение не удалось: ${result.reason}`
    render()
  }
}

state = loadState()
render()

// Автосохранение при уходе со страницы (3.1.4).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist()
})
globalThis.addEventListener('pagehide', () => {
  persist()
})

// Отладочный доступ к состоянию. Живёт только в dev-режиме.
if (import.meta.env.DEV) {
  Object.defineProperty(globalThis, '__antaria', {
    configurable: true,
    value: {
      get state() {
        return state
      },
      save: () => {
        persist()
        return state.savedAt
      },
      load: () => {
        state = loadState()
        render()
        return state
      },
      reset: () => {
        state = createInitialState()
        persist()
        render()
        return state
      },
    },
  })
}
