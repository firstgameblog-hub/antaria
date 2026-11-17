/** Схема постройки (2.3.4): сколько стоит и что даёт. */

export type StructureKind = 'well' | 'barn' | 'forge' | 'stall' | 'tower' | 'market' | 'guild'

export interface StructureCost {
  itemId: string
  count: number
}

export interface StructureDef {
  id: string
  name: string
  kind: StructureKind
  /** Место на сцене в тайлах. */
  x: number
  y: number
  w: number
  h: number
  description: string
  cost: readonly StructureCost[]
  /** Игровые минуты на работу. */
  minutes: number
  journal: string
}
