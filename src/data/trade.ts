/** Схема торговли (2.3.x): что торговец продаёт и что просит. */

export interface TradeOffer {
  itemId: string
  /** Базовая цена до наценки торговца и поправки на доверие. */
  price: number
}

export interface TradeOrder {
  itemId: string
  count: number
  reward: number
}
