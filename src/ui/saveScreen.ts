/**
 * Экран сохранений (3.1.7): автосохранение плюс три ручных слота,
 * а также выгрузка и загрузка файлом (3.1.5).
 */

import { SaveError } from '../core/save'
import type { GameState } from '../core/state'
import {
  SAVE_SLOTS,
  deleteSlot,
  listSlots,
  readSlot,
  writeSlot,
  type SaveSlotId,
  type SlotInfo,
} from '../core/storage'
import { escapeHtml } from './html'
import { stageLabel } from './labels'
import { downloadSave, readSaveFile } from './saveFile'

export interface SaveScreenOptions {
  getState: () => GameState
  onLoad: (state: GameState) => void
  onNewGame: () => void
}

const SLOT_LABELS: Record<SaveSlotId, string> = {
  auto: 'Автосохранение',
  slot1: 'Слот 1',
  slot2: 'Слот 2',
  slot3: 'Слот 3',
}

let overlay: HTMLDivElement | null = null
let statusText = ''
let currentOptions: SaveScreenOptions | null = null

export function openSaveScreen(options: SaveScreenOptions): void {
  currentOptions = options
  statusText = ''

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeSaveScreen()
  })

  document.body.append(overlay)
  renderScreen()
}

export function closeSaveScreen(): void {
  overlay?.remove()
  overlay = null
  currentOptions = null
}

function isSlot(value: string | undefined): value is SaveSlotId {
  return value !== undefined && (SAVE_SLOTS as readonly string[]).includes(value)
}

function formatSavedAt(timestamp: number): string {
  if (timestamp <= 0) return '—'
  return new Date(timestamp).toLocaleString('ru-RU')
}

function slotDetails(info: SlotInfo): string {
  if (info.status === 'empty') return '<span class="slot__empty">пусто</span>'
  if (info.status === 'corrupt') {
    return `<span class="slot__corrupt">не читается${info.reason ? `: ${escapeHtml(info.reason)}` : ''}</span>`
  }

  const summary = info.summary
  if (!summary) return ''

  const size = summary.bytes < 1024 ? `${summary.bytes} Б` : `${(summary.bytes / 1024).toFixed(1)} КБ`

  return [
    `Год ${summary.year}, день ${summary.day} · ${escapeHtml(stageLabel(summary.stageId))}`,
    `<span class="slot__meta">${formatSavedAt(summary.savedAt)} · ${size}</span>`,
  ].join('<br>')
}

function renderSlot(info: SlotInfo): string {
  const canLoad = info.status === 'ok'
  const canDelete = info.status !== 'empty' && info.slot !== 'auto'

  return `
    <li class="slot">
      <div class="slot__info">
        <div class="slot__label">${SLOT_LABELS[info.slot]}</div>
        <div class="slot__details">${slotDetails(info)}</div>
      </div>
      <div class="slot__actions">
        <button data-action="save" data-slot="${info.slot}">Сохранить</button>
        <button data-action="load" data-slot="${info.slot}" ${canLoad ? '' : 'disabled'}>Загрузить</button>
        ${
          info.slot === 'auto'
            ? ''
            : `<button data-action="delete" data-slot="${info.slot}" ${canDelete ? '' : 'disabled'}>Удалить</button>`
        }
      </div>
    </li>
  `
}

function renderScreen(): void {
  if (!overlay || !currentOptions) return

  const slots = listSlots()

  overlay.innerHTML = `
    <div class="screen" role="dialog" aria-modal="true" aria-label="Сохранения">
      <header class="screen__head">
        <h2 class="screen__title">Сохранения</h2>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>
      <ul class="slots">${slots.map(renderSlot).join('')}</ul>
      <p class="screen__status">${escapeHtml(statusText)}</p>
      <footer class="screen__foot">
        <button data-action="export">Выгрузить в файл</button>
        <button data-action="import">Загрузить из файла</button>
        <button class="screen__new" data-action="new">Начать заново</button>
        <input class="screen__file" type="file" accept="application/json,.json" hidden />
      </footer>
    </div>
  `

  bind()
}

function bind(): void {
  if (!overlay) return

  overlay.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      handleAction(button.dataset['action'], button.dataset['slot'])
    })
  })

  const input = overlay.querySelector<HTMLInputElement>('input[type=file]')
  input?.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return
    void importFromFile(file).finally(() => {
      input.value = ''
    })
  })
}

async function importFromFile(file: File): Promise<void> {
  const options = currentOptions
  if (!options) return

  try {
    const state = await readSaveFile(file)
    options.onLoad(state)
    closeSaveScreen()
  } catch (error) {
    statusText = error instanceof SaveError ? error.message : 'Файл не удалось прочитать'
    renderScreen()
  }
}

function handleAction(action: string | undefined, slot: string | undefined): void {
  const options = currentOptions
  if (!action || !options) return

  if (action === 'close') {
    closeSaveScreen()
    return
  }

  if (action === 'export') {
    downloadSave(options.getState())
    statusText = 'Текущее состояние выгружено в файл.'
    renderScreen()
    return
  }

  if (action === 'import') {
    overlay?.querySelector<HTMLInputElement>('input[type=file]')?.click()
    return
  }

  if (action === 'new') {
    if (!globalThis.confirm('Начать заново? Текущая деревня и хроника пропадут.')) return
    const start = options.onNewGame
    closeSaveScreen()
    start()
    return
  }

  if (!isSlot(slot)) return

  if (action === 'save') {
    const result = writeSlot(slot, options.getState())
    statusText = result.ok ? `${SLOT_LABELS[slot]}: сохранено.` : `Не удалось сохранить: ${result.reason}`
    renderScreen()
    return
  }

  if (action === 'load') {
    const read = readSlot(slot)
    if (read.status === 'ok') {
      options.onLoad(read.state)
      closeSaveScreen()
      return
    }
    statusText = read.status === 'corrupt' ? `Не читается: ${read.reason}` : 'Слот пуст.'
    renderScreen()
    return
  }

  if (action === 'delete') {
    if (!globalThis.confirm(`Удалить «${SLOT_LABELS[slot]}»?`)) return
    deleteSlot(slot)
    statusText = `${SLOT_LABELS[slot]}: удалено.`
    renderScreen()
  }
}
