/**
 * Боссы (8.8).
 *
 * Не просто толстый зверь: своё место, своя слабость и трофей, за который
 * деревня получает право на следующую ступень.
 */

export interface BossSpot {
  id: string
  /** Логово на карте. */
  x: number
  y: number
  label: string
  enemyId: string
  /** Флаг, который ставится после победы. */
  flag: string
  journal: string
}

export const BOSS_SPOTS: readonly BossSpot[] = [
  {
    id: 'lair_old_wolf',
    x: 1150,
    y: 200,
    label: 'Старое логово',
    enemyId: 'old_wolf',
    flag: 'boss.old_wolf',
    journal: 'Старый волк остался в логове. Клык теперь висит у меня на поясе — тяжёлый, как обещание.',
  },
]
