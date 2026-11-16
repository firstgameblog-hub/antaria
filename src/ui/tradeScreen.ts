/**
 * Окно торговли (4.3.4, 6.4).
 *
 * Сверху просьба торговца, ниже его товар и то, что он готов купить.
 * Все расчёты — в ядре, окно только показывает цены и передаёт намерение.
 */

import { countOf, type Inventory } from '../core/inventory'
import { buyPrice, sellPrice } from '../core/trade'
import type { GameState } from '../core/state'
import { ITEM_BY_ID, itemName } from '../content/items'
import { TRADER } from '../content/trader'
import { escapeHtml } from './html'

export interface TradeScreenOptions {
  getState: () => GameState
  onBuy: (itemId: string) => string
  onSell: (itemId: string) => string
  onOrder: () => string
}

let overlay: HTMLDivElement | null = null
let status = ''
let options: TradeScreenOptions | null = null

export function openTradeScreen(screenOptions: TradeScreenOptions): void {
  options = screenOptions
  status = ''

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeTradeScreen()
  })

  document.body.append(overlay)
  render()
}

export function closeTradeScreen(): void {
  overlay?.remove()
  overlay = null
  options = null
}

function renderOrder(state: GameState): string {
  if (state.flags['trader.order.done'] === true) return ''

  const order = TRADER.order
  const have = countOf(state.player.inventory, order.itemId)
  const ready = have >= order.count

  return `
    <div class="trade__order">
      <div>
        <strong>Просьба Корнея.</strong>
        Нужно ${order.count} × ${escapeHtml(itemName(order.itemId))} — заплатит ${order.reward} монет.
        <span class="trade__note">У тебя ${have}.</span>
      </div>
      <button data-action="order" ${ready ? '' : 'disabled'}>Отдать</button>
    </div>
  `
}

function renderBuy(state: GameState): string {
  return TRADER.sells
    .map((offer) => {
      const price = buyPrice(offer, state.world.trader.trust)
      const affordable = state.player.money >= price

      return `
        <li class="trade-row">
          <div class="trade-row__info">
            <span class="trade-row__name">${escapeHtml(itemName(offer.itemId))}</span>
            <span class="trade-row__meta">${price} монет</span>
          </div>
          <button data-buy="${offer.itemId}" ${affordable ? '' : 'disabled'}>Купить</button>
        </li>
      `
    })
    .join('')
}

function renderSell(state: GameState): string {
  const inventory: Inventory = state.player.inventory
  const rows = inventory.stacks
    .filter((stack) => TRADER.buys.includes(stack.id))
    .map((stack) => {
      const def = ITEM_BY_ID.get(stack.id)
      if (!def) return ''
      const price = sellPrice(def, state.world.trader.trust)

      return `
        <li class="trade-row">
          <div class="trade-row__info">
            <span class="trade-row__name">${escapeHtml(def.name)} <small>×${stack.count}</small></span>
            <span class="trade-row__meta">${price} монет за штуку</span>
          </div>
          <button data-sell="${stack.id}">Продать</button>
        </li>
      `
    })
    .join('')

  return rows === '' ? '<li class="trade-row trade-row--empty">Продавать пока нечего.</li>' : rows
}

function render(): void {
  if (!overlay || !options) return

  const state = options.getState()

  overlay.innerHTML = `
    <div class="screen" role="dialog" aria-modal="true" aria-label="Торговля">
      <header class="screen__head">
        <h2 class="screen__title">${escapeHtml(TRADER.name)}, ${escapeHtml(TRADER.title)}</h2>
        <span class="trade__money">${state.player.money} монет</span>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>

      ${renderOrder(state)}

      <div class="trade__columns">
        <section class="trade__column">
          <h3 class="trade__heading">Купить</h3>
          <ul class="trade__list">${renderBuy(state)}</ul>
        </section>
        <section class="trade__column">
          <h3 class="trade__heading">Продать</h3>
          <ul class="trade__list">${renderSell(state)}</ul>
        </section>
      </div>

      <p class="screen__status">${escapeHtml(status)}</p>
    </div>
  `

  overlay.querySelector('[data-action="close"]')?.addEventListener('click', closeTradeScreen)

  overlay.querySelector('[data-action="order"]')?.addEventListener('click', () => {
    if (!options) return
    status = options.onOrder()
    render()
  })

  overlay.querySelectorAll<HTMLButtonElement>('button[data-buy]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset['buy']
      if (!id || !options) return
      status = options.onBuy(id)
      render()
    })
  })

  overlay.querySelectorAll<HTMLButtonElement>('button[data-sell]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset['sell']
      if (!id || !options) return
      status = options.onSell(id)
      render()
    })
  })
}
