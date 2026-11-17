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
  /** Какие постройки должны стоять к обряду. */
  structures?: readonly string[]
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
    ceremonyScene: 'trade_road',
    journalOnEnter: '',
  },
  {
    id: 'stage_trade_road',
    name: 'Торговый путь',
    population: 40,
    requirements: [
      { itemId: 'wolf_fang', count: 1 },
      { itemId: 'ore', count: 6 },
      { itemId: 'plank', count: 6 },
    ],
    ceremonyScene: 'stone_belt',
    journalOnEnter: '',
  },
  {
    id: 'stage_stone_belt',
    name: 'Каменный пояс',
    population: 250,
    requirements: [
      { itemId: 'bandit_seal', count: 1 },
      { itemId: 'stone', count: 20 },
      { itemId: 'plank', count: 10 },
      { itemId: 'ore', count: 10 },
    ],
    ceremonyScene: 'free_town',
    journalOnEnter: '',
  },
  {
    id: 'stage_free_town',
    name: 'Вольный посад',
    population: 600,
    requirements: [
      { itemId: 'steel', count: 2 },
      { itemId: 'stone', count: 60 },
      { itemId: 'plank', count: 40 },
      { itemId: 'ore', count: 20 },
    ],
    structures: ['bank', 'academy'],
    ceremonyScene: 'white_city',
    journalOnEnter: '',
  },
  {
    id: 'stage_white_city',
    name: 'Белый город',
    population: 1200,
    requirements: [
      { itemId: 'steel', count: 6 },
      { itemId: 'stone', count: 120 },
      { itemId: 'plank', count: 60 },
      { itemId: 'ore', count: 40 },
    ],
    structures: ['court', 'guild'],
    ceremonyScene: 'capital',
    journalOnEnter: '',
  },
  {
    id: 'stage_capital',
    name: 'Стольный град',
    population: 2400,
    requirements: [
      { itemId: 'steel', count: 10 },
      { itemId: 'stone', count: 200 },
      { itemId: 'plank', count: 120 },
      { itemId: 'ore', count: 60 },
    ],
    structures: ['market', 'tower', 'bank'],
    ceremonyScene: '',
    journalOnEnter: '',
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
