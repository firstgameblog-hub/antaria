import './styles.css'
import { createInitialState, SPAWN_POINT, type GameState } from './core/state'
import { createCombat, resolveTurn, type CombatState } from './core/combat'
import { WOLF, DEER, BANDIT_LEADER, ENEMIES, WILD_ENCOUNTERS, CITY_SOLDIER, SIEGE_CAPTAIN, NORTHERN_WARLORD } from './content/enemies'
import { BOSS_SPOTS } from './content/bosses'
import { openRaidScreen } from './ui/raidScreen'
import type { CombatAction, EnemyDef } from './data/combat'
import { HUNT_SPOTS, type HuntSpot } from './content/hunting'
import { THREADS, threadById, type ThreadDef } from './content/threads'
import { openRequestScreen, closeRequestScreen } from './ui/requestScreen'
import { openVillageScreen, closeVillageScreen } from './ui/villageScreen'
import { nextStage, stageById, STAGES } from './content/stages'
import { STRUCTURES, structureById } from './content/buildings'
import type { StructureDef } from './data/buildings'
import { openBuildScreen, closeBuildScreen } from './ui/buildScreen'
import { canCraft, craftRecipe } from './core/crafting'
import { addItems, countOf, equip, removeItems, transfer, weightOf } from './core/inventory'
import { describeRestore, dormantReason, fishingIsGood, fishingYield, isReady, markGathered, minutesUntilReady, seasonalYield } from './core/gathering'
import { distance, facingOf, findFreeSpot, movePlayer, stepToward, type Facing, type Point } from './core/movement'
import { AUTO_SLOT, readBackup, readSlot, writeSlot } from './core/storage'
import {
  ACTION_MINUTES,
  DAYS_PER_YEAR,
  MINUTES_PER_DAY,
  absoluteMinutes,
  addMinutes,
  isWorkingHours,
  nextMorning,
  seasonOf,
} from './core/time'
import { applyDailyUpkeep, dailyNeeds } from './core/upkeep'
import type { GatheringNodeDef, NodeKind } from './data/gathering'
import { GATHERING_NODES } from './content/gathering'
import { ITEM_BY_ID, itemDef, itemName } from './content/items'
import { recipeById } from './content/recipes'
import { TRADER, TRADER_CAPITAL } from './content/trader'
import { CARAVAN } from './content/caravan'
import { openDiplomacyScreen } from './ui/diplomacyScreen'
import { sceneById } from './content/story'
import { scheduleOf } from './content/villagers'
import { positionAt } from './core/schedule'
import type { StoryBeat, StoryScene } from './data/story'
import { buy, completeOrder, sell } from './core/trade'
import { Camera } from './render/camera'
import {
  OBSTACLES,
  PLAYER_RADIUS,
  TILE,
  VILLAGE_BOUNDS,
  VILLAGE_WALKABLE,
  WORLD,
  WORLD_WALKABLE,
  buildObstacles,
  drawVillage,
} from './render/scene'
import { createHud } from './ui/hud'
import { openSaveScreen } from './ui/saveScreen'
import { openCraftScreen } from './ui/craftScreen'
import { openTradeScreen } from './ui/tradeScreen'
import { openStoryScreen } from './ui/storyScreen'
import { openThought } from './ui/thought'
import { openJournalScreen } from './ui/journalScreen'
import { openCombatScreen } from './ui/combatScreen'
import { audio } from './audio/engine'
import { ambience } from './audio/ambience'
import { playCoin, playCraft, playKnock, playRustle, playStep } from './audio/sfx'
import { stageLabel } from './ui/labels'
import { START_VILLAGE } from './content/scene'

const PLAYER_SPEED = 135
const NODE_HOVER_RADIUS = 22
const INTERACT_RANGE = 46

/** Центр костра: от него считается слышимость огня. */
const campfireBuilding = START_VILLAGE.find((building) => building.kind === 'campfire')
const CAMPFIRE_POINT: Point = campfireBuilding
  ? {
      x: (campfireBuilding.x + campfireBuilding.w / 2) * TILE,
      y: (campfireBuilding.y + campfireBuilding.h / 2) * TILE,
    }
  : { x: 0, y: 0 }

/** Сколько длится сам сбор. Секунды реального времени — это усилие, а не ожидание. */
const GATHER_SECONDS: Record<NodeKind, number> = {
  herb: 1.2,
  berry: 1.6,
  branch: 1.8,
  stone: 2.6,
  log: 3.2,
  ore: 3.6,
  clay: 2.4,
  fish: 4,
}

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('Не найден корневой элемент #app')
const app: HTMLDivElement = root

const canvas = document.createElement('canvas')
canvas.className = 'scene'
app.append(canvas)

const ctxRaw = canvas.getContext('2d')
if (!ctxRaw) throw new Error('Браузер не умеет рисовать на Canvas')
const ctx: CanvasRenderingContext2D = ctxRaw

const camera = new Camera(WORLD, VILLAGE_BOUNDS)

const hud = createHud({
  onSleep: () => sleep(),
  onSaves: () => openSaves(),
  onCraft: () => openCraft(),
  onJournal: () => openJournal(),
  onSound: () => toggleSound(),
  onVillage: () => openVillage(),
})
app.append(hud.element)

let state: GameState
let statusNote = ''
let actionNote: { text: string; until: number } | null = null
let nightNote: { text: string; until: number } | null = null
let showGrid = true
let hoveredId: string | null = null
let hoveredNodeId: string | null = null
let hoveredNpcId: string | null = null
let hoveredSpotId: string | null = null
let hoveredPlotId: string | null = null
let pendingNodeId: string | null = null
let pendingNpcId: string | null = null
let pixelRatio = 1
let moveTarget: Point | null = null
let followPaused = false
let previousFrameTime = 0
let gathering: { nodeId: string; elapsed: number; duration: number } | null = null
let gatherSoundTimer = 0
let stepDistance = 0
let storyOpen = false
let audioGreeted = false
let lastFireDistance = -1
let combat: CombatState | null = null
let combatContext: 'wild' | 'raid' | 'boss' | 'siege' = 'wild'
let raidPending = false
let raidResolved = false
let siegePending = false
let pendingSeasonScene: string | null = null
let danger = 0
let pendingAmbush = false
const dayStats = { gathered: 0, crafted: 0, traded: 0, built: 0, fought: 0 }

/** Светлое время: без него ни собирать, ни строить, ни торговать. */
function daylightOk(): boolean {
  if (isWorkingHours(state.clock)) return true
  flash('Стемнело. До утра ничего не сделать — ложись спать.')
  return false
}
let obstacles: ReturnType<typeof buildObstacles> = buildObstacles([])

function refreshObstacles(): void {
  obstacles = buildObstacles(state.world.buildings, gateOpen())
}

const pressed = new Set<string>()

function loadState(): GameState {
  const read = readSlot(AUTO_SLOT)
  if (read.status === 'ok') return read.state

  if (read.status === 'corrupt') {
    const backup = readBackup(AUTO_SLOT)
    if (backup.status === 'ok') {
      statusNote = `Основное сохранение не читается: ${read.reason}. Мир восстановлен из резервной копии.`
      return backup.state
    }
    statusNote = `Сохранение не читается: ${read.reason}. Начата новая игра.`
  }

  return createInitialState()
}

/** Ворота открыты: с «Первого дыма» можно выйти за частокол. */
function gateOpen(): boolean {
  return state.flags['gate.open'] === true
}

/** Где можно ходить: внутри частокола или, с открытыми воротами, по всей сцене. */
function walkableBounds(): { x: number; y: number; w: number; h: number } {
  return gateOpen() ? WORLD_WALKABLE : VILLAGE_WALKABLE
}

/** Страховка: герой не должен оказаться внутри постройки или за частоколом. */
function ensureFreePosition(): void {
  const position = state.player.position
  const free = findFreeSpot(position, PLAYER_RADIUS, OBSTACLES, walkableBounds(), position)
  if (free.x !== position.x || free.y !== position.y) {
    state.player.position = free
  }
}

function updateHud(): void {
  const inventory = state.player.inventory
  const weight = Math.round(weightOf(inventory, ITEM_BY_ID) * 10) / 10

  hud.update({
    clock: state.clock,
    stage: stageLabel(state.village.stageId),
    population: state.village.population,
    notes: [
      statusNote,
      actionNote?.text ?? '',
      nightNote?.text ?? '',
    ],
    resources: [
      { label: 'Монеты', value: state.player.money },
      ...inventory.stacks.map((stack) => ({
        label: itemName(stack.id),
        value: stack.count,
      })),
    ],
    statuses: [
      { label: 'Здоровье', value: state.player.health.current, max: state.player.health.max },
      { label: 'Груз', value: weight, max: inventory.capacityKg },
    ],
  })
}

/** Короткое сообщение о действии: висит пару секунд и убирается само. */
function flash(text: string, ms = 3500): void {
  actionNote = { text, until: performance.now() + ms }
  updateHud()
}

/** Двигает время и закрывает прошедшие ночи: деревня ест и жжёт дрова. */
function advanceTime(minutes: number): void {
  if (minutes <= 0) return

  const before = absoluteMinutes(state.clock)
  state.clock = addMinutes(state.clock, minutes).clock
  const after = absoluteMinutes(state.clock)

  const firstNight = Math.floor(before / MINUTES_PER_DAY)
  const lastNight = Math.floor(after / MINUTES_PER_DAY)

  for (let night = firstNight; night < lastNight; night += 1) {
    processNight(night)
  }
}

function processNight(absoluteDayIndex: number): void {
  const dayOfYear = (absoluteDayIndex % DAYS_PER_YEAR) + 1
  const season = seasonOf(dayOfYear)

  // Поля кормят деревню: без этого всё держалось бы на руках игрока.
  const fieldYield = season === 'winter' ? 0 : season === 'autumn' ? 1 : 2
  const fields = START_VILLAGE.filter((building) => building.kind === 'field').length
  const harvest = fieldYield * fields
  const grain = itemDef('grain')
  if (harvest > 0 && grain) addItems(state.village.storage, grain, harvest, 1, ITEM_BY_ID)

  // Первая зима отмечается по календарю, а не по прошедшей ночи.
  if (season === 'winter' && state.flags['chapter.first_winter'] !== true) {
    state.flags['chapter.first_winter'] = true
    pendingSeasonScene = 'first_winter'
  }

  const result = applyDailyUpkeep(state.village.storage, state.village.population, season)

  if (result.lost > 0) {
    state.village.population = Math.max(1, state.village.population - result.lost)
    addJournal(
      result.winter
        ? 'Зимняя ночь была голодной. Несколько человек ушли, не дождавшись утра.'
        : 'Ночью не хватило еды. Кто-то собрал узел и ушёл.',
    )
    flash('Деревня потеряла людей: не хватило еды или дров.', 6000)
  }

  morningEvent()

  // Глава, отложенная до утра: рынок после посада, стража после града.
  const nextChapter = state.flags['chapter.next']
  if (typeof nextChapter === 'string' && nextChapter !== '') {
    state.flags['chapter.next'] = ''
    pendingSeasonScene = nextChapter
  }

  // Просьбы не ждут вечно: не помог — человек справляется сам, как может.
  for (const thread of THREADS) {
    if (thread.requiresStage !== undefined && !stageAtLeast(thread.requiresStage)) continue
    if (state.flags[`${thread.id}.done`] === true) continue
    if (state.flags[`${thread.id}.refused`] === true) continue
    if (state.flags[`${thread.id}.failed`] === true) continue

    const since = state.flags[`${thread.id}.since`]
    if (typeof since !== 'number') {
      state.flags[`${thread.id}.since`] = absoluteDayIndex
      continue
    }

    if (absoluteDayIndex - since < (thread.patienceDays ?? 4)) continue

    state.flags[`${thread.id}.failed`] = true
    state.village.population = Math.max(1, state.village.population - 1)
    addJournal(thread.failText ?? 'Просьба осталась без ответа. Кто-то собрал узел и ушёл.')
  }

  // Нанятая охрана служит три ночи и уходит.
  const guard = state.flags['guard.days']
  if (typeof guard === 'number' && guard > 0) {
    const left = guard - 1
    state.flags['guard.days'] = left
    if (left === 0) {
      addJournal('Охрана из гильдии ушла: три дня вышли. У ворот снова только я.')
    }
  }

  if (state.flags['raid.done'] !== true) {
    const due = state.flags['raid.due_day']
    if (typeof due === 'number' && absoluteDayIndex >= due) raidPending = true
  }

  // Осада приходит в Белый город: одна ночь, три волны.
  if (state.flags['siege.done'] !== true && siegeWave() === 0 && !siegeIsFinale()) {
    const siegeDue = state.flags['siege.due_day']
    if (typeof siegeDue === 'number' && absoluteDayIndex >= siegeDue) siegePending = true
  }

  // Последняя осада приходит в Стольный град.
  if (state.flags['finale.done'] !== true && !siegeIsFinale()) {
    const finaleDue = state.flags['finale.due_day']
    if (typeof finaleDue === 'number' && absoluteDayIndex >= finaleDue) {
      state.flags['siege.kind'] = 'finale'
      state.flags['siege.done'] = false
      state.flags['siege.wave'] = 0
      siegePending = true
    }
  }
}

/** Утреннее событие: деревня не молчит, даже если игрок ничего не делает. */
function morningEvent(): void {
  const storage = state.village.storage
  const food =
    countOf(storage, 'berry') +
    countOf(storage, 'meat') +
    countOf(storage, 'broth') +
    countOf(storage, 'fish') +
    countOf(storage, 'bread')

  if (food === 0) {
    addJournal('Утро началось с пустого склада. Деревня молчит и ждёт еды.')
    flash('С утра на складе пусто. Люди ждут еды.', 6000)
    return
  }

  const roll = Math.random()

  if (roll < 0.35) {
    const berries = itemDef('berry')
    if (berries) addItems(storage, berries, 3, 1, ITEM_BY_ID)
    addJournal('Кто-то оставил у ворот корзину ягод. Не сказал кто.')
    return
  }

  if (roll < 0.6 && food > 4) {
    const berries = itemDef('berry')
    if (berries) removeItems(storage, 'berry', Math.min(3, countOf(storage, 'berry')))
    addJournal('Ночью подмокла часть припасов. Половину пришлось выбросить.')
  }
}

/** Ночь (3.2.6). Время идёт вперёд, утром — сводка. Следы в деревне появятся с 7.16. */
function sleep(): void {
  const before = absoluteMinutes(state.clock)
  const step = nextMorning(state.clock)
  const after = absoluteMinutes(step.clock)

  advanceTime(after - before)

  if (seasonOf(state.clock.day) === 'winter' && state.flags['chapter.first_winter'] !== true) {
    state.flags['chapter.first_winter'] = true
    pendingSeasonScene = 'first_winter'
  }

  // Ночь лечит: без этого здоровье копилось бы до первой смерти.
  state.player.health.current = state.player.health.max

  danger = 0
  pendingAmbush = false

  const summary = [
    dayStats.gathered > 0 ? `собрано ${dayStats.gathered}` : '',
    dayStats.crafted > 0 ? `сделано ${dayStats.crafted}` : '',
    dayStats.traded > 0 ? `сделок ${dayStats.traded}` : '',
    dayStats.built > 0 ? `построено ${dayStats.built}` : '',
    dayStats.fought > 0 ? `боёв ${dayStats.fought}` : '',
  ]
    .filter((part) => part !== '')
    .join(', ')

  dayStats.gathered = 0
  dayStats.crafted = 0
  dayStats.traded = 0
  dayStats.built = 0
  dayStats.fought = 0

  nightNote = {
    text: summary === '' ? 'День прошёл без дел.' : `День закончен: ${summary}.`,
    until: performance.now() + 5500,
  }
  persist()
  updateHud()

  if (raidPending) {
    raidPending = false
    startRaid()
  }

  if (siegePending) {
    siegePending = false
    openSiegeWave()
  }

  if (pendingSeasonScene !== null) {
    const sceneId = pendingSeasonScene
    pendingSeasonScene = null
    startStory(sceneId)
  }
}

function persist(): void {
  state.savedAt = Date.now()
  const result = writeSlot(AUTO_SLOT, state)
  if (!result.ok) {
    statusNote = `Автосохранение не удалось: ${result.reason}`
    updateHud()
  }
}

const PLAYER_MIN_DAMAGE = 3
const PLAYER_MAX_DAMAGE = 6

function playerCombatStats(): { maxHp: number; minDamage: number; maxDamage: number } {
  // Академия учит бить: не сильнее, а точнее — прибавка к верхней границе урона.
  const learned = structureReady('academy') ? 1 : 0

  // Оружие в руке прибавляет к удару столько, сколько записано в предмете.
  const weaponId = state.player.equipment.weapon
  const weapon = weaponId ? itemDef(weaponId) : undefined
  const power = weapon?.power ?? 0

  return {
    maxHp: state.player.health.max,
    minDamage: PLAYER_MIN_DAMAGE + power,
    maxDamage: PLAYER_MAX_DAMAGE + learned + power,
  }
}

function beginCombat(
  enemy: EnemyDef,
  options: { playerFirst?: boolean; enemyHpPenalty?: number; extraLog?: string[] } = {},
  context: 'wild' | 'raid' | 'boss' | 'siege' = 'wild',
): void {
  if (combat) return

  combatContext = context
  dayStats.fought += 1
  combat = createCombat(enemy, state.player.health.current, playerCombatStats(), options)

  if (options.enemyHpPenalty !== undefined) {
    combat.enemyHp = Math.max(1, combat.enemyHp - options.enemyHpPenalty)
  }
  if (options.extraLog) combat.log.push(...options.extraLog)
  ambience.setDucked(true)

  openCombatScreen({
    getState: () => combat,
    onAction: (action: CombatAction) => {
      if (!combat) return
      resolveTurn(combat, action, playerCombatStats())
      state.player.health.current = Math.max(0, combat.playerHp)

      // Бой тоже занимает время: ход — пять минут.
      advanceTime(ACTION_MINUTES.fight)
      updateHud()
    },
    onFinish: () => finishCombat(),
  })
}

function startAmbush(): void {
  beginCombat(WOLF)
}

function pickEncounter(): typeof WOLF {
  const total = WILD_ENCOUNTERS.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * total

  for (const entry of WILD_ENCOUNTERS) {
    roll -= entry.weight
    if (roll <= 0) return entry.enemy
  }

  return WILD_ENCOUNTERS[0]?.enemy ?? WOLF
}

/** Заметность и встреча (6.7–6.9, 8.10): чем больше шумишь, тем вероятнее гость. */
function tryAmbush(): void {
  if (pendingAmbush) {
    pendingAmbush = false
    danger = 0
    beginCombat(pickEncounter())
    return
  }

  const fromCenter = distance(state.player.position, CAMPFIRE_POINT)
  danger = Math.min(100, danger + (fromCenter > 320 ? 16 : 10))

  const chance = Math.min(0.5, danger / 200 + (fromCenter > 320 ? 0.05 : 0))
  if (Math.random() >= chance) return

  pendingAmbush = true
  flash('В кустах стало тихо. Слишком тихо. Ещё один сбор — и кто-то выйдет.', 6000)
}

function startHunt(spot: HuntSpot): void {
  if (!daylightOk()) return

  const now = absoluteMinutes(state.clock)

  if (!isReady(state.world.nodes, spot.id, now)) {
    flash(`${spot.label}: ${describeRestore(minutesUntilReady(state.world.nodes, spot.id, now))}.`)
    return
  }

  markGathered(state.world.nodes, spot.id, now, spot.restoreMinutes)
  persist()
  beginCombat(DEER, { playerFirst: true })
}

function finishCombat(): void {
  const result = combat
  const context = combatContext
  combat = null
  combatContext = 'wild'
  danger = 0
  pendingAmbush = false
  ambience.setDucked(storyOpen)

  if (result) {
    if (result.outcome === 'victory') {
      for (const loot of result.enemy.loot ?? []) {
        if (loot.chance !== undefined && Math.random() > loot.chance) continue
        const def = itemDef(loot.itemId)
        if (def) addItems(state.player.inventory, def, loot.count, 1, ITEM_BY_ID)
      }

      state.player.health.current = Math.max(1, result.playerHp)

      // Зимой мех гуще: со зверя снимают лишнюю шкуру.
      if (context === 'wild' && seasonOf(state.clock.day) === 'winter') {
        const hide = itemDef('hide')
        if (hide) addItems(state.player.inventory, hide, 1, 1, ITEM_BY_ID)
      }

      addJournal(
        result.enemy.id === 'roe_deer'
          ? 'Вышел по следам на поляну и взял косулю. Мясо будет.'
          : result.enemy.id === 'bandit_leader'
            ? 'Налёт отбит. Главарь остался у ворот, остальные ушли в темноту.'
            : 'Волк на тропе у хвороста. Я остался стоять, он — нет.',
      )
    }

    if (result.outcome === 'escaped') {
      state.player.health.current = Math.max(1, result.playerHp)
      addJournal('Зверь ушёл. Следы остались, но добычи нет.')
    }

    if (result.outcome === 'defeat') {
      state.player.health.current = 10
      state.player.position = { ...SPAWN_POINT }
      camera.centerOn(state.player.position.x, state.player.position.y)
      addJournal('Меня оттащили к костру. Кто-то видел и не стал дожидаться.')
    }

    // Налёт: поражение и бегство стоят деревне дорого.
    if (context === 'raid') {
      raidResolved = true

      if (result.outcome === 'victory') {
        state.flags['raid.done'] = true
        flash('Налёт отбит. Деревня стоит.', 6000)
      } else if (result.outcome === 'defeat') {
        const stolen = loseSupplies(hasStoneWall() ? 0.3 : 0.4)
        const broken = damageBuilding()
        state.village.population = Math.max(1, state.village.population - 3)
        state.flags['raid.done'] = true
        addJournal(
          `Налётчики ворвались в деревню. Унесли ${stolen} припасов, трое ушли навсегда.${broken ? ` Разбит ${broken.toLowerCase()}.` : ''}`,
        )
        flash(`Налёт: −${stolen} припасов, люди ушли${broken ? `, разбит ${broken.toLowerCase()}` : ''}.`, 7000)
      } else {
        const stolen = loseSupplies(hasStoneWall() ? 0.2 : 0.4)
        const broken = damageBuilding()
        state.village.population = Math.max(1, state.village.population - 1)
        state.flags['raid.done'] = true
        addJournal(
          `Ты ушёл с ворот. Налётчики взяли ${stolen} припасов и одного человека.${broken ? ` Разбит ${broken.toLowerCase()}.` : ''}`,
        )
        flash(`Налёт: −${stolen} припасов, кто-то ушёл${broken ? `, разбит ${broken.toLowerCase()}` : ''}.`, 7000)
      }
    }

    if (context === 'siege') {
      if (result.outcome === 'victory') {
        flash(`Волна ${siegeWave()} отбита.`, 5000)
      } else {
        const stolen = loseSupplies(0.25)
        const broken = damageBuilding()
        state.village.population = Math.max(1, state.village.population - 2)
        addJournal(
          `Волна ${siegeWave()} прошла по улице. Унесли ${stolen} припасов, двое не вернулись со стены.${broken ? ` Разбит ${broken.toLowerCase()}.` : ''}`,
        )
        flash(`Волна ${siegeWave()}: −${stolen} припасов, со стены кто-то не вернулся.`, 7000)
      }

      if (siegeWave() >= 3) finishSiege()
      else openSiegeWave()
    }

    if (context === 'boss' && result.outcome === 'victory') {
      const boss = BOSS_SPOTS.find((candidate) => candidate.enemyId === result.enemy.id)
      if (boss) {
        state.flags[boss.flag] = true
        addJournal(boss.journal)
        flash('Логово опустело. Трофей твой.', 6000)
      }
    }
  }

  persist()
  updateHud()

  if (raidResolved) {
    raidResolved = false
    afterRaidScene()
  }
}

/** Есть ли каменная стена: с неё налётчикам труднее. */
function hasStoneWall(): boolean {
  const current = STAGES.findIndex((stage) => stage.id === state.village.stageId)
  const walled = STAGES.findIndex((stage) => stage.id === 'stage_stone_belt')
  return walled >= 0 && current >= walled
}

const GUARD_PRICE = 40
const GUARD_DAYS = 3

/** Сколько дней ещё нанят охранник. 0 — никого. */
function guardDays(): number {
  const value = state.flags['guard.days']
  return typeof value === 'number' ? Math.max(0, value) : 0
}

function structureReady(id: string): boolean {
  return state.world.buildings.includes(id) && !state.world.damaged.includes(id)
}

/** Рынок в деревне: Корней держит цену, а не берёт что дают. */
function marketBonus(): number {
  return structureReady('market') ? 0.12 : 0
}

/** Гильдия: дом, где берутся за работу за деньги. */
function openGuild(): void {
  if (!daylightOk()) {
    flash('Ночью гильдия закрыта. Стучать — только зря людей будить.')
    return
  }

  const days = guardDays()
  const beats: StoryBeat[] = [
    {
      id: 'board',
      text: 'В гильдии пахнет мокрой шерстью и железом. На доске — имена тех, кто берётся за работу. Имена короткие, как у людей, которые не любят рассказывать.',
    },
    {
      id: 'clerk',
      text: 'За столом сидит человек с разбитыми костяшками и считает на счётах не деньги, а дни.',
    },
  ]

  if (days > 0) {
    beats.push({
      id: 'busy',
      text: `Твой человек ещё нанят: ${days} дн. Он ночует у ворот и не просит есть.`,
    })
  } else if (state.player.money >= GUARD_PRICE) {
    beats.push({
      id: 'offer',
      text: `— Охрана. ${GUARD_PRICE} монет, три дня, — говорит он, не поднимая глаз. — Драться буду, если придётся. Кормить не надо.`,
      choices: [
        {
          id: 'hire',
          text: `Нанять за ${GUARD_PRICE} монет`,
          flag: 'guard.hired',
          value: '1',
          after:
            'Он забирает монеты, не пересчитывая. У двери ждёт человек в стёганой куртке — молча берёт копьё и идёт к воротам.',
          action: 'guild_hire',
        },
        {
          id: 'later',
          text: 'Позже',
          flag: 'guard.hired',
          value: '0',
          after: '— Как надумаешь, — говорит он. — Я тут до темноты.',
        },
      ],
    })
  } else {
    beats.push({
      id: 'poor',
      text: `— ${GUARD_PRICE} монет, — говорит он. Ты молчишь. Он кивает, будто и не ждал другого.`,
    })
  }

  openDynamicStory({ id: 'guild_hall', title: 'Гильдия', beats })
}

function hireGuard(): void {
  if (state.player.money < GUARD_PRICE) return
  if (guardDays() > 0) return

  state.player.money -= GUARD_PRICE
  state.flags['guard.days'] = GUARD_DAYS
  advanceTime(ACTION_MINUTES.talk)
  addJournal(
    'Нанял человека из гильдии. Он будет у ворот три дня. Я не спросил его имени — он не предложил.',
  )
  playCoin()
  flash('Охрана нанята на три дня. Ночью у ворот будет кто-то, кроме меня.', 6000)
}

const LOAN_AMOUNT = 150
const LOAN_DEBT = 173
const ENVOY_PRICE = 30
const ENVOY_COOLDOWN_DAYS = 7

function bankDebt(): number {
  const value = state.flags['bank.debt']
  return typeof value === 'number' ? Math.max(0, value) : 0
}

function openBank(): void {
  if (!daylightOk()) {
    flash('Банк закрыт. Ставни на ночь опускают даже здесь.')
    return
  }

  const debt = bankDebt()
  const beats: StoryBeat[] = [
    {
      id: 'window',
      text: 'В банке пахнет чернилами и пылью. За окном сидит человек, который считает чужие монеты быстрее, чем ты свои.',
    },
  ]

  if (debt > 0) {
    if (state.player.money >= debt) {
      beats.push({
        id: 'debt',
        text: `Он открывает книгу на нужной странице: — За тобой ${debt}. Можешь закрыть сейчас.`,
        choices: [
          {
            id: 'pay',
            text: `Отдать ${debt} монет`,
            flag: 'bank.paid',
            value: '1',
            after: 'Он проводит черту, промокает её и ставит точку. — Свободен.',
            action: 'bank_repay',
          },
          {
            id: 'later',
            text: 'Позже',
            flag: 'bank.paid',
            value: '0',
            after: '— Твоё дело, — говорит он. — Счёт не растёт. Пока.',
          },
        ],
      })
    } else {
      beats.push({
        id: 'debt',
        text: `Он смотрит в книгу, потом на тебя: — За тобой ${debt}. У тебя ${state.player.money}. Приходи, когда будет чем.`,
      })
    }
  } else {
    beats.push({
      id: 'offer',
      text: `— ${LOAN_AMOUNT} монет сейчас, — говорит он. — Вернёшь ${LOAN_DEBT}. Проценты не растут, растёт только моё терпение.`,
      choices: [
        {
          id: 'take',
          text: `Взять ${LOAN_AMOUNT} монет`,
          flag: 'bank.loan',
          value: '1',
          after:
            'Он отсчитывает монеты двумя стопками, будто нехотя. — Второй раз — только после расплаты.',
          action: 'bank_loan',
        },
        {
          id: 'later',
          text: 'Позже',
          flag: 'bank.loan',
          value: '0',
          after: '— Как знаешь, — говорит он и снова берётся за счёты.',
        },
      ],
    })
  }

  openDynamicStory({ id: 'bank_hall', title: 'Банк', beats })
}

function takeLoan(): void {
  if (bankDebt() > 0) return

  state.player.money += LOAN_AMOUNT
  state.flags['bank.debt'] = LOAN_DEBT
  advanceTime(ACTION_MINUTES.talk)
  addJournal(`Взял в банке ${LOAN_AMOUNT} монет. Долг — ${LOAN_DEBT}. Это первый раз, когда я должен не человеку.`)
  playCoin()
  flash(`Взято ${LOAN_AMOUNT} монет. Долг: ${LOAN_DEBT}.`, 6000)
}

function repayLoan(): void {
  const debt = bankDebt()
  if (debt === 0 || state.player.money < debt) return

  state.player.money -= debt
  state.flags['bank.debt'] = 0
  advanceTime(ACTION_MINUTES.talk)
  addJournal('Закрыл долг в банке. Книга стала на одну страницу легче.')
  playCoin()
  flash('Долг закрыт.', 5000)
}

/** Суд: споры и письма. Отсюда можно отправить посольство в Тихую Падь. */
function openCourt(): void {
  if (!daylightOk()) {
    flash('Суд закрыт. Скамья пуста, чернильница закрыта.')
    return
  }

  const today = Math.floor(absoluteMinutes(state.clock) / MINUTES_PER_DAY)
  const last = state.flags['court.envoy_day']
  const lastDay = typeof last === 'number' ? last : -100
  const canSend = state.player.money >= ENVOY_PRICE && today - lastDay >= ENVOY_COOLDOWN_DAYS

  const beats: StoryBeat[] = [
    {
      id: 'bench',
      text: 'В суде вместо приговоров — стол, две чернильницы и человек, который записывает всё, что скажут. Говорят здесь мало.',
    },
  ]

  if (canSend) {
    beats.push({
      id: 'envoy',
      text: `— В Тихую Падь можно отправить человека, — говорит писарь. — ${ENVOY_PRICE} монет на дорогу и подарок. Вернётся через седмицу.`,
      choices: [
        {
          id: 'send',
          text: `Отправить посольство (${ENVOY_PRICE} монет)`,
          flag: 'court.envoy',
          value: '1',
          after:
            'Писарь пишет письмо коротко, без единого лишнего слова. Ты ставишь печать — она чужая, но другой нет.',
          action: 'court_envoy',
        },
        {
          id: 'later',
          text: 'Позже',
          flag: 'court.envoy',
          value: '0',
          after: '— Письмо подождёт, — говорит он. — Люди — нет.',
        },
      ],
    })
  } else if (state.player.money < ENVOY_PRICE) {
    beats.push({
      id: 'poor',
      text: `— Посольство стоит ${ENVOY_PRICE} монет, — говорит писарь. — Даром такие письма не читают.`,
    })
  } else {
    beats.push({
      id: 'wait',
      text: '— Твой человек ещё в дороге. Второго вслед не посылают: там решат, что мы торопимся.',
    })
  }

  openDynamicStory({ id: 'court_hall', title: 'Суд', beats })
}

function sendEnvoy(): void {
  if (state.player.money < ENVOY_PRICE) return

  const today = Math.floor(absoluteMinutes(state.clock) / MINUTES_PER_DAY)
  const last = state.flags['court.envoy_day']
  if (typeof last === 'number' && today - last < ENVOY_COOLDOWN_DAYS) return

  state.player.money -= ENVOY_PRICE
  state.flags['court.envoy_day'] = today
  state.world.tihaya.attitude = Math.max(
    -100,
    Math.min(100, state.world.tihaya.attitude + 10),
  )
  advanceTime(ACTION_MINUTES.talk)
  addJournal(
    'Отправил посольство в Тихую Падь. Письмо короткое: мы здесь, мы стоим, мы помним, кто первый пришёл с миром.',
  )
  playCoin()
  flash('Посольство ушло в Тихую Падь. Отношения теплее.', 6000)
}

/** Одна из построек страдает от налёта. Возвращает имя, если что-то сломали. */
function damageBuilding(): string | null {
  const candidates = state.world.buildings.filter((id) => !state.world.damaged.includes(id))
  if (candidates.length === 0) return null

  const id = candidates[Math.floor(Math.random() * candidates.length)]
  if (!id) return null

  state.world.damaged.push(id)
  return structureById(id)?.name ?? id
}

/** Теряем часть припасов со склада. Возвращает, сколько унесли. */function loseSupplies(fraction: number): number {
  let lost = 0

  for (const stack of [...state.village.storage.stacks]) {
    const take = Math.floor(stack.count * fraction)
    if (take <= 0) continue
    removeItems(state.village.storage, stack.id, take)
    lost += take
  }

  return lost
}

function afterRaidScene(): void {
  if (state.flags['chapter.after_raid'] === true) return
  state.flags['chapter.after_raid'] = true
  startStory('after_raid')
}

function startRaid(): void {
  openRaidScreen({
    text: 'Ночью у ворот факелы. Пятеро, может, шестеро. Один стоит впереди и не прячет лица — значит, не боится, что его запомнят.',
    payCost: 20,
    canPay: state.player.money >= 20,
    onFight: () => {
      const towerReady = structureReady('tower')
      const guardReady = guardDays() > 0

      const logs: string[] = []
      let penalty = 0

      if (towerReady) {
        penalty += 6
        logs.push('Стража заметила их на дороге: первый удар был внезапным.')
      }
      if (guardReady) {
        penalty += 6
        logs.push('Нанятый человек встал рядом и ударил первым — главарю досталось.')
      }

      beginCombat(
        BANDIT_LEADER,
        penalty > 0 ? { enemyHpPenalty: penalty, extraLog: logs } : {},
        'raid',
      )
    },
    onPay: () => {
      state.player.money -= 20
      state.flags['raid.done'] = true
      addJournal('Откупился от налётчиков. Двадцать монет ушли в чужие руки.')
      flash('Налётчики ушли, забрав двадцать монет.', 6000)
      persist()
      updateHud()
      afterRaidScene()
    },
    onHide: () => {
      if (guardDays() > 0) {
        state.flags['raid.done'] = true
        addJournal(
          'Спрятались. Нанятый человек держал ворота, пока деревня уходила в лес. Он вернулся к утру — раненый, но живой.',
        )
        flash('Охрана прикрыла отход: припасы целы, люди целы.', 6000)
        persist()
        updateHud()
        afterRaidScene()
        return
      }

      const stolen = loseSupplies(hasStoneWall() ? 0.2 : 0.4)
      state.village.population = Math.max(1, state.village.population - 1)
      state.flags['raid.done'] = true
      addJournal(`Спрятались за частоколом. Унесли ${stolen} припасов и одного человека.`)
      flash(`Налётчики ушли с добычей: −${stolen} припасов, одного человека увели.`, 6000)
      persist()
      updateHud()
      afterRaidScene()
    },
  })
}

const SIEGE_WAVE_TEXT: Record<number, string> = {
  1: 'На дороге пыль. Первыми идут те, кто не жалеет ног: полсотни пеших с топорами и без знамён. Они останавливаются в поле и начинают ждать.',
  2: 'К утру их стало больше. Они не кричат и не жгут — просто стоят и ждут, пока мы устанем смотреть на них со стены.',
  3: 'К вечеру приезжает воевода. Он не торопится слезать с коня. За ним ведут тех, кто остался от первых двух волн.',
}

const FINALE_WAVE_TEXT: Record<number, string> = {
  1: 'Их больше, чем было под Белым городом. Первыми идут наёмные копья — те, кому платят за шаг вперёд. Они не ждут приказа.',
  2: 'К полудню приезжает воевода, но не тот. Этот даже не смотрит на наши стены — он смотрит на людей за ними.',
  3: 'Ближе к вечеру из-за спин выходит человек в простом плаще. Воевода Севера. Он идёт пешком, и его люди расходятся, чтобы дать ему дорогу.',
}

const SIEGE_PAY = 60

function siegeWave(): number {
  const value = state.flags['siege.wave']
  return typeof value === 'number' ? value : 0
}

function siegeIsFinale(): boolean {
  return state.flags['siege.kind'] === 'finale'
}

function siegeText(wave: number): string {
  return (siegeIsFinale() ? FINALE_WAVE_TEXT[wave] : SIEGE_WAVE_TEXT[wave]) ?? ''
}

function siegeEnemy(wave: number): EnemyDef {
  if (wave >= 3) return siegeIsFinale() ? NORTHERN_WARLORD : SIEGE_CAPTAIN
  if (wave === 2 && siegeIsFinale()) return SIEGE_CAPTAIN
  return CITY_SOLDIER
}

function nextSiegeWave(): void {
  if (siegeWave() >= 3) finishSiege()
  else openSiegeWave()
}

function openSiegeWave(): void {
  if (state.flags['siege.done'] === true) return

  const wave = siegeWave() + 1
  state.flags['siege.wave'] = wave
  const finale = siegeIsFinale()

  openRaidScreen({
    title: `${finale ? 'Последняя осада' : 'Осада'}. Волна ${wave} из 3`,
    text: siegeText(wave),
    payCost: SIEGE_PAY,
    canPay: state.player.money >= SIEGE_PAY,
    fightLabel: 'Выйти за ворота',
    payLabel: `Послать дары (${SIEGE_PAY} монет)`,
    hideLabel: 'Держать стены',
    onFight: () => {
      beginCombat(siegeEnemy(wave), {}, 'siege')
    },
    onPay: () => {
      state.player.money -= SIEGE_PAY
      advanceTime(ACTION_MINUTES.talk)
      addJournal(
        `Послал воеводе дары. ${SIEGE_PAY} монет — и волна ${wave} ушла, не начиная боя. Это не мир, но это ночь без крови.`,
      )
      flash('Дары приняты. Они отходят на ночь.', 6000)
      persist()
      updateHud()
      nextSiegeWave()
    },
    onHide: () => {
      const stone = Math.min(15, countOf(state.village.storage, 'stone'))
      if (stone > 0) removeItems(state.village.storage, 'stone', stone)
      state.village.population = Math.max(1, state.village.population - 2)
      addJournal(
        `Держали стены. Волна ${wave} ушла, но двое остались на стене навсегда. Камня ушло ${stone}.`,
      )
      flash(`Стены выстояли: −${stone} камня, на стене кого-то не досчитались.`, 6000)
      persist()
      updateHud()
      nextSiegeWave()
    },
  })
}

function finishSiege(): void {
  const finale = siegeIsFinale()

  state.flags['siege.done'] = true
  state.flags['siege.wave'] = 3

  const steel = itemDef('steel')
  if (steel) addItems(state.player.inventory, steel, finale ? 4 : 2, 1, ITEM_BY_ID)
  state.player.money += finale ? 200 : 80

  if (finale) {
    state.flags['finale.done'] = true
    addJournal(
      'Последняя осада кончилась. Воевода Севера ушёл сам — не потому, что не смог, а потому что увидел стену и людей на ней.',
    )
    flash('Последняя осада выдержана: +200 монет, +4 стали.', 8000)
    persist()
    updateHud()
    startStory('finale')
    return
  }

  addJournal(
    'Осада кончилась. Город не взял нас и ушёл. На стене остались зарубки — считать их не стали.',
  )
  flash('Осада выдержана: +80 монет, +2 стали.', 7000)
  persist()
  updateHud()
  startStory('siege_end')
}

/** Запись в дневник-хронику (9.4), без повторов. */function addJournal(text: string): void {
  if (state.journal.some((entry) => entry.text === text)) return
  state.journal.push({
    year: state.clock.year,
    day: state.clock.day,
    minutes: state.clock.minutes,
    text,
  })
}

function recordJournal(scene: StoryScene, beat: number): void {
  const text = scene.beats[beat]?.journal
  if (text) addJournal(text)
}

function openJournal(): void {
  openJournalScreen({
    getEntries: () => state.journal,
    getRequests: () => openRequests(),
  })
}

function repairCost(structure: StructureDef): { itemId: string; count: number }[] {
  return structure.cost.map((cost) => ({
    itemId: cost.itemId,
    count: Math.max(1, Math.ceil(cost.count / 2)),
  }))
}

function openVillage(): void {
  const current = stageById(state.village.stageId)
  if (!current) return

  const next = nextStage(state.village.stageId)

  openVillageScreen({
    getStageName: () => stageById(state.village.stageId)?.name ?? state.village.stageId,
    getNextStageName: () => nextStage(state.village.stageId)?.name ?? null,
    getRequirements: () => {
      const target = nextStage(state.village.stageId)
      const rows: { label: string; have: number; need: number }[] = []

      for (const requirement of target?.requirements ?? []) {
        rows.push({
          label: itemName(requirement.itemId),
          have: countOf(state.village.storage, requirement.itemId),
          need: requirement.count,
        })
      }

      for (const id of target?.structures ?? []) {
        const structure = structureById(id)
        rows.push({
          label: `Постройка: ${structure?.name ?? id}`,
          have: structureReady(id) ? 1 : 0,
          need: 1,
        })
      }

      return rows
    },
    getDamaged: () =>
      state.world.damaged.map((id) => {
        const structure = structureById(id)
        const cost = structure ? repairCost(structure) : []
        return {
          id,
          name: structure?.name ?? id,
          cost: cost.map((part) => `${part.count} × ${itemName(part.itemId)}`).join(', '),
        }
      }),
    onRepair: (id) => {
      const structure = structureById(id)
      if (!structure) return 'Такой постройки нет'

      const cost = repairCost(structure)
      const missing = cost.some(
        (part) => countOf(state.village.storage, part.itemId) < part.count,
      )
      if (missing) return 'На складе не хватает материалов'

      for (const part of cost) removeItems(state.village.storage, part.itemId, part.count)

      state.world.damaged = state.world.damaged.filter((candidate) => candidate !== id)
      addJournal(`${structure.name} снова в строю.`)
      persist()
      updateHud()
      return `${structure.name}: починено`
    },
    getDailyNeed: () => {      const season = seasonOf(state.clock.day)
      const needs = dailyNeeds(state.village.population, season)
      const winterNote = needs.winter ? ' Зима: расход двойной.' : ''
      const fields = START_VILLAGE.filter((building) => building.kind === 'field').length
      const yieldPerField = season === 'winter' ? 0 : season === 'autumn' ? 1 : 2
      const harvest = fields * yieldPerField
      const harvestNote =
        harvest > 0
          ? ` Поля дают ${harvest} зерна за ночь.`
          : ' Зимой поля не дают ничего.'
      return `В день деревня съедает ${needs.food} еды и сжигает ${needs.fuel} дров.${winterNote}${harvestNote}`
    },
    onDeposit: () => {
      if (!next) return 'Дальше некуда'

      let moved = 0

      for (const requirement of next.requirements) {
        const have = countOf(state.village.storage, requirement.itemId)
        const missing = requirement.count - have
        if (missing <= 0) continue

        moved += transfer(
          state.player.inventory,
          state.village.storage,
          requirement.itemId,
          missing,
          ITEM_BY_ID,
        )
      }

      if (moved === 0) return 'Сдавать нечего.'

      persist()
      updateHud()
      return `Сдано на склад: ${moved}`
    },
    onCeremony: () => startCeremony(),
    onClose: () => undefined,
  })
}

function startCeremony(): void {
  const current = stageById(state.village.stageId)
  const next = nextStage(state.village.stageId)
  if (!current || !next || current.ceremonyScene === '') return

  closeVillageScreen()

  startStory(current.ceremonyScene, 0, () => {
    state.village.stageId = next.id
    state.village.population = next.population

    if (next.journalOnEnter !== '') addJournal(next.journalOnEnter)

    // Через три ночи после подъёма деревни приходят за добычей.
    if (next.id === 'stage_first_smoke') {
      state.flags['raid.due_day'] = Math.floor(absoluteMinutes(state.clock) / MINUTES_PER_DAY) + 3

      // Ворота открываются: за частоколом появляются дорога, лес и обрыв.
      if (state.flags['gate.open'] !== true) {
        state.flags['gate.open'] = true
        refreshObstacles()
        addJournal(
          'Ворота открыли. За частоколом всё то же поле, но теперь по нему можно идти: к реке, к лесу, по дороге на юг.',
        )
      }
    }

    persist()
    updateHud()
    flash(`Деревня стала: ${next.name}`, 6000)

      // Сразу после первого дыма — гость у ворот: начало второй главы.
      if (next.id === 'stage_first_smoke' && state.flags['stranger.met'] !== true) {
        state.flags['stranger.met'] = true
        startStory('stranger')
      }

      // Главы внутри стадии приходят следующим утром, а не сразу за обрядом.
      if (next.id === 'stage_free_town' && state.flags['chapter.free_market'] !== true) {
        state.flags['chapter.next'] = 'free_market'
      }

      if (next.id === 'stage_capital' && state.flags['chapter.night_watch'] !== true) {
        state.flags['chapter.next'] = 'night_watch'
      }

    // Дорога ожила: первый караван приходит сразу после перехода.
    if (next.id === 'stage_trade_road' && state.flags['chapter.caravan'] !== true) {
      state.flags['chapter.caravan'] = true
      startStory('first_caravan')
    }

    // Стена поставлена: глава про людей за ней.
    if (next.id === 'stage_stone_belt' && state.flags['chapter.stone_walls'] !== true) {
      state.flags['chapter.stone_walls'] = true
      startStory('stone_walls')
    }

    // Белый город: через две ночи приходит осада.
    if (next.id === 'stage_white_city') {
      state.flags['siege.kind'] = 'city'
      state.flags['siege.due_day'] =
        Math.floor(absoluteMinutes(state.clock) / MINUTES_PER_DAY) + 2
      state.flags['siege.wave'] = 0
      state.flags['siege.done'] = false
    }

    // Стольный град: через две ночи приходит последняя осада.
    if (next.id === 'stage_capital') {
      state.flags['finale.due_day'] =
        Math.floor(absoluteMinutes(state.clock) / MINUTES_PER_DAY) + 2
    }

    // Если до Столицы дошли раньше срока — последняя осада всё равно придёт.
    if (next.id === 'stage_antaria' && typeof state.flags['finale.due_day'] !== 'number') {
      state.flags['finale.due_day'] =
        Math.floor(absoluteMinutes(state.clock) / MINUTES_PER_DAY) + 2
    }
  })
}

/** Открытые просьбы: видно, о чём люди просят прямо сейчас. */function openRequests(): string[] {
  const requests: string[] = []

  for (const thread of THREADS) {
    if (state.flags[`${thread.id}.done`] === true) continue
    if (state.flags[`${thread.id}.refused`] === true) continue
    if (state.flags[`${thread.id}.failed`] === true) continue
    if (thread.requiresStage !== undefined && !stageAtLeast(thread.requiresStage)) continue

    const list = thread.requirements
      .map((requirement) => `${itemName(requirement.itemId)} — ${requirement.count} шт.`)
      .join(', ')

    requests.push(`${thread.npcName} просит: ${list}`)
  }

  if (state.flags['trader.order.done'] !== true) {
    requests.push(
      `Корней просит ${TRADER.order.count} × ${itemName(TRADER.order.itemId)} за ${TRADER.order.reward} монет.`,
    )
  }

  return requests
}

/** Первое действие игрока включает звук: раньше браузер не разрешает. */
function ensureAudio(): void {
  if (!audio.ensure()) return
  ambience.start()
  // Если игрок ещё в сцене — окружение должно остаться приглушённым.
  ambience.setDucked(storyOpen)
  hud.setSoundEnabled(audio.isEnabled())

  // Один тихий звук при первом включении: так слышно, что звук вообще есть.
  if (!audioGreeted && audio.isEnabled()) {
    audioGreeted = true
    playRustle()
  }
}

function toggleSound(): void {
  ensureAudio()
  const next = !audio.isEnabled()
  audio.setEnabled(next)
  hud.setSoundEnabled(next)
  // Подтверждение: включаешь звук — сразу слышишь, что он есть.
  if (next) playCoin()
}

function startStory(sceneId: string, startBeat = 0, onComplete?: () => void): void {
  const scene = sceneById(sceneId)
  if (!scene) return

  openStoryScene(scene, sceneId, startBeat, onComplete, true)
}

/** Сцена, собранная на месте: не сохраняется, живёт один разговор. */
function openDynamicStory(scene: StoryScene, onComplete?: () => void): void {
  openStoryScene(scene, scene.id, 0, onComplete, false)
}

function openStoryScene(
  scene: StoryScene,
  sceneId: string,
  startBeat: number,
  onComplete: ((() => void) | undefined) | undefined,
  resumable: boolean,
): void {
  if (resumable) state.story = { sceneId, beat: startBeat }
  else state.story = null

  storyOpen = true
  ambience.setDucked(true)
  recordJournal(scene, startBeat)

  openStoryScreen({
    scene,
    startBeat,
    onBeat: (beat) => {
      if (state.story) state.story.beat = beat
      recordJournal(scene, beat)
      persist()
    },
    onChoice: (_beat, choice) => {
      state.flags[choice.flag] = choice.value
      if (choice.action === 'guild_hire') hireGuard()
      if (choice.action === 'bank_loan') takeLoan()
      if (choice.action === 'bank_repay') repayLoan()
      if (choice.action === 'court_envoy') sendEnvoy()
      persist()
      updateHud()
    },
    onFinish: () => {
      storyOpen = false
      state.story = null
      ambience.setDucked(false)

      if (sceneId === 'prologue') {
        state.flags['prologue.done'] = true
      }

      if (sceneId === 'morning') {
        state.flags['chapter1.morning.done'] = true
        flash('Марта ждёт веток. Все просьбы — в «Хронике» внизу.', 6000)

        // Первый раз на ногах: герой ещё ничего не понимает и говорит это себе.
        if (state.flags['thought.intro'] !== true) {
          state.flags['thought.intro'] = true
          openThought({
            text: 'Как странно…\nКажется, я нахожусь в теле сына этого старика.\nНо раз я в игре — значит, надо изучать её.\n\nЧто там старик сказал… Помочь Марте и найти Корнея… Кажется, так.',
            size: 'medium',
            onClose: () => persist(),
          })
        }
      }

      // Главы внутри стадий отмечаются, чтобы не приходить дважды.
      if (
        sceneId === 'free_market' ||
        sceneId === 'first_court' ||
        sceneId === 'night_watch'
      ) {
        state.flags[`chapter.${sceneId}`] = true
      }

      persist()
      updateHud()

      // Сразу после пролога — первое утро: старик объясняет, что делать.
      if (sceneId === 'prologue' && state.flags['chapter1.morning.done'] !== true) {
        startStory('morning')
      }

      onComplete?.()
    },
  })
}

function openCraft(): void {
  openCraftScreen({
    getInventory: () => state.player.inventory,
    canCraft: (recipeId) => {
      const recipe = recipeById(recipeId)
      return recipe ? canCraft(recipe, state.player.inventory, ITEM_BY_ID) : false
    },
    onCraft: (recipeId) => {
      if (!daylightOk()) return 'Стемнело. Ремесло — только днём.'

      const recipe = recipeById(recipeId)
      if (!recipe) return 'Такого рецепта нет'

      if (
        recipe.station === 'forge' &&
        (!state.world.buildings.includes('forge') || state.world.damaged.includes('forge'))
      ) {
        return state.world.damaged.includes('forge')
          ? 'Горн разбит. Сначала почини его в «Деревне».'
          : 'Для этого нужен горн. Построй его на участке.'
      }

      const result = craftRecipe(state, recipe, ITEM_BY_ID)
      if (!result.ok) return result.reason

      const madeDef = itemDef(recipe.output.itemId)
      if (madeDef?.slot !== undefined) {
        equip(state.player.equipment, madeDef)
      }

      if (state.flags['journal.firstCraft'] !== true) {
        state.flags['journal.firstCraft'] = true
        addJournal(
          `Первое, что я сделал здесь своими руками, — ${itemName(recipe.output.itemId).toLowerCase()}.`,
        )
      }

      playCraft()
      advanceTime(recipe.minutes)
      dayStats.crafted += 1
      persist()
      updateHud()
      return result.message
    },
  })
}

function openSaves(): void {
  openSaveScreen({
    getState: () => state,
    onLoad: (loaded) => {
      state = loaded
      ensureFreePosition()
      refreshObstacles()
      statusNote = ''
      actionNote = null
      nightNote = null
      moveTarget = null
      camera.centerOn(state.player.position.x, state.player.position.y)
      persist()
      updateHud()
    },
    onNewGame: () => {
      state = createInitialState()
      refreshObstacles()
      moveTarget = null
      pendingNodeId = null
      pendingNpcId = null
      combat = null
      statusNote = ''
      actionNote = null
      nightNote = null
      persist()
      updateHud()
      camera.centerOn(state.player.position.x, state.player.position.y)
      startStory('prologue')
    },
  })
}

function resize(): void {
  pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2)
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width === 0 || height === 0) return
  canvas.width = Math.max(1, Math.round(width * pixelRatio))
  canvas.height = Math.max(1, Math.round(height * pixelRatio))
  camera.resize(width, height)
}

// Надёжнее, чем событие window.resize: следит за размером самого холста.
const resizeObserver = new ResizeObserver(() => resize())
resizeObserver.observe(canvas)

function updateMovement(dt: number): boolean {
  if (dt <= 0) return false

  const position = state.player.position
  let delta: Point = { x: 0, y: 0 }

  let axisX = 0
  let axisY = 0
  if (pressed.has('a') || pressed.has('arrowleft') || pressed.has('ф')) axisX -= 1
  if (pressed.has('d') || pressed.has('arrowright') || pressed.has('в')) axisX += 1
  if (pressed.has('w') || pressed.has('arrowup') || pressed.has('ц')) axisY -= 1
  if (pressed.has('s') || pressed.has('arrowdown') || pressed.has('ы')) axisY += 1

  if (axisX !== 0 || axisY !== 0) {
    if (gathering !== null) gathering = null
    moveTarget = null
    pendingNodeId = null
    pendingNpcId = null
    const length = Math.hypot(axisX, axisY)
    delta = {
      x: (axisX / length) * PLAYER_SPEED * dt,
      y: (axisY / length) * PLAYER_SPEED * dt,
    }
  } else if (moveTarget) {
    const step = stepToward(position, moveTarget, PLAYER_SPEED * dt)
    delta = step.delta
    if (step.arrived) moveTarget = null
  }

  if (delta.x === 0 && delta.y === 0) return false

  const next = movePlayer(position, delta, PLAYER_RADIUS, obstacles, walkableBounds())

  if (next.x === position.x && next.y === position.y) {
    // Упёрлись в стену — цель больше не имеет смысла.
    moveTarget = null
    return false
  }

  state.player.facing = facingOf(
    { x: next.x - position.x, y: next.y - position.y },
    state.player.facing,
  )
  state.player.position = next

  stepDistance += Math.hypot(next.x - position.x, next.y - position.y)
  if (stepDistance >= 26) {
    stepDistance = 0
    playStep()
  }

  followPaused = false
  return true
}

function frame(time: number): void {
  const dt = previousFrameTime === 0 ? 0 : Math.min((time - previousFrameTime) / 1000, 0.05)
  previousFrameTime = time

  const wallNow = performance.now()
  let notesChanged = false

  if (actionNote && wallNow >= actionNote.until) {
    actionNote = null
    notesChanged = true
  }
  if (nightNote && wallNow >= nightNote.until) {
    nightNote = null
    notesChanged = true
  }
  if (notesChanged) updateHud()

  const walking = updateMovement(dt)
  updateNpcMotion(dt)

  if (pendingSeasonScene !== null && combat === null && !storyOpen) {
    const sceneId = pendingSeasonScene
    pendingSeasonScene = null
    startStory(sceneId)
  }

  // Костёр слышно только вблизи: громкость считается по расстоянию (4.4.3).
  const fireDistance = distance(state.player.position, CAMPFIRE_POINT)
  if (Math.abs(fireDistance - lastFireDistance) > 4) {
    lastFireDistance = fireDistance
    ambience.setFireDistance(fireDistance)
  }

  if (gathering !== null) {
    gathering.elapsed += dt

    gatherSoundTimer -= dt
    if (gatherSoundTimer <= 0) {
      gatherSoundTimer = 0.35 + Math.random() * 0.2
      const node = GATHERING_NODES.find((candidate) => candidate.id === gathering?.nodeId)
      if (node && (node.kind === 'stone' || node.kind === 'branch')) playKnock()
      else playRustle()
    }

    if (gathering.elapsed >= gathering.duration) finishGathering()
  }

  if (pendingNodeId !== null) {
    const node = GATHERING_NODES.find((candidate) => candidate.id === pendingNodeId)
    if (!node) {
      pendingNodeId = null
    } else if (distance(state.player.position, { x: node.x, y: node.y }) <= INTERACT_RANGE) {
      pendingNodeId = null
      moveTarget = null
      startGathering(node)
    }
  }

  if (pendingNpcId !== null) {
    const npc = activeNpcs().find((candidate) => candidate.id === pendingNpcId)
    if (!npc) {
      pendingNpcId = null
    } else if (distance(state.player.position, { x: npc.x, y: npc.y }) <= INTERACT_RANGE + 12) {
      pendingNpcId = null
      moveTarget = null
      openNpc(npc)
    }
  }

  if (!followPaused && dt > 0) {
    camera.focusOn(state.player.position.x, state.player.position.y, dt)
  }

  const width = canvas.width / pixelRatio
  const height = canvas.height / pixelRatio

  const now = absoluteMinutes(state.clock)
  const sceneNodes = availableNodes().map((node) => ({
    id: node.id,
    kind: node.kind,
    x: node.x,
    y: node.y,
    ready: isReady(state.world.nodes, node.id, now),
  }))

  const hoveredDef =
    hoveredNodeId === null
      ? undefined
      : GATHERING_NODES.find((node) => node.id === hoveredNodeId)

  const hoveredSpotDef =
    hoveredSpotId === null
      ? undefined
      : activeSpots().find((spot) => spot.id === hoveredSpotId)

  const hoveredPlotDef = hoveredPlotId === null ? undefined : structureById(hoveredPlotId)

  const sceneSpots = activeSpots().map((spot) => ({
    id: spot.id,
    x: spot.x,
    y: spot.y,
    kind: spot.kind,
    ready:
      spot.kind === 'lair' ? true : isReady(state.world.nodes, spot.id, now),
  }))

  // Подсветка того, что рядом можно тронуть: без значков, но заметно и на телефоне.
  const nearby = buildNearby()

  const hoveredLabel = hoveredDef
    ? { x: hoveredDef.x, y: hoveredDef.y, label: nodeLabel(hoveredDef, now) }
    : hoveredSpotDef
      ? {
          x: hoveredSpotDef.x,
          y: hoveredSpotDef.y,
          label: isReady(state.world.nodes, hoveredSpotDef.id, now)
            ? hoveredSpotDef.label
            : `${hoveredSpotDef.label} · ${describeRestore(minutesUntilReady(state.world.nodes, hoveredSpotDef.id, now))}`,
        }
      : hoveredNpcId !== null
        ? (() => {
            const npc = activeNpcs().find((candidate) => candidate.id === hoveredNpcId)
            if (!npc) return null
            const point = npcPoint(npc)
            return { x: point.x, y: point.y, label: npc.label }
          })()
        : hoveredPlotDef
          ? {
              x: (hoveredPlotDef.x + hoveredPlotDef.w / 2) * TILE,
              y: (hoveredPlotDef.y + hoveredPlotDef.h) * TILE,
              label: `${hoveredPlotDef.name} · участок`,
            }
          : null

  const activeGather = gathering
  const gatherNode = activeGather
    ? GATHERING_NODES.find((node) => node.id === activeGather.nodeId)
    : undefined
  const gatherProgress =
    activeGather && gatherNode
      ? {
          x: gatherNode.x,
          y: gatherNode.y,
          value: activeGather.elapsed / activeGather.duration,
        }
      : null

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.fillStyle = '#cdd0a4'
  ctx.fillRect(0, 0, width, height)

  ctx.translate(width / 2, height / 2)
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x, -camera.y)

  drawVillage(ctx, {
    time,
    showGrid,
    hoveredId,
    moveTarget,
    nodes: sceneNodes,
    npcs: activeNpcs().map((npc) => {
      const point = npcPoint(npc)
      return {
        id: npc.id,
        x: point.x,
        y: point.y,
        facing: npc.facing,
        kind: npc.kind,
        name: npc.name,
      }
    }),
    spots: sceneSpots,
    nearby,
    stageId: state.village.stageId,
    season: seasonOf(state.clock.day),
    zoom: camera.zoom,
    gateOpen: gateOpen(),
    buildings: state.world.buildings,
    drips: THREADS.filter(
      (thread) =>
        thread.drip !== undefined && state.flags[`${thread.id}.done`] !== true,
    ).map((thread) => ({ x: thread.drip?.x ?? 0, y: thread.drip?.y ?? 0 })),
    hoveredLabel,
    gatherProgress,
    player: {
      x: state.player.position.x,
      y: state.player.position.y,
      facing: state.player.facing,
      moving: walking || gathering !== null,
    },
  })

  requestAnimationFrame(frame)
}

/** Точки рядом с героем, которые можно тронуть. */
function buildNearby(): Point[] {
  const limit = 80
  const player = state.player.position
  const points: Point[] = []

  for (const node of availableNodes()) {
    if (distance(player, { x: node.x, y: node.y }) <= limit) points.push({ x: node.x, y: node.y })
  }

  for (const spot of availableHuntSpots()) {
    if (distance(player, { x: spot.x, y: spot.y }) <= limit) points.push({ x: spot.x, y: spot.y })
  }

  for (const npc of activeNpcs()) {
    if (distance(player, { x: npc.x, y: npc.y }) <= limit) points.push({ x: npc.x, y: npc.y })
  }

  return points
}

function buildingAt(worldX: number, worldY: number): string | null {  for (const building of START_VILLAGE) {
    const x = building.x * TILE
    const y = building.y * TILE
    const w = building.w * TILE
    const h = building.h * TILE
    if (worldX >= x && worldX <= x + w && worldY >= y - 14 && worldY <= y + h) {
      return building.id
    }
  }
  return null
}

function npcAt(worldX: number, worldY: number): ActiveNpc | null {
  let closest: ActiveNpc | null = null
  let closestDistance = 26

  for (const npc of activeNpcs()) {
    const point = npcPoint(npc)
    const d = Math.hypot(worldX - point.x, worldY - (point.y - 14))
    if (d <= closestDistance) {
      closest = npc
      closestDistance = d
    }
  }

  return closest
}

/** Плавное перемещение жителей: время прыгает действиями, шаги — глазами. */
const npcDisplay = new Map<string, Point>()

function npcPoint(npc: ActiveNpc): Point {
  return npcDisplay.get(npc.id) ?? { x: npc.x, y: npc.y }
}

function updateNpcMotion(dt: number): void {
  const alive = new Set<string>()

  for (const npc of activeNpcs()) {
    alive.add(npc.id)
    const display = npcDisplay.get(npc.id)

    if (!display) {
      npcDisplay.set(npc.id, { x: npc.x, y: npc.y })
      continue
    }

    const factor = Math.min(1, dt * 3)
    display.x += (npc.x - display.x) * factor
    display.y += (npc.y - display.y) * factor

    if (Math.hypot(npc.x - display.x, npc.y - display.y) < 0.5) {
      display.x = npc.x
      display.y = npc.y
    }
  }

  for (const id of [...npcDisplay.keys()]) {
    if (!alive.has(id)) npcDisplay.delete(id)
  }
}

interface ActiveNpc {
  id: string
  x: number
  y: number
  facing: Facing
  kind: 'trader' | 'villager'
  /** Короткое имя для подписи на сцене. */
  name: string
  label: string
}

/** Где человек сейчас по распорядку. null — спит, на улице его нет. */
function placeOf(
  id: string,
  fallbackX: number,
  fallbackY: number,
  minutes: number,
): { x: number; y: number; note: string | null } | null {
  const schedule = scheduleOf(id)
  if (!schedule) return { x: fallbackX, y: fallbackY, note: null }
  return positionAt(schedule, minutes)
}

function activeNpcs(): ActiveNpc[] {
  const minutes = state.clock.minutes
  const list: ActiveNpc[] = []

  // Торговец тоже человек: днём торгует, вечером у костра, ночью спит.
  const traderPlace = placeOf(TRADER.id, TRADER.x, TRADER.y, minutes)
  if (traderPlace) {
    list.push({
      id: TRADER.id,
      x: traderPlace.x,
      y: traderPlace.y,
      facing: TRADER.facing,
      kind: 'trader',
      name: TRADER.name,
      label: traderPlace.note
        ? `${TRADER.name} · ${traderPlace.note}`
        : `${TRADER.name} · ${TRADER.title}`,
    })
  }

  for (const thread of THREADS) {
    if (thread.requiresStage !== undefined && !stageAtLeast(thread.requiresStage)) continue

    const done = state.flags[`${thread.id}.done`] === true
    const talked = state.flags[`${thread.id}.talked`] === true
    const closed =
      state.flags[`${thread.id}.refused`] === true ||
      state.flags[`${thread.id}.failed`] === true

    if (closed) continue

    if (done && (thread.followUpScene === undefined || talked)) continue

    const place = placeOf(thread.id, thread.x, thread.y, minutes)
    if (!place) continue

    list.push({
      id: thread.id,
      x: place.x,
      y: place.y,
      facing: 'left',
      kind: 'villager',
      name: thread.npcName,
      label: done
        ? `${thread.npcName} · ${thread.followUpLabel ?? 'хочет поговорить'}`
        : `${thread.npcName} · ${thread.short}`,
    })
  }

  // Столичный купец приходит, когда деревня становится городом.
  if (stageAtLeast('stage_white_city')) {
    const capitalPlace = placeOf(
      TRADER_CAPITAL.id,
      TRADER_CAPITAL.x,
      TRADER_CAPITAL.y,
      minutes,
    )

    if (capitalPlace) {
      list.push({
        id: TRADER_CAPITAL.id,
        x: capitalPlace.x,
        y: capitalPlace.y,
        facing: TRADER_CAPITAL.facing,
        kind: 'trader',
        name: TRADER_CAPITAL.name,
        label: capitalPlace.note
          ? `${TRADER_CAPITAL.name} · ${capitalPlace.note}`
          : `${TRADER_CAPITAL.name} · ${TRADER_CAPITAL.title}`,
      })
    }
  }

  if (isCaravanDay()) {
    list.push({
      id: CARAVAN.id,
      x: CARAVAN.x,
      y: CARAVAN.y,
      facing: 'up',
      kind: 'trader',
      name: CARAVAN.name,
      label: `${CARAVAN.name} · ${CARAVAN.title}`,
    })
  }

  if (state.village.stageId === 'stage_trade_road' && state.flags['tihaya.choice'] === undefined) {
    list.push({
      id: TIHaya_ENVOY.id,
      x: TIHaya_ENVOY.x,
      y: TIHaya_ENVOY.y,
      facing: 'down',
      kind: 'villager',
      name: 'Посол',
      label: 'Посол Тихой Пади · ждёт ответа',
    })
  }

  return list
}

function openNpc(npc: ActiveNpc): void {
  if (npc.id === TIHaya_ENVOY.id) {
    openDiplomacy()
    return
  }

  if (npc.id === CARAVAN.id) {
    openCaravan()
    return
  }

  if (npc.id === TRADER_CAPITAL.id) {
    // Первый разговор — не про товар, а про то, зачем он пришёл.
    if (state.flags['capital.trader_met'] !== true) {
      state.flags['capital.trader_met'] = true
      startStory('capital_trader', 0, () => openCapitalTrade())
      return
    }

    openCapitalTrade()
    return
  }

  if (npc.kind === 'trader') {
    openTrade()
    return
  }

  const thread = threadById(npc.id)
  if (!thread) return

  if (state.flags[`${thread.id}.done`] === true) {
    if (thread.followUpScene !== undefined) {
      startStory(thread.followUpScene, 0, () => {
        state.flags[`${thread.id}.talked`] = true
        persist()
        updateHud()
      })
    }
    return
  }

  openThread(thread)
}

/** Открытая нить: не квест, а разговор о беде. */
function openThread(thread: ThreadDef): void {
  openRequestScreen({
    title: thread.title,
    text: thread.text,
    requirements: thread.requirements,
    getInventory: () => state.player.inventory,
    onDeliver: () => {
      if (!daylightOk()) return 'Стемнело. Люди уже спят.'

      const missing = thread.requirements.some(
        (requirement) => countOf(state.player.inventory, requirement.itemId) < requirement.count,
      )
      if (missing) return 'Не хватает'

      for (const requirement of thread.requirements) {
        removeItems(state.player.inventory, requirement.itemId, requirement.count)
      }

      state.player.money += thread.rewardMoney
      state.flags[`${thread.id}.done`] = true
      addJournal(thread.journalDone)

      flash(`${thread.npcName} благодарит. +${thread.rewardMoney} монет.`)
      closeRequestScreen()
      persist()
      updateHud()
      return ''
    },
    onRefuse: () => {
      state.flags[`${thread.id}.refused`] = true
      state.village.population = Math.max(1, state.village.population - 1)
      addJournal(thread.failText ?? `${thread.npcName} не дождался помощи и ушёл.`)
      flash(`${thread.npcName} больше не ждёт. В деревне стало на одного меньше.`, 7000)
      closeRequestScreen()
      persist()
      updateHud()
      return ''
    },
    onClose: () => undefined,
  })
}

function plotAt(worldX: number, worldY: number): StructureDef | null {
  for (const structure of STRUCTURES) {
    if (state.world.buildings.includes(structure.id)) continue

    const x = structure.x * TILE
    const y = structure.y * TILE
    const w = structure.w * TILE
    const h = structure.h * TILE

    if (worldX >= x && worldX <= x + w && worldY >= y && worldY <= y + h) return structure
  }

  return null
}

/** Построенное здание, у которого есть дело: рынок, гильдия, банк, академия и суд. */
const CIVIC_IDS = ['market', 'guild', 'bank', 'academy', 'court'] as const

function builtStructureAt(worldX: number, worldY: number): StructureDef | null {
  for (const structure of STRUCTURES) {
    if (!state.world.buildings.includes(structure.id)) continue
    if (!CIVIC_IDS.includes(structure.id as (typeof CIVIC_IDS)[number])) continue

    const x = structure.x * TILE
    const y = structure.y * TILE
    const w = structure.w * TILE
    const h = structure.h * TILE

    if (worldX >= x && worldX <= x + w && worldY >= y && worldY <= y + h) return structure
  }

  return null
}

function openBuiltStructure(structure: StructureDef): void {
  if (structure.id === 'guild') {
    openGuild()
    return
  }

  if (structure.id === 'market') {
    openTrade()
    return
  }

  if (structure.id === 'bank') {
    openBank()
    return
  }

  if (structure.id === 'court') {
    openCourt()
    return
  }

  if (structure.id === 'academy') {
    flash(
      structureReady('academy')
        ? 'В академии идут занятия. Ученики учатся бить точно — урон в бою до 7.'
        : 'Академия стоит разбитая. Нужен ремонт.',
      6000,
    )
  }
}

function openBuild(structure: StructureDef): void {
  openBuildScreen({
    name: structure.name,
    description: structure.description,
    costs: structure.cost.map((cost) => ({
      label: itemName(cost.itemId),
      have: countOf(state.village.storage, cost.itemId),
      need: cost.count,
    })),
    minutes: structure.minutes,
    onBuild: () => {
      if (!daylightOk()) return 'Стемнело. Строить можно только днём.'

      const missing = structure.cost.some(
        (cost) => countOf(state.village.storage, cost.itemId) < cost.count,
      )
      if (missing) return 'На складе не хватает материалов'

      for (const cost of structure.cost) {
        removeItems(state.village.storage, cost.itemId, cost.count)
      }

      state.world.buildings.push(structure.id)
      advanceTime(structure.minutes)
      dayStats.built += 1
      addJournal(structure.journal)
      refreshObstacles()
      persist()
      updateHud()
      flash(`Построено: ${structure.name}`, 5000)
      closeBuildScreen()

      // Башня поставлена — с дороги видно, кто идёт.
      if (structure.id === 'tower' && state.flags['chapter.soldiers'] !== true) {
        state.flags['chapter.soldiers'] = true
        startStory('soldiers')
      }

      // Суд в Белом городе — повод для главы о первом разбирательстве.
      if (
        structure.id === 'court' &&
        stageAtLeast('stage_white_city') &&
        state.flags['chapter.first_court'] !== true
      ) {
        startStory('first_court')
      }

      return ''
    },
    onClose: () => undefined,
  })
}

interface SpotHit {
  id: string
  x: number
  y: number
  label: string
  kind: 'tracks' | 'lair'
}

function stageAtLeast(id: string): boolean {
  const current = STAGES.findIndex((stage) => stage.id === state.village.stageId)
  const target = STAGES.findIndex((stage) => stage.id === id)
  return target >= 0 && current >= target
}

/** Узлы, которые уже видны: окрестности открываются по стадиям. */
function availableNodes(): readonly GatheringNodeDef[] {
  return GATHERING_NODES.filter(
    (node) => node.requiresStage === undefined || stageAtLeast(node.requiresStage),
  )
}

function availableHuntSpots(): readonly HuntSpot[] {
  return HUNT_SPOTS.filter(
    (spot) => spot.requiresStage === undefined || stageAtLeast(spot.requiresStage),
  )
}

function activeSpots(): SpotHit[] {
  const list: SpotHit[] = availableHuntSpots().map((spot) => ({
    id: spot.id,
    x: spot.x,
    y: spot.y,
    label: spot.label,
    kind: 'tracks',
  }))

  for (const boss of BOSS_SPOTS) {
    if (state.flags[boss.flag] === true) continue
    list.push({ id: boss.id, x: boss.x, y: boss.y, label: boss.label, kind: 'lair' })
  }

  return list
}

function spotAt(worldX: number, worldY: number): SpotHit | null {
  let closest: SpotHit | null = null
  let closestDistance = 22

  for (const spot of activeSpots()) {
    const d = Math.hypot(worldX - spot.x, worldY - spot.y)
    if (d <= closestDistance) {
      closest = spot
      closestDistance = d
    }
  }

  return closest
}

function startBoss(spotId: string): void {
  if (!daylightOk()) return

  const boss = BOSS_SPOTS.find((candidate) => candidate.id === spotId)
  if (!boss || state.flags[boss.flag] === true) return

  const enemy = ENEMIES.find((candidate) => candidate.id === boss.enemyId)
  if (!enemy) return

  beginCombat(enemy, {}, 'boss')
}

function openTrade(): void {
  const bonus = marketBonus()

  openTradeScreen({
    trader: { ...TRADER, generosity: bonus },
    orderText:
      state.flags['trader.order.done'] === true
        ? ''
        : `Просьба Корнея. Нужно ${TRADER.order.count} × ${itemName(TRADER.order.itemId)} — заплатит ${TRADER.order.reward} монет.`,
    orderReady: countOf(state.player.inventory, TRADER.order.itemId) >= TRADER.order.count,
    getState: () => state,
    onBuy: (itemId) => {
      if (!daylightOk()) return 'Стемнело. Корней уже свернул товар.'

      const offer = TRADER.sells.find((candidate) => candidate.itemId === itemId)
      if (!offer) return 'Такого товара нет'

      const result = buy(state, offer, ITEM_BY_ID, bonus)
      if (!result.ok) return result.reason

      dayStats.traded += 1
      playCoin()
      persist()
      updateHud()
      return result.message
    },
    onSell: (itemId, quality) => {
      if (!daylightOk()) return 'Стемнело. Корней уже свернул товар.'

      const result = sell(state, itemId, 1, ITEM_BY_ID, bonus, quality)
      if (!result.ok) return result.reason

      dayStats.traded += 1

      if (state.flags['journal.firstTrade'] !== true) {
        state.flags['journal.firstTrade'] = true
        addJournal('Корней взял у меня первый товар и отсчитал монету. Здесь это ещё что-то значит.')
      }

      playCoin()
      persist()
      updateHud()
      return result.message
    },
    onOrder: () => {
      const result = completeOrder(state, TRADER.order, ITEM_BY_ID)
      if (!result.ok) return result.reason

      if (state.flags['journal.firstOrder'] !== true) {
        state.flags['journal.firstOrder'] = true
        addJournal('Впервые выполнил чью-то просьбу. Не за награду — потому что обещал.')
      }

      playCoin()
      persist()
      updateHud()
      return result.message
    },
  })
}

function openCapitalTrade(): void {
  const bonus = marketBonus() + 0.05

  openTradeScreen({
    trader: { ...TRADER_CAPITAL, generosity: bonus },
    orderText:
      state.flags['capital.trader_order.done'] === true
        ? ''
        : `Просьба Фрола. Нужно ${TRADER_CAPITAL.order.count} × ${itemName(TRADER_CAPITAL.order.itemId)} — заплатит ${TRADER_CAPITAL.order.reward} монет.`,
    orderReady:
      countOf(state.player.inventory, TRADER_CAPITAL.order.itemId) >= TRADER_CAPITAL.order.count,
    getState: () => state,
    onBuy: (itemId) => {
      if (!daylightOk()) return 'Фрол закрыл ставни: ночью он не торгует.'

      const offer = TRADER_CAPITAL.sells.find((candidate) => candidate.itemId === itemId)
      if (!offer) return 'Такого товара нет'

      const result = buy(state, offer, ITEM_BY_ID, bonus)
      if (!result.ok) return result.reason

      dayStats.traded += 1
      playCoin()
      persist()
      updateHud()
      return result.message
    },
    onSell: (itemId, quality) => {
      if (!daylightOk()) return 'Фрол закрыл ставни: ночью он не торгует.'

      const result = sell(state, itemId, 1, ITEM_BY_ID, bonus, quality)
      if (!result.ok) return result.reason

      dayStats.traded += 1
      playCoin()
      persist()
      updateHud()
      return result.message
    },
    onOrder: () => {
      const result = completeOrder(state, TRADER_CAPITAL.order, ITEM_BY_ID, 'capital.trader_order.done')
      if (!result.ok) return result.reason

      addJournal('Фрол взял сталь и заплатил сразу, не торгуясь. Сказал: «С таким городом можно иметь дело».')
      playCoin()
      persist()
      updateHud()
      return result.message
    },
  })
}

function openCaravan(): void {
  const generosity = CARAVAN.generosity + state.world.tihaya.attitude / 200

  openTradeScreen({
    trader: { ...CARAVAN, generosity },
    getState: () => state,
    onBuy: (itemId) => {
      if (!daylightOk()) return 'Караван уже собирается в путь.'

      const offer = CARAVAN.sells.find((candidate) => candidate.itemId === itemId)
      if (!offer) return 'Такого товара нет'

      const result = buy(state, offer, ITEM_BY_ID, CARAVAN.generosity + state.world.tihaya.attitude / 200)
      if (!result.ok) return result.reason

      dayStats.traded += 1
      playCoin()
      persist()
      updateHud()
      return result.message
    },
    onSell: (itemId, quality) => {
      if (!daylightOk()) return 'Караван уже собирается в путь.'

      const result = sell(
        state,
        itemId,
        1,
        ITEM_BY_ID,
        CARAVAN.generosity + state.world.tihaya.attitude / 200,
        quality,
      )
      if (!result.ok) return result.reason

      dayStats.traded += 1
      playCoin()
      persist()
      updateHud()
      return result.message
    },
  })
}

/** Караван стоит у ворот: чаще при союзе, реже при вражде. */
function caravanPeriod(): number {
  const attitude = state.world.tihaya.attitude
  if (attitude >= 20) return 3
  if (attitude < 0) return 7
  return 5
}

function isCaravanDay(): boolean {
  const day = Math.floor(absoluteMinutes(state.clock) / MINUTES_PER_DAY)
  return day % caravanPeriod() === 0 && isWorkingHours(state.clock)
}

const TIHaya_ENVOY = { id: 'tihaya_envoy', x: 700, y: 1130 }

function openDiplomacy(): void {
  openDiplomacyScreen({
    text: 'Посол стоит у ворот с самого утра — сухой, в дорожной пыли, с грамотой за пазухой. Тихая Падь предлагает выбор: торговый союз, дань или ничего. Последнее он произносит без злости, как человек, который уже знает, чем это кончится.',
    tributeCost: 30,
    canPay: state.player.money >= 30,
    onAlly: () => {
      state.world.tihaya.attitude = Math.min(100, state.world.tihaya.attitude + 30)
      state.flags['tihaya.choice'] = 'ally'
      addJournal('С Тихой Падью заключили торговый союз. Караваны теперь ходят чаще.')
      flash('Союз с Тихой Падью. Караваны будут приходить чаще.', 6000)
      persist()
      updateHud()
    },
    onTribute: () => {
      state.player.money -= 30
      state.world.tihaya.attitude = Math.min(100, state.world.tihaya.attitude + 10)
      state.flags['tihaya.choice'] = 'tribute'
      addJournal('Заплатил Тихой Пади дань. Тридцать монет — за тишину на дороге.')
      flash('Дань уплачена. Пока о нас не вспоминают.', 6000)
      persist()
      updateHud()
    },
    onRefuse: () => {
      state.world.tihaya.attitude = Math.max(-100, state.world.tihaya.attitude - 30)
      state.flags['tihaya.choice'] = 'refuse'
      addJournal('Послу Тихой Пади отказали. Он кивнул так, будто ждал этого с самого начала.')
      flash('Тихая Падь запомнит отказ.', 6000)
      persist()
      updateHud()
    },
  })
}

function nodeAt(worldX: number, worldY: number): GatheringNodeDef | null {
  let closest: GatheringNodeDef | null = null
  let closestDistance = NODE_HOVER_RADIUS

  for (const node of availableNodes()) {
    const distanceToNode = Math.hypot(worldX - node.x, worldY - node.y)
    if (distanceToNode <= closestDistance) {
      closest = node
      closestDistance = distanceToNode
    }
  }

  return closest
}

/** Сколько даст узел сейчас: сезон, время суток, зима. */
function nodeYield(node: GatheringNodeDef): number {
  const season = seasonOf(state.clock.day)

  if (node.kind === 'fish') {
    return fishingYield(node.count, season, Math.floor(state.clock.minutes / 60))
  }

  return seasonalYield(node.count, node.kind, season)
}

function nodeLabel(node: GatheringNodeDef, now: number): string {
  const season = seasonOf(state.clock.day)
  const dormant = dormantReason(node.kind, season)
  if (dormant) return `${node.name} · ${dormant}`

  const hour = Math.floor(state.clock.minutes / 60)
  if (node.kind === 'fish' && fishingIsGood(hour)) return `${node.name} · клюёт`

  if (isReady(state.world.nodes, node.id, now)) {
    const amount = nodeYield(node)
    return amount < node.count ? `${node.name} · сейчас ${amount}` : node.name
  }

  const left = minutesUntilReady(state.world.nodes, node.id, now)
  return `${node.name} · ${describeRestore(left)}`
}

function startGathering(node: GatheringNodeDef): void {
  if (!daylightOk()) return

  if (node.requiredTool !== undefined && state.player.equipment.tool !== node.requiredTool) {
    const tool = itemDef(node.requiredTool)
    flash(`Нужна ${tool ? tool.name.toLowerCase() : 'инструмент'}. Без неё здесь делать нечего.`)
    return
  }

  const dormant = dormantReason(node.kind, seasonOf(state.clock.day))
  if (dormant) {
    flash(`${node.name}: ${dormant}.`)
    return
  }

  const now = absoluteMinutes(state.clock)

  if (!isReady(state.world.nodes, node.id, now)) {
    flash(`${node.name}: ${describeRestore(minutesUntilReady(state.world.nodes, node.id, now))}.`)
    return
  }

  gathering = { nodeId: node.id, elapsed: 0, duration: GATHER_SECONDS[node.kind] }
  gatherSoundTimer = 0
  moveTarget = null
  pendingNodeId = null
}

function finishGathering(): void {
  const current = gathering
  gathering = null
  if (!current) return

  const node = GATHERING_NODES.find((candidate) => candidate.id === current.nodeId)
  if (!node) return

  const def = itemDef(node.itemId)
  if (!def) return

  const now = absoluteMinutes(state.clock)

  if (!isReady(state.world.nodes, node.id, now)) {
    flash(`${node.name}: ${describeRestore(minutesUntilReady(state.world.nodes, node.id, now))}.`)
    return
  }

  const amount = nodeYield(node)
  if (amount === 0) {
    flash(`${node.name}: ${dormantReason(node.kind, seasonOf(state.clock.day)) ?? 'пусто'}.`)
    return
  }

  const added = addItems(state.player.inventory, def, amount, 1, ITEM_BY_ID)

  if (added === 0) {
    flash('Не влезло: груз переполнен.')
    return
  }

  markGathered(state.world.nodes, node.id, now, node.restoreMinutes)
  advanceTime(ACTION_MINUTES.gather)
  dayStats.gathered += 1

  flash(
    added < amount
      ? `Собрано: ${def.name} ×${added} из ${amount} — больше не влезло.`
      : `Собрано: ${def.name} ×${added}`,
  )

  persist()

  // Первая засада — ручная сцена, а не случайность (M1.7).
  if (state.flags['ambush.first'] !== true && node.kind === 'branch') {
    state.flags['ambush.first'] = true
    startAmbush()
    return
  }

  // Дальше — по заметности: чем больше шумишь, тем вероятнее встреча.
  tryAmbush()
}

function updateHover(event: PointerEvent): void {
  const rect = canvas.getBoundingClientRect()
  const world = camera.toWorld(event.clientX - rect.left, event.clientY - rect.top)

  const npc = npcAt(world.x, world.y)
  const spot = npc === null ? spotAt(world.x, world.y) : null
  const node = npc === null && spot === null ? nodeAt(world.x, world.y) : null
  const plot =
    npc === null && spot === null && node === null ? plotAt(world.x, world.y) : null
  const built =
    npc === null && spot === null && node === null && plot === null
      ? builtStructureAt(world.x, world.y)
      : null

  hoveredNpcId = npc?.id ?? null
  hoveredSpotId = spot?.id ?? null
  hoveredNodeId = node?.id ?? null
  hoveredPlotId = plot?.id ?? null
  hoveredId =
    npc === null && spot === null && node === null && plot === null && built === null
      ? buildingAt(world.x, world.y)
      : null

  canvas.style.cursor =
    npc !== null ||
    spot !== null ||
    node !== null ||
    plot !== null ||
    built !== null ||
    hoveredId !== null
      ? 'pointer'
      : 'default'
}

// Указатель: короткий тап — идти, перетаскивание — сдвиг, два пальца — масштаб (4.2.2, 5.2).
let pointerStart: Point | null = null
let pointerDragged = false
const activePointers = new Map<number, Point>()
let pinch: { distance: number; zoom: number } | null = null

function pointerDistance(): number {
  const points = [...activePointers.values()]
  const first = points[0]
  const second = points[1]
  if (!first || !second) return 0
  return Math.hypot(second.x - first.x, second.y - first.y)
}

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault()
    camera.zoomBy(event.deltaY < 0 ? 1.1 : 1 / 1.1)
  },
  { passive: false },
)

canvas.addEventListener('pointerdown', (event) => {
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  try {
    canvas.setPointerCapture(event.pointerId)
  } catch {
    // Синтетические события и старые браузеры могут не поддерживать захват.
  }

  if (activePointers.size === 1) {
    pointerStart = { x: event.clientX, y: event.clientY }
    pointerDragged = false
  } else if (activePointers.size === 2) {
    pointerDragged = true
    pinch = { distance: pointerDistance(), zoom: camera.zoom }
    followPaused = true
    canvas.classList.add('scene--dragging')
  }
})

canvas.addEventListener('pointermove', (event) => {
  if (!activePointers.has(event.pointerId)) {
    updateHover(event)
    return
  }

  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (activePointers.size >= 2) {
    if (pinch && pinch.distance > 0) {
      camera.setZoom(pinch.zoom * (pointerDistance() / pinch.distance))
    }
    return
  }

  if (!pointerStart) return

  const dx = event.clientX - pointerStart.x
  const dy = event.clientY - pointerStart.y

  if (!pointerDragged && Math.hypot(dx, dy) > 6) {
    pointerDragged = true
    followPaused = true
    canvas.classList.add('scene--dragging')
  }

  if (pointerDragged) {
    camera.pan(dx, dy)
    pointerStart = { x: event.clientX, y: event.clientY }
    gathering = null
    pendingNodeId = null
  }
})

function endPointer(event: PointerEvent): void {
  const wasOnlyPointer = activePointers.size === 1
  activePointers.delete(event.pointerId)

  if (activePointers.size < 2) pinch = null

  if (wasOnlyPointer && pointerStart && !pointerDragged) {
    const rect = canvas.getBoundingClientRect()
    const world = camera.toWorld(event.clientX - rect.left, event.clientY - rect.top)
    const npc = npcAt(world.x, world.y)
    const spot = npc === null ? spotAt(world.x, world.y) : null
    const node = npc === null && spot === null ? nodeAt(world.x, world.y) : null
    const plot =
      npc === null && spot === null && node === null ? plotAt(world.x, world.y) : null
    const built =
      npc === null && spot === null && node === null && plot === null
        ? builtStructureAt(world.x, world.y)
        : null

    gathering = null

    if (plot) {
      openBuild(plot)
      return
    }

    if (built) {
      openBuiltStructure(built)
      return
    }

    if (spot) {
      const spotDistance = distance(state.player.position, { x: spot.x, y: spot.y })

      if (spotDistance <= INTERACT_RANGE) {
        if (spot.kind === 'lair') {
          startBoss(spot.id)
        } else {
          const hunt = HUNT_SPOTS.find((candidate) => candidate.id === spot.id)
          if (hunt) startHunt(hunt)
        }
      } else {
        pendingNodeId = null
        moveTarget = { x: spot.x, y: spot.y }
        followPaused = false
      }
      return
    }

    if (npc !== null) {
      const npcDistance = distance(state.player.position, { x: npc.x, y: npc.y })
      if (npcDistance <= INTERACT_RANGE + 12) {
        openNpc(npc)
      } else {
        pendingNpcId = npc.id
        pendingNodeId = null
        moveTarget = { x: npc.x, y: npc.y + 18 }
        followPaused = false
      }
      return
    }

    if (node) {
      const now = absoluteMinutes(state.clock)

      if (!isReady(state.world.nodes, node.id, now)) {
        flash(`${node.name}: ${describeRestore(minutesUntilReady(state.world.nodes, node.id, now))}.`)
      } else if (distance(state.player.position, { x: node.x, y: node.y }) <= INTERACT_RANGE) {
        startGathering(node)
      } else {
        pendingNodeId = node.id
        moveTarget = { x: node.x, y: node.y }
        followPaused = false
      }
    } else {
      pendingNodeId = null
      moveTarget = world
      followPaused = false
    }
  }

  if (activePointers.size === 0) {
    pointerStart = null
    canvas.classList.remove('scene--dragging')
  }
}

canvas.addEventListener('pointerup', endPointer)
canvas.addEventListener('pointercancel', (event) => {
  activePointers.delete(event.pointerId)
  if (activePointers.size < 2) pinch = null
  if (activePointers.size === 0) {
    pointerStart = null
    canvas.classList.remove('scene--dragging')
  }
})

canvas.addEventListener('pointerleave', () => {
  hoveredId = null
  canvas.style.cursor = 'default'
})

globalThis.addEventListener('keydown', (event) => {
  if (storyOpen) return

  const key = event.key.toLowerCase()

  if (key === 'g' || key === 'п') {
    showGrid = !showGrid
    return
  }
  if (key === '0') {
    camera.refit()
    return
  }

  if (key.startsWith('arrow')) event.preventDefault()
  pressed.add(key)
})

globalThis.addEventListener('keyup', (event) => {
  pressed.delete(event.key.toLowerCase())
})

globalThis.addEventListener('blur', () => pressed.clear())
globalThis.addEventListener('resize', resize)
globalThis.addEventListener('orientationchange', resize)

// Звук можно включить только после действия игрока.
globalThis.addEventListener('pointerdown', ensureAudio)
globalThis.addEventListener('keydown', ensureAudio)

// Автосохранение при уходе со страницы (3.1.4).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist()
})
globalThis.addEventListener('pagehide', () => {
  persist()
})

state = loadState()

// Старые сохранения: если деревня уже поднялась, ворота давно открыты.
if (state.flags['gate.open'] !== true && state.village.stageId !== 'stage_dying') {
  state.flags['gate.open'] = true
}

ensureFreePosition()
refreshObstacles()
resize()
camera.centerOn(state.player.position.x, state.player.position.y)
updateHud()
requestAnimationFrame(frame)

// Пролог показывается один раз, на новой игре. Если сцена не закончена — продолжаем с неё.
if (state.story) {
  startStory(state.story.sceneId, state.story.beat)
} else if (state.flags['prologue.done'] !== true) {
  startStory('prologue')
}

// Отладочный доступ к состоянию. Живёт только в dev-режиме.
if (import.meta.env.DEV) {
  void Promise.all([import('./ui/devPanel'), import('./ui/devPanel.css')]).then(([panelModule]) => {
    const panel = panelModule.createDevPanel({
      getState: () => state,
      nextDay: () => sleep(),
      reset: () => {
        state = createInitialState()
        refreshObstacles()
        moveTarget = null
        camera.centerOn(state.player.position.x, state.player.position.y)
        persist()
        updateHud()
      },
      refitCamera: () => camera.refit(),
      toggleGrid: () => {
        showGrid = !showGrid
      },
      giveItem: (id: string, count: number) => {
        const def = itemDef(id)
        if (!def) return

        const added = addItems(state.player.inventory, def, count, 1, ITEM_BY_ID)

        if (added === count) {
          statusNote = ''
          flash(`Дано: ${def.name} ×${added}`)
        } else if (added === 0) {
          flash('Не влезло: груз переполнен.')
        } else {
          flash(`Влезло только ${added} из ${count}: груз почти полон.`)
        }

        persist()
      },
    })

    app.append(panel.element)
    globalThis.addEventListener('keydown', (event) => {
      if (event.key === 'F2') {
        event.preventDefault()
        panel.toggle()
      }
    })
  })

  Object.defineProperty(globalThis, '__antaria', {
    configurable: true,
    value: {
      get state() {
        return state
      },
      get camera() {
        return camera
      },
      get audio() {
        return audio
      },
      playTestSound: () => {
        ensureAudio()
        playCoin()
      },
      fireLevel: () => ambience.getFireLevel(),
      fireDistance: () => lastFireDistance,
      obstacleCount: () => obstacles.length,
      gate: () => gateOpen(),
      bounds: () => walkableBounds(),
      refreshWorld: () => {
        refreshObstacles()
        return obstacles.length
      },
      nodes: () =>
        availableNodes().map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
          kind: node.kind,
          requiresStage: node.requiresStage ?? null,
        })),
      ambush: () => startAmbush(),
      hasScene: (id: string) => Boolean(sceneById(id)),
      npcs: () => activeNpcs().map((npc) => ({ id: npc.id, x: npc.x, y: npc.y })),
      spots: () =>
        activeSpots().map((spot) => ({ id: spot.id, x: spot.x, y: spot.y, kind: spot.kind })),
      talkTo: (id: string) => {
        const npc = activeNpcs().find((candidate) => candidate.id === id)
        if (npc) openNpc(npc)
        return Boolean(npc)
      },
      stats: () => playerCombatStats(),
      ambushRoll: () => {
        tryAmbush()
        return { danger, pending: pendingAmbush, inCombat: combat !== null }
      },
      get ambience() {
        return ambience
      },
      save: () => {
        persist()
        return state.savedAt
      },
      load: () => {
        state = loadState()
        ensureFreePosition()
        refreshObstacles()
        camera.centerOn(state.player.position.x, state.player.position.y)
        updateHud()
        return state
      },
      reset: () => {
        state = createInitialState()
        moveTarget = null
        camera.centerOn(state.player.position.x, state.player.position.y)
        persist()
        updateHud()
        return state
      },
      toggleGrid: () => {
        showGrid = !showGrid
        return showGrid
      },
      moveTo: (x: number, y: number) => {
        moveTarget = { x, y }
        return moveTarget
      },
    },
  })
}
