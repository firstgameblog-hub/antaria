/**
 * Распорядок жителей по часам.
 *
 * Один и тот же человек утром у своего дома, днём — у колодца или на поле,
 * вечером — у костра. Ночью его нет: он спит. Места выбраны внутри частокола,
 * чтобы никого не пришлось искать за воротами.
 */

import type { ScheduleStop } from '../core/schedule'

export const SCHEDULES: Record<string, readonly ScheduleStop[]> = {
  thread_roof: [
    { from: 6 * 60, x: 330, y: 545, note: 'у своего дома' },
    { from: 9 * 60, x: 470, y: 300, note: 'у колодца' },
    { from: 13 * 60, x: 330, y: 545, note: 'у своего дома' },
    { from: 18 * 60, x: 585, y: 600, note: 'у костра' },
  ],
  thread_hungry: [
    { from: 6 * 60, x: 870, y: 545, note: 'на пороге' },
    { from: 10 * 60, x: 880, y: 760, note: 'у поля' },
    { from: 15 * 60, x: 870, y: 545, note: 'на пороге' },
    { from: 18 * 60, x: 700, y: 560, note: 'у костра' },
  ],
  thread_plough: [
    { from: 6 * 60, x: 300, y: 860, note: 'у плуга' },
    { from: 12 * 60, x: 660, y: 640, note: 'у костра' },
    { from: 13 * 60, x: 300, y: 860, note: 'у плуга' },
    { from: 19 * 60, x: 300, y: 860, note: 'у плуга, при свете' },
  ],
  korney: [
    { from: 6 * 60, x: 560, y: 590, note: 'раскладывает товар' },
    { from: 12 * 60, x: 620, y: 640, note: 'у костра, ест' },
    { from: 13 * 60, x: 560, y: 590, note: 'торгует' },
    { from: 18 * 60, x: 745, y: 615, note: 'считает выручку у костра' },
  ],
}

export function scheduleOf(id: string): readonly ScheduleStop[] | undefined {
  return SCHEDULES[id]
}
