/**
 * Дневник-хроника (4.3.6, 9.4).
 *
 * Не список квестов, а книга: даты, абзацы, ничего лишнего.
 * Записи копятся сами по ходу сцен и первых дел.
 */

import type { JournalEntry } from '../core/state'
import { formatDate, formatTime } from '../core/time'
import { escapeHtml } from './html'

export interface JournalScreenOptions {
  getEntries: () => JournalEntry[]
}

interface JournalChapter {
  date: string
  items: JournalEntry[]
}

let overlay: HTMLDivElement | null = null
let options: JournalScreenOptions | null = null

function groupByDate(entries: readonly JournalEntry[]): JournalChapter[] {
  const chapters: JournalChapter[] = []

  for (const entry of entries) {
    const date = formatDate({ year: entry.year, day: entry.day, minutes: 0 })
    const last = chapters[chapters.length - 1]

    if (last && last.date === date) {
      last.items.push(entry)
    } else {
      chapters.push({ date, items: [entry] })
    }
  }

  return chapters
}

export function closeJournalScreen(): void {
  overlay?.remove()
  overlay = null
  options = null
}

function renderEntry(entry: JournalEntry): string {
  const time = entry.minutes === undefined ? '' : formatTime(entry.minutes)

  return `
    <div class="journal__entry">
      <span class="journal__time">${time === '' ? '—' : time}</span>
      <span class="journal__text">${escapeHtml(entry.text)}</span>
    </div>
  `
}

function render(): void {
  if (!overlay || !options) return

  const chapters = groupByDate(options.getEntries())

  overlay.innerHTML = `
    <div class="screen journal" role="dialog" aria-modal="true" aria-label="Хроника">
      <header class="screen__head">
        <h2 class="screen__title">Хроника</h2>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>
      <div class="journal__body">
        ${
          chapters.length === 0
            ? '<p class="journal__empty">Пока ничего не записано.</p>'
            : chapters
                .map(
                  (chapter) => `
              <section class="journal__chapter">
                <h3 class="journal__date">${escapeHtml(chapter.date)}</h3>
                ${chapter.items.map((entry) => renderEntry(entry)).join('')}
              </section>`,
                )
                .join('')
        }
      </div>
    </div>
  `

  overlay.querySelector('[data-action="close"]')?.addEventListener('click', closeJournalScreen)
}

export function openJournalScreen(screenOptions: JournalScreenOptions): void {
  options = screenOptions

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeJournalScreen()
  })

  document.body.append(overlay)
  render()
}
