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
  loot?: readonly EnemyLoot[]
}

export type CombatAction = 'attack' | 'defend' | 'flee'

export type CombatOutcome = 'victory' | 'defeat' | 'fled'
