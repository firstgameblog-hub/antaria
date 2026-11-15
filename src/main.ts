import './styles.css'
import { createInitialState, type GameState } from './core/state'
import { addItems, weightOf } from './core/inventory'
import { describeRestore, isReady, markGathered, minutesUntilReady } from './core/gathering'
import { distance, facingOf, findFreeSpot, movePlayer, stepToward, type Point } from './core/movement'
import { AUTO_SLOT, readBackup, readSlot, writeSlot } from './core/storage'
import { ACTION_MINUTES, absoluteMinutes, addMinutes, nextMorning } from './core/time'
import type { GatheringNodeDef, NodeKind } from './data/gathering'
import { GATHERING_NODES } from './content/gathering'
import { ITEM_BY_ID, itemDef, itemName } from './content/items'
import { Camera } from './render/camera'
import { OBSTACLES, PLAYER_RADIUS, TILE, VILLAGE_WALKABLE, WORLD, drawVillage } from './render/scene'
import { createHud } from './ui/hud'
import { openSaveScreen } from './ui/saveScreen'
import { stageLabel } from './ui/labels'
import { START_VILLAGE } from './content/scene'

const PLAYER_SPEED = 135
const NODE_HOVER_RADIUS = 22
const INTERACT_RANGE = 46

/** Сколько длится сам сбор. Секунды реального времени — это усилие, а не ожидание. */
const GATHER_SECONDS: Record<NodeKind, number> = {
  herb: 1.2,
  berry: 1.6,
  branch: 1.8,
  stone: 2.6,
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
})
app.append(hud.element)

let state: GameState
let statusNote = ''
let nightNote = ''
let actionNote = ''
let showGrid = true
let hoveredId: string | null = null
let hoveredNodeId: string | null = null
let pendingNodeId: string | null = null
let pixelRatio = 1
let moveTarget: Point | null = null
let followPaused = false
let previousFrameTime = 0
let gathering: { nodeId: string; elapsed: number; duration: number } | null = null

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
    notes: [statusNote, actionNote, nightNote],
    resources: inventory.stacks.map((stack) => ({
      label: itemName(stack.id),
      value: stack.count,
    })),
    statuses: [{ label: 'Груз', value: weight, max: inventory.capacityKg }],
  })
}

/** Ночь (3.2.6). Время идёт вперёд, утром — сводка. Следы в деревне появятся с 7.16. */
function sleep(): void {
  const step = nextMorning(state.clock)
  state.clock = step.clock
  nightNote =
    step.daysPassed > 1
      ? `Ты проспал мимо ${step.daysPassed} ночей. В деревне пока тихо.`
      : 'Ночь прошла. В деревне пока тихо.'
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

function openSaves(): void {
  openSaveScreen({
    getState: () => state,
    onLoad: (loaded) => {
      state = loaded
      ensureFreePosition()
      statusNote = ''
      nightNote = ''
      moveTarget = null
      camera.centerOn(state.player.position.x, state.player.position.y)
      persist()
      updateHud()
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
  followPaused = false
  return true
}

function frame(time: number): void {
  const dt = previousFrameTime === 0 ? 0 : Math.min((time - previousFrameTime) / 1000, 0.05)
  previousFrameTime = time

  const walking = updateMovement(dt)

  if (gathering !== null) {
    gathering.elapsed += dt
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
  const hoveredNode = hoveredDef
    ? { x: hoveredDef.x, y: hoveredDef.y, label: nodeLabel(hoveredDef, now) }
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
    hoveredNode,
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

function buildingAt(worldX: number, worldY: number): string | null {
  for (const building of START_VILLAGE) {
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

function nodeAt(worldX: number, worldY: number): GatheringNodeDef | null {
  let closest: GatheringNodeDef | null = null
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
    actionNote = `${node.name}: ${describeRestore(minutesUntilReady(state.world.nodes, node.id, now))}.`
    updateHud()
    return
  }

  gathering = { nodeId: node.id, elapsed: 0, duration: GATHER_SECONDS[node.kind] }
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
    actionNote = `${node.name}: ${describeRestore(minutesUntilReady(state.world.nodes, node.id, now))}.`
    updateHud()
    return
  }

  const added = addItems(state.player.inventory, def, node.count, 1, ITEM_BY_ID)

  if (added === 0) {
    actionNote = 'Не влезло: груз переполнен.'
    updateHud()
    return
  }

  markGathered(state.world.nodes, node.id, now, node.restoreMinutes)
  state.clock = addMinutes(state.clock, ACTION_MINUTES.gather).clock

  actionNote =
    added < node.count
      ? `Собрано: ${def.name} ×${added} из ${node.count} — больше не влезло.`
      : `Собрано: ${def.name} ×${added}`

  persist()
  updateHud()
}

function updateHover(event: PointerEvent): void {
  const rect = canvas.getBoundingClientRect()
  const world = camera.toWorld(event.clientX - rect.left, event.clientY - rect.top)

  const node = nodeAt(world.x, world.y)
  hoveredNodeId = node?.id ?? null
  hoveredId = node === null ? buildingAt(world.x, world.y) : null
  canvas.style.cursor = node !== null || hoveredId !== null ? 'pointer' : 'default'
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
    const node = nodeAt(world.x, world.y)

    gathering = null

    if (node) {
      const now = absoluteMinutes(state.clock)

      if (!isReady(state.world.nodes, node.id, now)) {
        actionNote = `${node.name}: ${describeRestore(minutesUntilReady(state.world.nodes, node.id, now))}.`
        updateHud()
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
        } else if (added === 0) {
          statusNote = 'Не влезло: груз переполнен.'
        } else {
          statusNote = `Влезло только ${added} из ${count}: груз почти полон.`
        }

        persist()
        updateHud()
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
