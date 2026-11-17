/**
 * Места охоты (8.4).
 *
 * Следы — это не ресурс, а приглашение: проверил — пошёл по следу — встретил зверя.
 * Восстановление общее с узлами сбора: одно и то же игровое время.
 */

export interface HuntSpot {
  id: string
  x: number
  y: number
  label: string
  restoreMinutes: number
  /** Стадия, с которой место появляется. */
  requiresStage?: string
}

export const HUNT_SPOTS: readonly HuntSpot[] = [
  {
    id: 'tracks_south',
    x: 220,
    y: 1130,
    label: 'Свежие следы',
    restoreMinutes: 1440,
    requiresStage: 'stage_first_smoke',
  },
  {
    id: 'tracks_east',
    x: 1100,
    y: 720,
    label: 'Свежие следы',
    restoreMinutes: 1440,
  },
  {
    id: 'tracks_west',
    x: 300,
    y: 1050,
    label: 'Волчья тропа',
    restoreMinutes: 1440,
    requiresStage: 'stage_trade_road',
  },
  {
    id: 'tracks_deep',
    x: 1100,
    y: 1430,
    label: 'Следы крупного зверя',
    restoreMinutes: 1440,
    requiresStage: 'stage_free_town',
  },
]
