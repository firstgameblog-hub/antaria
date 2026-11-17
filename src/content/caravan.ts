/**
 * Караван (6.5, M4).
 *
 * Приходит по дороге раз в несколько дней, стоит у ворот до вечера.
 * Привозит то, чего в деревне нет, и платит лучше местного торговца.
 */

import type { TradeOffer } from '../data/trade'

export interface CaravanDef {
  id: string
  name: string
  title: string
  /** Где стоит, пока не уехал. */
  x: number
  y: number
  sells: readonly TradeOffer[]
  buys: readonly string[]
  /** Насколько щедрее местного торговца: 0 — как Корней, 1 — вдвое лучше. */
  generosity: number
}

export const CARAVAN: CaravanDef = {
  id: 'caravan_tihaya',
  name: 'Караван из Тихой Пади',
  title: 'пришёл по дороге',
  x: 620,
  y: 1180,
  sells: [
    { itemId: 'ore', price: 9 },
    { itemId: 'rope', price: 9 },
    { itemId: 'bread', price: 5 },
    { itemId: 'pickaxe', price: 30 },
  ],
  buys: ['branch', 'log', 'herb', 'berry', 'hide', 'meat', 'plank', 'rope', 'ore', 'grain', 'bread'],
  generosity: 0.25,
}
