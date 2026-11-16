/**
 * Стадии деревни (7.5).
 *
 * Стадия — это эпоха: требования на входе, новое имя и облик.
 * Пока описаны две: стартовая и первая, куда игрок ведёт деревню.
 */

export interface StageRequirement {
  itemId: string
  count: number
}

export interface StageDef {
  id: string
  name: string
  population: number
  /** Что нужно сдать на склад, чтобы созвать деревню. */
  requirements: readonly StageRequirement[]
  /** Сцена перехода; пустая строка — перехода нет. */
  ceremonyScene: string
  journalOnEnter: string
}

export const STAGES: readonly StageDef[] = [
  {
    id: 'stage_dying',
    name: 'Последний очаг',
    population: 20,
    requirements: [],
    ceremonyScene: 'first_smoke',
    journalOnEnter: '',
  },
  {
    id: 'stage_first_smoke',
    name: 'Первый дым',
    population: 25,
    requirements: [
      { itemId: 'branch', count: 6 },
      { itemId: 'log', count: 6 },
      { itemId: 'plank', count: 2 },
      { itemId: 'stone', count: 4 },
    ],
    ceremonyScene: '',
    journalOnEnter: 'Первый дым над деревней. Двадцать пять душ, новый частокол и зима, которую можно пережить.',
  },
]

export function stageById(id: string): StageDef | undefined {
  return STAGES.find((stage) => stage.id === id)
}

export function nextStage(id: string): StageDef | undefined {
  const index = STAGES.findIndex((stage) => stage.id === id)
  if (index < 0) return undefined
  return STAGES[index + 1]
}
