/**
 * Инвентарь (3.4.1, 3.4.2, 3.4.3).
 *
 * Чистая логика без DOM: ей пользуются и игрок, и склад деревни, и торговля.
 * Каталог предметов передаётся снаружи, чтобы ядро не зависело от контента.
 */

import type { EquipmentSlot, ItemDef } from '../data/items'

export interface Stack {
  id: string
  count: number
  /** Качество 0..1. Для ресурсов это усреднённая оценка партии. */
  quality: number
}

export interface Inventory {
  /** Предел веса в килограммах. */
  capacityKg: number
  stacks: Stack[]
}

export interface Equipment {
  tool: string | null
  weapon: string | null
  armor: string | null
}

export type Defs = ReadonlyMap<string, ItemDef>

const MIN_WEIGHT = 0.0001

export function createInventory(capacityKg: number): Inventory {
  return { capacityKg, stacks: [] }
}

export function createEquipment(): Equipment {
  return { tool: null, weapon: null, armor: null }
}

export function countOf(inventory: Inventory, id: string): number {
  return inventory.stacks.reduce((sum, stack) => (stack.id === id ? sum + stack.count : sum), 0)
}

export function weightOf(inventory: Inventory, defs: Defs): number {
  return inventory.stacks.reduce((sum, stack) => {
    const def = defs.get(stack.id)
    return sum + (def ? def.weight * stack.count : 0)
  }, 0)
}

export function freeSpaceKg(inventory: Inventory, defs: Defs): number {
  return Math.max(0, inventory.capacityKg - weightOf(inventory, defs))
}

/**
 * Кладёт предметы с учётом стека и веса.
 * Возвращает, сколько удалось положить; остаток не влез.
 */
export function addItems(
  inventory: Inventory,
  def: ItemDef,
  count: number,
  quality: number,
  defs: Defs,
): number {
  const requested = Math.trunc(count)
  if (requested <= 0) return 0

  const byWeight = Math.floor(freeSpaceKg(inventory, defs) / Math.max(def.weight, MIN_WEIGHT))
  let remaining = Math.min(requested, Math.max(0, byWeight))
  if (remaining === 0) return 0

  let added = 0
  const safeQuality = Math.min(1, Math.max(0, quality))

  for (const stack of inventory.stacks) {
    if (stack.id !== def.id) continue
    const room = def.stack - stack.count
    if (room <= 0) continue

    const take = Math.min(room, remaining)
    stack.count += take
    remaining -= take
    added += take
    if (remaining === 0) return added
  }

  while (remaining > 0) {
    const take = Math.min(def.stack, remaining)
    inventory.stacks.push({ id: def.id, count: take, quality: safeQuality })
    remaining -= take
    added += take
  }

  return added
}

/** Убирает до `count` штук. Возвращает, сколько убрано. */
export function removeItems(inventory: Inventory, id: string, count: number): number {
  let remaining = Math.max(0, Math.trunc(count))
  if (remaining === 0) return 0

  let removed = 0

  for (let index = inventory.stacks.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const stack = inventory.stacks[index]
    if (!stack || stack.id !== id) continue

    const take = Math.min(stack.count, remaining)
    stack.count -= take
    remaining -= take
    removed += take

    if (stack.count === 0) inventory.stacks.splice(index, 1)
  }

  return removed
}

/** Перекладывает из одного места в другое. Возвращает, сколько дошло. */
export function transfer(
  from: Inventory,
  to: Inventory,
  id: string,
  count: number,
  defs: Defs,
): number {
  const def = defs.get(id)
  if (!def) return 0

  const removed = removeItems(from, id, Math.min(count, countOf(from, id)))
  if (removed === 0) return 0

  const added = addItems(to, def, removed, 1, defs)

  // Что не влезло — возвращаем обратно, чтобы не терять предметы.
  if (added < removed) addItems(from, def, removed - added, 1, defs)

  return added
}

/** Надевает предмет в его слот. Без слота надевать нечего. */
export function equip(equipment: Equipment, def: ItemDef): boolean {
  const slot: EquipmentSlot | undefined = def.slot
  if (slot === undefined) return false
  equipment[slot] = def.id
  return true
}

export function unequip(equipment: Equipment, slot: EquipmentSlot): void {
  equipment[slot] = null
}
