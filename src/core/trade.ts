/**
 * Торговля (6.4): цены, покупка, продажа, заказ.
 *
 * Торговец покупает дешевле, чем продаёт, — иначе не было бы смысла.
 * Доверие немного сглаживает разницу в обе стороны.
 */

import type { ItemDef } from '../data/items'
import type { TradeOffer, TradeOrder } from '../data/trade'
import { addItems, countOf, removeItems } from './inventory'
import type { GameState } from './state'

export type Defs = ReadonlyMap<string, ItemDef>

export type TradeResult = { ok: true; message: string } | { ok: false; reason: string }

const BUY_MARKUP = 1.5
const SELL_RATE = 0.6
/** Хорошее качество и отличное добавляют к цене по 35%. */
const QUALITY_BONUS = 0.35

export function trustDiscount(trust: number): number {
  return Math.min(0.2, Math.max(0, trust) / 500)
}

export function buyPrice(offer: TradeOffer, trust: number, generosity = 0): number {
  return Math.max(1, Math.round(offer.price * BUY_MARKUP * (1 - trustDiscount(trust)) * (1 - generosity)))
}

export function sellPrice(def: ItemDef, trust: number, generosity = 0, quality = 1): number {
  const qualityBonus = 1 + Math.max(0, quality - 1) * QUALITY_BONUS

  return Math.max(
    1,
    Math.floor(
      def.price * SELL_RATE * (1 + trustDiscount(trust) * 0.5) * (1 + generosity) * qualityBonus,
    ),
  )
}

export function buy(
  state: GameState,
  offer: TradeOffer,
  defs: Defs,
  generosity = 0,
): TradeResult {
  const def = defs.get(offer.itemId)
  if (!def) return { ok: false, reason: 'Такого товара нет' }

  const price = buyPrice(offer, state.world.trader.trust, generosity)
  if (state.player.money < price) return { ok: false, reason: 'Не хватает монет' }

  const added = addItems(state.player.inventory, def, 1, 1, defs)
  if (added === 0) return { ok: false, reason: 'Нет места в грузе' }

  state.player.money -= price
  state.world.trader.trust = Math.min(100, state.world.trader.trust + 1)

  return { ok: true, message: `Куплено: ${def.name} за ${price}` }
}

export function sell(
  state: GameState,
  itemId: string,
  count: number,
  defs: Defs,
  generosity = 0,
  quality?: number,
): TradeResult {
  const def = defs.get(itemId)
  if (!def) return { ok: false, reason: 'Такого товара нет' }

  const stacks = state.player.inventory.stacks.filter((stack) => stack.id === itemId)
  const wanted =
    quality === undefined
      ? stacks.reduce<(typeof stacks)[number] | undefined>(
          (worst, stack) => (worst === undefined || stack.quality < worst.quality ? stack : worst),
          undefined,
        )
      : stacks.find((stack) => stack.quality === quality)

  if (!wanted) return { ok: false, reason: 'Нечего продавать' }
  if (wanted.count < count) return { ok: false, reason: 'Столько нет' }

  const price = sellPrice(def, state.world.trader.trust, generosity, wanted.quality) * count

  wanted.count -= count
  if (wanted.count === 0) {
    const index = state.player.inventory.stacks.indexOf(wanted)
    if (index >= 0) state.player.inventory.stacks.splice(index, 1)
  }

  state.player.money += price
  state.world.trader.trust = Math.min(100, state.world.trader.trust + 1)

  return { ok: true, message: `Продано: ${def.name} ×${count} за ${price}` }
}

export function completeOrder(state: GameState, order: TradeOrder, defs: Defs): TradeResult {
  const def = defs.get(order.itemId)
  if (!def) return { ok: false, reason: 'Такого товара нет' }

  if (countOf(state.player.inventory, order.itemId) < order.count) {
    return { ok: false, reason: 'Не хватает товара' }
  }

  removeItems(state.player.inventory, order.itemId, order.count)
  state.player.money += order.reward
  state.world.trader.trust = Math.min(100, state.world.trader.trust + 10)
  state.flags['trader.order.done'] = true

  return { ok: true, message: `Заказ выполнен: +${order.reward} монет` }
}
