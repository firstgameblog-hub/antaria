/** Схема противника (2.3.7) и боевых действий (8.1). */

export interface EnemyLoot {
  itemId: string
  count: number
  chance?: number
}

export interface EnemyDef {
  id: string
  name: string
  maxHp: number
  minDamage: number
  maxDamage: number
  initiative: number
  /** Что говорит сцена, когда враг появляется. */
  intro: string
  /** Раненый зверь может уйти: тогда добычи не будет. */
  escapesWhenHurt?: boolean
  /** Слабое место: открывается действием «присмотреться». */
  weakness?: string
  /** Во сколько раз сильнее удар по слабому месту. */
  weakMultiplier?: number
  /** В ярости бьёт сильнее, когда ранен ниже половины. */
  enrages?: boolean
  loot?: readonly EnemyLoot[]
}

export type CombatAction = 'attack' | 'observe' | 'weak' | 'defend' | 'flee'

export type CombatOutcome = 'victory' | 'defeat' | 'fled' | 'escaped'
