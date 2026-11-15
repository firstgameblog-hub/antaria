/**
 * Экспорт и импорт сохранения файлом (3.1.5).
 *
 * Работает с DOM, поэтому живёт в слое ui, а не в ядре.
 */

import { parseSave, serialize } from '../core/save'
import type { GameState } from '../core/state'

export function downloadSave(state: GameState, filename = 'antaria-save.json'): void {
  const blob = new Blob([serialize(state)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function readSaveFile(file: File): Promise<GameState> {
  const text = await file.text()
  return parseSave(text)
}
