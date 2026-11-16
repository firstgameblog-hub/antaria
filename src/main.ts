import './styles.css'
import { createInitialState, SPAWN_POINT, type GameState } from './core/state'
import { createCombat, resolveTurn, type CombatState } from './core/combat'
import { WOLF, DEER } from './content/enemies'
import type { CombatAction, EnemyDef } from './data/combat'
import { HUNT_SPOTS, type HuntSpot } from './content/hunting'
import { ROOF_THREAD, threadById, type ThreadDef } from './content/threads'
import { openRequestScreen, closeRequestScreen } from './ui/requestScreen'
import { canCraft, craftRecipe } from './core/crafting'
import { addItems, countOf, removeItems, weightOf } from './core/inventory'
import { describeRestore, isReady, markGathered, minutesUntilReady } from './core/gathering'
import { distance, facingOf, findFreeSpot, movePlayer, stepToward, type Facing, type Point } from './core/movement'
import { AUTO_SLOT, readBackup, readSlot, writeSlot } from './core/storage'
import { ACTION_MINUTES, absoluteMinutes, addMinutes, nextMorning } from './core/time'
import type { GatheringNodeDef, NodeKind } from './data/gathering'
import { GATHERING_NODES } from './content/gathering'
import { ITEM_BY_ID, itemDef, itemName } from './content/items'
import { recipeById } from './content/recipes'
import { TRADER } from './content/trader'
import { sceneById } from './content/story'
import type { StoryScene } from './data/story'
import { buy, completeOrder, sell } from './core/trade'
import { Camera } from './render/camera'
import { OBSTACLES, PLAYER_RADIUS, TILE, VILLAGE_WALKABLE, WORLD, drawVillage } from './render/scene'
import { createHud } from './ui/hud'
import { openSaveScreen } from './ui/saveScreen'
import { openCraftScreen } from './ui/craftScreen'
import { openTradeScreen } from './ui/tradeScreen'
import { openStoryScreen } from './ui/storyScreen'
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

const camera = new Camera(WORLD)

const hud = createHud({
  onSleep: () => sleep(),
  onSaves: () => openSaves(),
  onCraft: () => openCraft(),
  onJournal: () => openJournal(),
  onSound: () => toggleSound(),
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

/** Страховка: герой не должен оказаться внутри постройки или за частоколом. */
function ensureFreePosition(): void {
  const position = state.player.position
  const free = findFreeSpot(position, PLAYER_RADIUS, OBSTACLES, VILLAGE_WALKABLE, position)
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

/** Ночь (3.2.6). Время идёт вперёд, утром — сводка. Следы в деревне появятся с 7.16. */
function sleep(): void {
  const step = nextMorning(state.clock)
  state.clock = step.clock
  nightNote = {
    text:
      step.daysPassed > 1
        ? `Ты проспал мимо ${step.daysPassed} ночей. В деревне пока тихо.`
        : 'Ночь прошла. В деревне пока тихо.',
    until: performance.now() + 4500,
  }
  persist()
  updateHud()
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
  return {
    maxHp: state.player.health.max,
    minDamage: PLAYER_MIN_DAMAGE,
    maxDamage: PLAYER_MAX_DAMAGE,
  }
}

function beginCombat(enemy: EnemyDef, options: { playerFirst?: boolean } = {}): void {
  if (combat) return

  combat = createCombat(enemy, state.player.health.current, playerCombatStats(), options)
  ambience.setDucked(true)

  openCombatScreen({
    getState: () => combat,
    onAction: (action: CombatAction) => {
      if (!combat) return
      resolveTurn(combat, action, playerCombatStats())
      state.player.health.current = Math.max(0, combat.playerHp)

      // Бой тоже занимает время: ход — пять минут.
      state.clock = addMinutes(state.clock, ACTION_MINUTES.fight).clock
      updateHud()
    },
    onFinish: () => finishCombat(),
  })
}

function startAmbush(): void {
  beginCombat(WOLF)
}

function startHunt(spot: HuntSpot): void {
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
  combat = null
  ambience.setDucked(storyOpen)

  if (result) {
    if (result.outcome === 'victory') {
      for (const loot of result.enemy.loot ?? []) {
        if (loot.chance !== undefined && Math.random() > loot.chance) continue
        const def = itemDef(loot.itemId)
        if (def) addItems(state.player.inventory, def, loot.count, 1, ITEM_BY_ID)
      }

      state.player.health.current = Math.max(1, result.playerHp)

      addJournal(
        result.enemy.id === 'roe_deer'
          ? 'Вышел по следам на поляну и взял косулю. Мясо будет.'
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
  }

  persist()
  updateHud()
}

/** Запись в дневник-хронику (9.4), без повторов. */
function addJournal(text: string): void {
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

/** Открытые просьбы: видно, о чём люди просят прямо сейчас. */
function openRequests(): string[] {
  const requests: string[] = []

  if (state.flags[`${ROOF_THREAD.id}.done`] !== true) {
    const list = ROOF_THREAD.requirements
      .map((requirement) => `${itemName(requirement.itemId)} — ${requirement.count} шт.`)
      .join(', ')
    requests.push(`Марта просит: ${list}`)
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

function startStory(sceneId: string, startBeat = 0): void {
  const scene = sceneById(sceneId)
  if (!scene) return

  state.story = { sceneId, beat: startBeat }
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
      persist()
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
      }

      persist()
      updateHud()

      // Сразу после пролога — первое утро: старик объясняет, что делать.
      if (sceneId === 'prologue' && state.flags['chapter1.morning.done'] !== true) {
        startStory('morning')
      }
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
      const recipe = recipeById(recipeId)
      if (!recipe) return 'Такого рецепта нет'

      const result = craftRecipe(state, recipe, ITEM_BY_ID)
      if (!result.ok) return result.reason

      if (state.flags['journal.firstCraft'] !== true) {
        state.flags['journal.firstCraft'] = true
        addJournal(
          `Первое, что я сделал здесь своими руками, — ${itemName(recipe.output.itemId).toLowerCase()}.`,
        )
      }

      playCraft()
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

  const next = movePlayer(position, delta, PLAYER_RADIUS, OBSTACLES, VILLAGE_WALKABLE)

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
  const sceneNodes = GATHERING_NODES.map((node) => ({
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
    hoveredSpotId === null ? undefined : HUNT_SPOTS.find((spot) => spot.id === hoveredSpotId)

  const sceneSpots = HUNT_SPOTS.map((spot) => ({
    id: spot.id,
    x: spot.x,
    y: spot.y,
    ready: isReady(state.world.nodes, spot.id, now),
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
            return npc ? { x: npc.x, y: npc.y, label: npc.label } : null
          })()
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
    npcs: activeNpcs().map((npc) => ({
      id: npc.id,
      x: npc.x,
      y: npc.y,
      facing: npc.facing,
      kind: npc.kind,
    })),
    spots: sceneSpots,
    nearby,
    drips:
      state.flags[`${ROOF_THREAD.id}.done`] === true ? [] : [{ x: ROOF_THREAD.drip.x, y: ROOF_THREAD.drip.y }],
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

  for (const node of GATHERING_NODES) {
    if (distance(player, { x: node.x, y: node.y }) <= limit) points.push({ x: node.x, y: node.y })
  }

  for (const spot of HUNT_SPOTS) {
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
    const d = Math.hypot(worldX - npc.x, worldY - (npc.y - 14))
    if (d <= closestDistance) {
      closest = npc
      closestDistance = d
    }
  }

  return closest
}

interface ActiveNpc {
  id: string
  x: number
  y: number
  facing: Facing
  kind: 'trader' | 'villager'
  label: string
}

function activeNpcs(): ActiveNpc[] {
  const list: ActiveNpc[] = [
    {
      id: TRADER.id,
      x: TRADER.x,
      y: TRADER.y,
      facing: TRADER.facing,
      kind: 'trader',
      label: `${TRADER.name} · ${TRADER.title}`,
    },
  ]

  if (state.flags[`${ROOF_THREAD.id}.done`] !== true) {
    list.push({
      id: ROOF_THREAD.id,
      x: ROOF_THREAD.x,
      y: ROOF_THREAD.y,
      facing: 'left',
      kind: 'villager',
      label: `${ROOF_THREAD.npcName} · ${ROOF_THREAD.short}`,
    })
  }

  return list
}

function openNpc(npc: ActiveNpc): void {
  if (npc.kind === 'trader') {
    openTrade()
    return
  }

  const thread = threadById(npc.id)
  if (thread) openThread(thread)
}

/** Открытая нить: не квест, а разговор о беде. */
function openThread(thread: ThreadDef): void {
  openRequestScreen({
    title: thread.title,
    text: thread.text,
    requirements: thread.requirements,
    getInventory: () => state.player.inventory,
    onDeliver: () => {
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
    onClose: () => undefined,
  })
}

function spotAt(worldX: number, worldY: number): HuntSpot | null {
  let closest: HuntSpot | null = null
  let closestDistance = 22

  for (const spot of HUNT_SPOTS) {
    const d = Math.hypot(worldX - spot.x, worldY - spot.y)
    if (d <= closestDistance) {
      closest = spot
      closestDistance = d
    }
  }

  return closest
}

function openTrade(): void {
  openTradeScreen({
    getState: () => state,
    onBuy: (itemId) => {
      const offer = TRADER.sells.find((candidate) => candidate.itemId === itemId)
      if (!offer) return 'Такого товара нет'

      const result = buy(state, offer, ITEM_BY_ID)
      if (!result.ok) return result.reason

      playCoin()
      persist()
      updateHud()
      return result.message
    },
    onSell: (itemId) => {
      const result = sell(state, itemId, 1, ITEM_BY_ID)
      if (!result.ok) return result.reason

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

function nodeAt(worldX: number, worldY: number): GatheringNodeDef | null {  let closest: GatheringNodeDef | null = null
  let closestDistance = NODE_HOVER_RADIUS

  for (const node of GATHERING_NODES) {
    const distanceToNode = Math.hypot(worldX - node.x, worldY - node.y)
    if (distanceToNode <= closestDistance) {
      closest = node
      closestDistance = distanceToNode
    }
  }

  return closest
}

function nodeLabel(node: GatheringNodeDef, now: number): string {
  if (isReady(state.world.nodes, node.id, now)) return node.name
  const left = minutesUntilReady(state.world.nodes, node.id, now)
  return `${node.name} · ${describeRestore(left)}`
}

function startGathering(node: GatheringNodeDef): void {
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

  const added = addItems(state.player.inventory, def, node.count, 1, ITEM_BY_ID)

  if (added === 0) {
    flash('Не влезло: груз переполнен.')
    return
  }

  markGathered(state.world.nodes, node.id, now, node.restoreMinutes)
  state.clock = addMinutes(state.clock, ACTION_MINUTES.gather).clock

  flash(
    added < node.count
      ? `Собрано: ${def.name} ×${added} из ${node.count} — больше не влезло.`
      : `Собрано: ${def.name} ×${added}`,
  )

  persist()

  // Первая засада — ручная сцена, а не случайность (M1.7).
  if (state.flags['ambush.first'] !== true && node.kind === 'branch') {
    state.flags['ambush.first'] = true
    startAmbush()
  }
}

function updateHover(event: PointerEvent): void {
  const rect = canvas.getBoundingClientRect()
  const world = camera.toWorld(event.clientX - rect.left, event.clientY - rect.top)

  const npc = npcAt(world.x, world.y)
  const spot = npc === null ? spotAt(world.x, world.y) : null
  const node = npc === null && spot === null ? nodeAt(world.x, world.y) : null

  hoveredNpcId = npc?.id ?? null
  hoveredSpotId = spot?.id ?? null
  hoveredNodeId = node?.id ?? null
  hoveredId = npc === null && spot === null && node === null ? buildingAt(world.x, world.y) : null

  canvas.style.cursor =
    npc !== null || spot !== null || node !== null || hoveredId !== null ? 'pointer' : 'default'
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

    gathering = null

    if (spot) {
      const spotDistance = distance(state.player.position, { x: spot.x, y: spot.y })
      if (spotDistance <= INTERACT_RANGE) {
        startHunt(spot)
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
ensureFreePosition()
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
      ambush: () => startAmbush(),
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
