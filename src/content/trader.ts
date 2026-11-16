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
