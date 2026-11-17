/**
 * Экран боя (4.3.1, 8.1).
 *
 * Тёмная сцена, две полосы здоровья, короткий журнал и три действия.
 * Нарочно без анимаций: бой здесь — не аттракцион, а решение.
 */

import type { CombatAction, CombatOutcome } from '../data/combat'
import type { CombatState } from '../core/combat'
import { escapeHtml } from './html'

export interface CombatScreenOptions {
  getState: () => CombatState | null
  onAction: (action: CombatAction) => void
  onFinish: () => void
}

let overlay: HTMLDivElement | null = null
let options: CombatScreenOptions | null = null

function bar(value: number, max: number, modifier: string): string {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return `<span class="bar-line ${modifier}"><span class="bar-line__fill" style="width: ${percent}%"></span></span>`
}

function outcomeText(outcome: CombatOutcome, enemy: string): string {
  if (outcome === 'victory') return `${enemy} больше не поднимется.`
  if (outcome === 'defeat') return 'В глазах темнеет. Ты ещё дышишь — значит, тебе повезло.'
  return 'Ты уходишь, не оглядываясь.'
}

function render(): void {
  if (!overlay || !options) return

  const state = options.getState()
  if (!state) {
    overlay.remove()
    overlay = null
    return
  }

  const finished = state.outcome !== null

  overlay.innerHTML = `
    <div class="combat">
      <div class="combat__side">
        <div class="combat__name">${escapeHtml(state.enemy.name)}</div>
        ${bar(state.enemyHp, state.enemy.maxHp, 'bar-line--enemy')}
        <div class="combat__hp">${state.enemyHp} / ${state.enemy.maxHp}</div>
      </div>

      <div class="combat__log">
        ${state.log.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
      </div>

      <div class="combat__side">
        <div class="combat__name">Ты</div>
        ${bar(state.playerHp, state.playerMaxHp, 'bar-line--player')}
        <div class="combat__hp">${state.playerHp} / ${state.playerMaxHp}</div>
      </div>

      ${
        finished
          ? `<div class="combat__outcome">${escapeHtml(outcomeText(state.outcome as CombatOutcome, state.enemy.name))}</div>
             <button class="combat__button" data-action="continue">Дальше</button>`
          : `<div class="combat__actions">
               <button class="combat__button" data-combat="attack">Ударить</button>
               ${
                 state.revealed
                   ? '<button class="combat__button" data-combat="weak">Бить в слабое место</button>'
                   : '<button class="combat__button" data-combat="observe">Присмотреться</button>'
               }
               <button class="combat__button" data-combat="defend">Закрыться</button>
               <button class="combat__button" data-combat="flee">Бежать</button>
             </div>`
      }
    </div>
  `

  overlay.querySelector('[data-action="continue"]')?.addEventListener('click', () => {
    const finish = options?.onFinish
    overlay?.remove()
    overlay = null
    options = null
    finish?.()
  })

  overlay.querySelectorAll<HTMLButtonElement>('button[data-combat]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset['combat'] as CombatAction | undefined
      if (!action || !options) return
      options.onAction(action)
      render()
    })
  })
}

export function openCombatScreen(screenOptions: CombatScreenOptions): void {
  options = screenOptions

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'combat-overlay'
  document.body.append(overlay)

  render()
}
