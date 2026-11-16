/**
 * Экран деревни (7.5, 4.3.8).
 *
 * Что нужно для перехода на следующую стадию, сколько уже сдано на склад
 * и кнопка «созвать деревню», когда всё готово.
 */

import { escapeHtml } from './html'

export interface VillageRequirement {
  label: string
  have: number
  need: number
}

export interface VillageScreenOptions {
  getStageName: () => string
  getNextStageName: () => string | null
  getRequirements: () => readonly VillageRequirement[]
  getDailyNeed: () => string
  onDeposit: () => string
  onCeremony: () => void
  onClose: () => void
}

let overlay: HTMLDivElement | null = null
let options: VillageScreenOptions | null = null
let status = ''

export function closeVillageScreen(): void {
  overlay?.remove()
  overlay = null
  options = null
}

function render(): void {
  if (!overlay || !options) return

  const stageName = options.getStageName()
  const nextStageName = options.getNextStageName()
  const requirements = options.getRequirements()
  const ready = requirements.length > 0 && requirements.every((row) => row.have >= row.need)

  overlay.innerHTML = `
    <div class="screen village" role="dialog" aria-modal="true" aria-label="Деревня">
      <header class="screen__head">
        <h2 class="screen__title">${escapeHtml(stageName)}</h2>
        <button class="screen__close" data-action="close" aria-label="Закрыть">×</button>
      </header>

      <div class="village__body">
        <p class="village__daily">${escapeHtml(options.getDailyNeed())}</p>
        ${
          nextStageName
            ? `<p class="village__next">Следующая стадия — <strong>${escapeHtml(nextStageName)}</strong>. Для неё нужно сдать на склад:</p>
               <ul class="village__list">
                 ${requirements
                   .map(
                     (row) => `
                   <li class="village__row ${row.have >= row.need ? 'village__row--done' : ''}">
                     <span>${escapeHtml(row.label)}</span>
                     <span class="village__count">${row.have} / ${row.need}</span>
                   </li>`,
                   )
                   .join('')}
               </ul>`
            : '<p class="village__next">Деревня дошла до конца, который записан в этих хрониках.</p>'
        }
      </div>

      <footer class="village__foot">
        <button data-village="deposit">Сдать, что есть</button>
        <button data-village="ceremony" ${ready ? '' : 'disabled'}>Созвать деревню</button>
      </footer>

      <p class="screen__status">${escapeHtml(status)}</p>
    </div>
  `

  overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    options?.onClose()
    closeVillageScreen()
  })

  overlay.querySelector('[data-village="deposit"]')?.addEventListener('click', () => {
    if (!options) return
    status = options.onDeposit()
    render()
  })

  overlay.querySelector('[data-village="ceremony"]')?.addEventListener('click', () => {
    options?.onCeremony()
  })
}

export function openVillageScreen(screenOptions: VillageScreenOptions): void {
  options = screenOptions
  status = ''

  overlay?.remove()
  overlay = document.createElement('div')
  overlay.className = 'overlay'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeVillageScreen()
  })

  document.body.append(overlay)
  render()
}
