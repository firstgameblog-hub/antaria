/**
 * Схема узла сбора (2.3.2).
 *
 * Узел — это место в мире, где что-то растёт или лежит. Собранное исчезает
 * и возвращается через игровое время, а не по часам на стене (1.3.7).
 */

export type NodeKind = 'herb' | 'berry' | 'branch' | 'stone' | 'log'

export interface GatheringNodeDef {
  id: string
  kind: NodeKind
  name: string
  /** Положение на сцене в мировых пикселях. */
  x: number
  y: number
  /** Какой предмет даёт. */
  itemId: string
  /** Сколько штук за один сбор. */
  count: number
  /** Через сколько игровых минут узел восстанавливается. */
  restoreMinutes: number
  /** Инструмент, без которого не собрать (6.2). Пока не используется. */
  requiredTool?: string
}
