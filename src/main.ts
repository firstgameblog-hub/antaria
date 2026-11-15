import './styles.css'
import { createInitialState, type GameState } from './core/state'
import { AUTO_SLOT, readBackup, readSlot, writeSlot } from './core/storage'
import { nextMorning } from './core/time'
import { START_VILLAGE } from './content/scene'
import { Camera } from './render/camera'
import { TILE, WORLD, drawVillage } from './render/scene'
import { createHud } from './ui/hud'
import { openSaveScreen } from './ui/saveScreen'
import { stageLabel } from './ui/labels'

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
let showGrid = true
let hoveredId: string | null = null
let pixelRatio = 1

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

function updateHud(): void {
  hud.update({
    clock: state.clock,
    stage: stageLabel(state.village.stageId),
    population: state.village.population,
    notes: [statusNote, nightNote],
    // Ресурсы, деньги, здоровье, усталость и погода появятся вместе со своими системами.
    resources: [],
    statuses: [],
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
      statusNote = ''
      nightNote = ''
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

function frame(time: number): void {
  const width = canvas.width / pixelRatio
  const height = canvas.height / pixelRatio

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.fillStyle = '#cdd0a4'
  ctx.fillRect(0, 0, width, height)

  ctx.translate(width / 2, height / 2)
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x, -camera.y)

  drawVillage(ctx, { time, showGrid, hoveredId })

  requestAnimationFrame(frame)
}

// Камера: колесо — масштаб, перетаскивание — сдвиг (4.2.2).
canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault()
    camera.zoomBy(event.deltaY < 0 ? 1.1 : 1 / 1.1)
  },
  { passive: false },
)

let dragging = false
let lastX = 0
let lastY = 0

canvas.addEventListener('pointerdown', (event) => {
  dragging = true
  lastX = event.clientX
  lastY = event.clientY
  canvas.setPointerCapture(event.pointerId)
  canvas.classList.add('scene--dragging')
})

canvas.addEventListener('pointermove', (event) => {
  if (dragging) {
    camera.pan(event.clientX - lastX, event.clientY - lastY)
    lastX = event.clientX
    lastY = event.clientY
    return
  }

  const rect = canvas.getBoundingClientRect()
  const world = camera.toWorld(event.clientX - rect.left, event.clientY - rect.top)

  hoveredId = null
  for (const building of START_VILLAGE) {
    const x = building.x * TILE
    const y = building.y * TILE
    const w = building.w * TILE
    const h = building.h * TILE
    if (world.x >= x && world.x <= x + w && world.y >= y - 14 && world.y <= y + h) {
      hoveredId = building.id
      break
    }
  }

  canvas.style.cursor = hoveredId === null ? 'grab' : 'pointer'
})

canvas.addEventListener('pointerleave', () => {
  hoveredId = null
  canvas.style.cursor = 'grab'
})

const endDrag = (): void => {
  dragging = false
  canvas.classList.remove('scene--dragging')
}

canvas.addEventListener('pointerup', endDrag)
canvas.addEventListener('pointercancel', endDrag)

globalThis.addEventListener('keydown', (event) => {
  if (event.key === 'g' || event.key === 'G' || event.key === 'п' || event.key === 'П') {
    showGrid = !showGrid
  }
  if (event.key === '0') {
    camera.refit()
  }
})

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
resize()
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
        persist()
        updateHud()
      },
      refitCamera: () => camera.refit(),
      toggleGrid: () => {
        showGrid = !showGrid
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
        updateHud()
        return state
      },
      reset: () => {
        state = createInitialState()
        persist()
        updateHud()
        return state
      },
      toggleGrid: () => {
        showGrid = !showGrid
        return showGrid
      },
    },
  })
}
