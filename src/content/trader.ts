/**
 * Торговец (6.4).
 *
 * Один бродячий торговец, который заходит в умирающую деревню.
 * Товар у него ограниченный список, заказы — отдельно от товара.
 */

import type { TradeOffer, TradeOrder } from '../data/trade'
import type { Facing } from '../core/movement'

export interface TraderDef {
  id: string
  name: string
  title: string
  x: number
  y: number
  facing: Facing
  /** Что продаёт. */
  sells: readonly TradeOffer[]
  /** Что готов купить у героя. */
  buys: readonly string[]
  /** Первая просьба, вплетённая в разговор. */
  order: TradeOrder
}

export const TRADER: TraderDef = {
  id: 'korney',
  name: 'Корней',
  title: 'бродячий торговец',
  x: 560,
  y: 590,
  facing: 'right',
  sells: [
    { itemId: 'rope', price: 9 },
    { itemId: 'stone', price: 4 },
    { itemId: 'knife', price: 20 },
  ],
  buys: ['branch', 'log', 'herb', 'berry', 'hide', 'meat', 'plank', 'rope', 'stone'],
  order: { itemId: 'rope', count: 2, reward: 12 },
}

/** Столичный купец: приходит, когда посад становится городом. */
export const TRADER_CAPITAL: TraderDef = {
  id: 'capital_trader',
  name: 'Фрол',
  title: 'столичный купец',
  x: 820,
  y: 640,
  facing: 'left',
  sells: [
    { itemId: 'steel', price: 18 },
    { itemId: 'bread', price: 5 },
    { itemId: 'plank', price: 6 },
    { itemId: 'rope', price: 5 },
  ],
  buys: ['steel', 'hide', 'meat', 'fish', 'bread', 'plank', 'rope', 'clay', 'grain'],
  order: { itemId: 'steel', count: 3, reward: 60 },
}
