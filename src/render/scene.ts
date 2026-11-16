/**
 * Сцена деревни (4.2.1, 4.2.3): земля, дорожки, частокол, постройки по глубине.
 * Рисует в мировых координатах; камера ставится снаружи.
 */

import { SCENE_TILES, START_VILLAGE, VILLAGE_PROPS, type PlacedProp } from '../content/scene'
import { STRUCTURES } from '../content/buildings'
import { drawPlot, drawStructure } from './structures'
import type { NodeKind } from '../data/gathering'
import type { Facing, Point, Rect } from '../core/movement'
import { drawBuilding } from './buildings'
import { drawGatheringNode, drawTracks } from './nodes'
import { drawTrader, drawVillager } from './npc'
import { PALETTE } from './palette'
import { drawPlayer } from './player'

export const TILE = 32

export const WORLD = {
  x: 0,
  y: 0,
  w: SCENE_TILES.w * TILE,
  h: SCENE_TILES.h * TILE,
} as const

export const VILLAGE_BOUNDS = {
  x: 52,
  y: 60,
  w: WORLD.w - 104,
  h: WORLD.h - 120,
} as const

/** Радиус героя для столкновений. */
export const PLAYER_RADIUS = 9

/** Куда герой может зайти: внутри частокола, с отступом от кольев. */
export const VILLAGE_WALKABLE: Rect = {
  x: VILLAGE_BOUNDS.x + 26,
  y: VILLAGE_BOUNDS.y + 32,
  w: VILLAGE_BOUNDS.w - 52,
  h: VILLAGE_BOUNDS.h - 66,
}

/** Постройки и поля, сквозь которые не пройти. Поле обнесено изгородью — заходить туда нечего. */
export const OBSTACLES: readonly Rect[] = [
  ...START_VILLAGE.map((building) => ({
    x: building.x * TILE,
    y: building.y * TILE,
    w: building.w * TILE,
    h: building.h * TILE,
  })),
  ...VILLAGE_PROPS.map((prop) => {
    const width = prop.w * TILE
    const height = prop.h * TILE
    const insetX = width * 0.15
    const insetY = height * 0.15
    return {
      x: prop.x * TILE + insetX,
      y: prop.y * TILE + insetY,
      w: width - insetX * 2,
      h: height - insetY * 2,
    }
  }),
]

interface Tuft {
  x: number
  y: number
  scale: number
  tilt: number
  dark: boolean
}

interface Tree {
  x: number
  y: number
  scale: number
  shade: boolean
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TUFTS: readonly Tuft[] = (() => {
  const random = mulberry32(20261115)
  const tufts: Tuft[] = []
  for (let i = 0; i < 1100; i += 1) {
    tufts.push({
      x: random() * WORLD.w,
      y: random() * WORLD.h,
      scale: 0.5 + random() * 0.8,
      tilt: (random() - 0.5) * 0.7,
      dark: random() > 0.5,
    })
  }
  return tufts
})()

const TREES: readonly Tree[] = (() => {
  const random = mulberry32(9031)
  const trees: Tree[] = []
  const isInsideVillage = (x: number, y: number): boolean =>
    x > VILLAGE_BOUNDS.x - 40 &&
    x < VILLAGE_BOUNDS.x + VILLAGE_BOUNDS.w + 40 &&
    y > VILLAGE_BOUNDS.y - 40 &&
    y < VILLAGE_BOUNDS.y + VILLAGE_BOUNDS.h + 40

  for (let i = 0; i < 220 && trees.length < 26; i += 1) {
    const x = random() * WORLD.w
    const y = random() * WORLD.h
    if (isInsideVillage(x, y)) continue
    trees.push({ x, y, scale: 0.8 + random() * 0.6, shade: random() > 0.5 })
  }
  return trees
})()

function drawGround(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.grass
  ctx.fillRect(WORLD.x, WORLD.y, WORLD.w, WORLD.h)

  const random = mulberry32(777)
  ctx.globalAlpha = 0.22
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = random() > 0.5 ? PALETTE.grassDark : PALETTE.grassLight
    const cx = random() * WORLD.w
    const cy = random() * WORLD.h
    ctx.beginPath()
    ctx.ellipse(cx, cy, 14 + random() * 34, 9 + random() * 20, random() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  for (const tuft of TUFTS) {
    ctx.strokeStyle = tuft.dark ? PALETTE.grassDark : PALETTE.grassLight
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.moveTo(tuft.x, tuft.y)
    ctx.lineTo(tuft.x + tuft.tilt * 4 * tuft.scale, tuft.y - 5 * tuft.scale)
    ctx.moveTo(tuft.x + 2, tuft.y)
    ctx.lineTo(tuft.x + 2 - tuft.tilt * 3 * tuft.scale, tuft.y - 4 * tuft.scale)
    ctx.stroke()
  }
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(58, 47, 36, 0.05)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= WORLD.w; x += TILE) {
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, WORLD.h)
  }
  for (let y = 0; y <= WORLD.h; y += TILE) {
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(WORLD.w, y + 0.5)
  }
  ctx.stroke()
}

/** Затемняет всё за частоколом: деревня читается как огороженное место, а не как поляна. */
function drawOutsideShade(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(WORLD.x, WORLD.y, WORLD.w, WORLD.h)
  ctx.rect(VILLAGE_BOUNDS.x, VILLAGE_BOUNDS.y, VILLAGE_BOUNDS.w, VILLAGE_BOUNDS.h)
  ctx.fillStyle = 'rgba(64, 62, 40, 0.16)'
  ctx.fill('evenodd')
  ctx.restore()
}

function drawTree(ctx: CanvasRenderingContext2D, tree: Tree): void {
  const r = 16 * tree.scale
  const trunkH = 10 * tree.scale

  ctx.fillStyle = 'rgba(58, 47, 36, 0.15)'
  ctx.beginPath()
  ctx.ellipse(tree.x, tree.y + 2, r * 0.9, r * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = PALETTE.woodDark
  ctx.fillRect(tree.x - 1.6 * tree.scale, tree.y - trunkH, 3.2 * tree.scale, trunkH)

  const canopy = tree.shade ? '#8f9a5e' : '#9aa66a'
  ctx.fillStyle = canopy
  ctx.beginPath()
  ctx.arc(tree.x, tree.y - trunkH - r * 0.55, r, 0, Math.PI * 2)
  ctx.arc(tree.x - r * 0.7, tree.y - trunkH - r * 0.2, r * 0.75, 0, Math.PI * 2)
  ctx.arc(tree.x + r * 0.7, tree.y - trunkH - r * 0.25, r * 0.7, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.beginPath()
  ctx.arc(tree.x - r * 0.25, tree.y - trunkH - r * 0.85, r * 0.45, 0, Math.PI * 2)
  ctx.fill()
}

function sampleQuadratic(
  fromX: number,
  fromY: number,
  controlX: number,
  controlY: number,
  toX: number,
  toY: number,
  steps: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const inv = 1 - t
    points.push({
      x: inv * inv * fromX + 2 * inv * t * controlX + t * t * toX,
      y: inv * inv * fromY + 2 * inv * t * controlY + t * t * toY,
    })
  }
  return points
}

function drawPaths(ctx: CanvasRenderingContext2D): void {
  const fire = START_VILLAGE.find((building) => building.kind === 'campfire')
  if (!fire) return

  const fireX = (fire.x + fire.w / 2) * TILE
  const fireY = (fire.y + fire.h / 2) * TILE
  const random = mulberry32(515)

  for (const building of START_VILLAGE) {
    if (building.kind === 'campfire' || building.kind === 'field') continue

    const targetX = (building.x + building.w / 2) * TILE
    const targetY = (building.y + building.h) * TILE
    const controlX = (fireX + targetX) / 2 + (random() - 0.5) * 30
    const controlY = fireY + (targetY - fireY) * 0.45

    const points = sampleQuadratic(fireX, fireY, controlX, controlY, targetX, targetY, 18)

    // Утоптанная земля: несколько слоёв с неровным краем
    for (const [width, color, alpha] of [
      [26, PALETTE.dirtDark, 0.35],
      [19, PALETTE.dirt, 0.85],
      [11, PALETTE.dirtLight, 0.5],
    ] as const) {
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Камешки и вытоптанные пятна по краям
    ctx.fillStyle = PALETTE.dirtDark
    ctx.globalAlpha = 0.35
    for (let i = 0; i < 22; i += 1) {
      const point = points[Math.floor(random() * points.length)]
      if (!point) continue
      const offsetX = (random() - 0.5) * 24
      const offsetY = (random() - 0.5) * 14
      ctx.beginPath()
      ctx.ellipse(point.x + offsetX, point.y + offsetY, 2 + random() * 3, 1.4 + random() * 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  ctx.lineCap = 'butt'
}

/** Дорога из деревни на юг, через пролом в частоколе. */
function drawSouthRoad(ctx: CanvasRenderingContext2D): void {
  const centerX = WORLD.w / 2
  const top = (16 + 2) * TILE
  const bottom = WORLD.h

  ctx.strokeStyle = PALETTE.dirt
  ctx.lineWidth = 30
  ctx.lineCap = 'butt'
  ctx.beginPath()
  ctx.moveTo(centerX, top)
  ctx.lineTo(centerX + 14, bottom)
  ctx.stroke()

  ctx.strokeStyle = PALETTE.dirtDark
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 32
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** Сгнивший частокол: плотные колья с проломами и покосившимися кольями. */
function drawPalisade(ctx: CanvasRenderingContext2D, solid: boolean): void {
  const random = mulberry32(solid ? 9091 : 4242)
  const step = solid ? 9 : 11

  const post = (x: number, y: number, verticalWall: boolean): void => {
    const scale = 0.85 + random() * 0.5
    const lean = (random() - 0.5) * 0.45
    const height = 26 * scale
    const width = 7 * scale

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(verticalWall ? lean * 0.5 : lean)

    ctx.fillStyle = random() > 0.55 ? PALETTE.wood : PALETTE.woodDark
    ctx.strokeStyle = 'rgba(58, 47, 36, 0.55)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-width / 2, 0)
    ctx.lineTo(-width / 2, -height + width * 0.6)
    ctx.lineTo(0, -height)
    ctx.lineTo(width / 2, -height + width * 0.6)
    ctx.lineTo(width / 2, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }

  const { x: left, y: top, w, h } = VILLAGE_BOUNDS
  const right = left + w
  const bottom = top + h

  // Тень под стеной
  ctx.strokeStyle = 'rgba(58, 47, 36, 0.12)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(left, top + 4)
  ctx.lineTo(right, top + 4)
  ctx.moveTo(left, bottom)
  ctx.lineTo(right, bottom)
  ctx.stroke()

  for (let x = left; x <= right; x += step) {
    if (random() > (solid ? 0.03 : 0.1)) post(x, top + 2, false)
    const inGate = Math.abs(x - WORLD.w / 2) < 58
    if (!inGate && random() > (solid ? 0.05 : 0.18)) post(x, bottom, false)
  }
  for (let y = top; y <= bottom; y += step) {
    if (random() > (solid ? 0.04 : 0.16)) post(left, y, true)
    if (random() > (solid ? 0.04 : 0.16)) post(right, y, true)
  }
}

function drawFieldFence(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.strokeStyle = PALETTE.woodDark
  ctx.lineWidth = 2
  ctx.fillStyle = PALETTE.wood

  const step = 22
  for (let px = x + 6; px <= x + w - 6; px += step) {
    ctx.beginPath()
    ctx.moveTo(px, y + 6)
    ctx.lineTo(px, y - 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(px, y + h + 2)
    ctx.lineTo(px, y + h + 9)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.moveTo(x + 6, y + 1)
  ctx.lineTo(x + w - 6, y + 1)
  ctx.moveTo(x + 6, y + h + 7)
  ctx.lineTo(x + w - 6, y + h + 7)
  ctx.stroke()
}

function drawBarrel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const cx = x + w / 2
  const cy = y + h * 0.62
  const rx = w * 0.44
  const ry = h * 0.34

  ctx.fillStyle = PALETTE.wood
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = PALETTE.woodDark
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.ellipse(cx, cy - ry * 0.45, rx, ry * 0.5, 0, 0, Math.PI * 2)
  ctx.ellipse(cx, cy + ry * 0.45, rx, ry * 0.5, 0, 0, Math.PI * 2)
  ctx.stroke()
}

function drawLogSeat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const horizontal = w >= h

  ctx.fillStyle = PALETTE.woodDark
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 1.4

  if (horizontal) {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = PALETTE.thatchDark
    ctx.beginPath()
    ctx.ellipse(x + w, y + h / 2, Math.max(1.6, h * 0.34), h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = PALETTE.thatchDark
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h, w / 2, Math.max(1.6, w * 0.34), 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

function drawWoodpile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const radius = Math.min(w / 4.4, h / 3.4)
  const baseX = x + w / 2 - radius * 2.4
  const baseY = y + h - radius

  for (let row = 0; row < 3; row += 1) {
    const count = 4 - row
    for (let index = 0; index < count; index += 1) {
      const cx = baseX + index * radius * 2.05 + row * radius * 1.02
      const cy = baseY - row * radius * 1.75

      ctx.fillStyle = row % 2 === 0 ? PALETTE.wood : PALETTE.woodDark
      ctx.strokeStyle = PALETTE.ink
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = PALETTE.thatchDark
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawProp(ctx: CanvasRenderingContext2D, prop: PlacedProp, tile: number): void {
  const x = prop.x * tile
  const y = prop.y * tile
  const w = prop.w * tile
  const h = prop.h * tile

  switch (prop.kind) {
    case 'woodpile':
      drawWoodpile(ctx, x, y, w, h)
      break
    case 'barrel':
      drawBarrel(ctx, x, y, w, h)
      break
    case 'log_seat':
      drawLogSeat(ctx, x, y, w, h)
      break
  }
}

/** Утоптанное место у костра и изгороди вокруг полей: земляной слой, не мешают ходить. */
function drawGroundProps(ctx: CanvasRenderingContext2D): void {
  const fire = START_VILLAGE.find((building) => building.kind === 'campfire')
  if (fire) {
    const fireX = (fire.x + fire.w / 2) * TILE
    const fireY = (fire.y + fire.h / 2) * TILE

    ctx.fillStyle = PALETTE.dirtDark
    ctx.globalAlpha = 0.22
    ctx.beginPath()
    ctx.ellipse(fireX, fireY + 6, 58, 26, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const building of START_VILLAGE) {
    if (building.kind !== 'field') continue
    drawFieldFence(
      ctx,
      building.x * TILE,
      building.y * TILE,
      building.w * TILE,
      building.h * TILE,
    )
  }
}

export interface ScenePlayer {
  x: number
  y: number
  facing: Facing
  moving: boolean
}

export interface SceneNode {
  id: string
  kind: NodeKind
  x: number
  y: number
  ready: boolean
}

export interface SceneNpc {
  id: string
  x: number
  y: number
  facing: Facing
  kind: 'trader' | 'villager'
}

export interface SceneDrip {
  x: number
  y: number
}

export interface SceneSpot {
  id: string
  x: number
  y: number
  ready: boolean
}

export function buildObstacles(built: readonly string[]): Rect[] {
  const extra = STRUCTURES.filter((structure) => built.includes(structure.id)).map((structure) => ({
    x: structure.x * TILE,
    y: structure.y * TILE,
    w: structure.w * TILE,
    h: structure.h * TILE,
  }))

  return [...OBSTACLES, ...extra]
}

export interface SceneOptions {
  time: number
  showGrid: boolean
  hoveredId: string | null
  player: ScenePlayer | null
  moveTarget: Point | null
  nodes: readonly SceneNode[]
  npcs: readonly SceneNpc[]
  spots: readonly SceneSpot[]
  drips: readonly SceneDrip[]
  nearby: readonly Point[]
  stageId: string
  buildings: readonly string[]
  hoveredLabel: { x: number; y: number; label: string } | null
  gatherProgress: { x: number; y: number; value: number } | null
}

function drawGatherProgress(
  ctx: CanvasRenderingContext2D,
  progress: { x: number; y: number; value: number },
): void {
  const radius = 12
  const centerY = progress.y - 30

  ctx.save()
  ctx.lineWidth = 3
  ctx.lineCap = 'round'

  ctx.strokeStyle = 'rgba(58, 47, 36, 0.22)'
  ctx.beginPath()
  ctx.arc(progress.x, centerY, radius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#8a5a2b'
  ctx.beginPath()
  ctx.arc(
    progress.x,
    centerY,
    radius,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * Math.min(1, Math.max(0, progress.value)),
  )
  ctx.stroke()

  ctx.restore()
}

interface SceneDrawable {
  baseY: number
  bounds: Rect
  draw: () => void
}

function intersects(first: Rect, second: Rect): boolean {
  return (
    first.x < second.x + second.w &&
    first.x + first.w > second.x &&
    first.y < second.y + second.h &&
    first.y + first.h > second.y
  )
}

/** Лужа под протекающей крышей: видно беду, без всяких значков. */
function drawDrip(ctx: CanvasRenderingContext2D, drip: SceneDrip, time: number): void {
  const ripple = (time / 1300) % 1
  const fall = (time / 900) % 1

  ctx.save()

  ctx.fillStyle = 'rgba(96, 116, 126, 0.32)'
  ctx.beginPath()
  ctx.ellipse(drip.x, drip.y, 16, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `rgba(126, 148, 158, ${0.4 * (1 - ripple)})`
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.ellipse(drip.x, drip.y, 6 + ripple * 11, 2.2 + ripple * 4, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = 'rgba(152, 182, 192, 0.6)'
  ctx.beginPath()
  ctx.ellipse(drip.x, drip.y - 28 + fall * 28, 1.3, 2.4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/** Мягкое свечение у того, что можно тронуть: подсказка без значков. */
function drawNearby(ctx: CanvasRenderingContext2D, point: Point, time: number): void {
  const pulse = 0.55 + Math.sin(time / 420) * 0.2
  const centerY = point.y - 6

  const glow = ctx.createRadialGradient(point.x, centerY, 2, point.x, centerY, 30)
  glow.addColorStop(0, `rgba(255, 238, 200, ${0.3 * pulse})`)
  glow.addColorStop(0.6, `rgba(255, 238, 200, ${0.1 * pulse})`)
  glow.addColorStop(1, 'rgba(255, 238, 200, 0)')

  ctx.save()
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(point.x, centerY, 30, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `rgba(196, 140, 70, ${0.5 * pulse})`
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.ellipse(point.x, point.y, 16, 6.5, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawMoveTarget(ctx: CanvasRenderingContext2D, point: Point, time: number): void {  const pulse = 0.6 + Math.sin(time / 260) * 0.2
  ctx.save()
  ctx.strokeStyle = `rgba(138, 90, 43, ${0.55 * pulse + 0.2})`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(point.x, point.y, 11, 5.5, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(point.x, point.y, 4, 2, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawHover(ctx: CanvasRenderingContext2D, building: (typeof START_VILLAGE)[number]): void {
  const x = building.x * TILE
  const y = building.y * TILE
  const w = building.w * TILE
  const h = building.h * TILE

  ctx.save()
  ctx.strokeStyle = 'rgba(138, 90, 43, 0.85)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 5])
  ctx.strokeRect(x - 3, y - 3, w + 6, h + 6)
  ctx.setLineDash([])
  ctx.restore()

  drawLabel(ctx, building.label, x + w / 2, y - 30)
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, centerX: number, topY: number): void {
  ctx.save()
  ctx.font = '13px Georgia, serif'
  const textWidth = ctx.measureText(text).width
  const boxX = centerX - textWidth / 2 - 8

  ctx.fillStyle = 'rgba(239, 230, 214, 0.95)'
  ctx.strokeStyle = 'rgba(58, 47, 36, 0.35)'
  ctx.lineWidth = 1
  ctx.fillRect(boxX, topY, textWidth + 16, 21)
  ctx.strokeRect(boxX, topY, textWidth + 16, 21)

  ctx.fillStyle = '#2b2118'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, boxX + 8, topY + 11)
  ctx.restore()
}

export function drawVillage(ctx: CanvasRenderingContext2D, options: SceneOptions): void {
  drawGround(ctx)
  if (options.showGrid) drawGrid(ctx)
  drawPaths(ctx)
  drawSouthRoad(ctx)
  drawOutsideShade(ctx)

  // Деревья за частоколом — до построек, они дальше от зрителя
  for (const tree of TREES) {
    drawTree(ctx, tree)
  }

  drawGroundProps(ctx)
  drawPalisade(ctx, options.stageId !== 'stage_dying')

  for (const drip of options.drips) {
    drawDrip(ctx, drip, options.time)
  }

  for (const point of options.nearby) {
    drawNearby(ctx, point, options.time)
  }

  // Пустые участки под будущие постройки — на земле, без глубины.
  for (const structure of STRUCTURES) {
    if (options.buildings.includes(structure.id)) continue
    drawPlot(
      ctx,
      structure.x * TILE,
      structure.y * TILE,
      structure.w * TILE,
      structure.h * TILE,
    )
  }

  // Поля — плоская земля: рисуются всегда под всем, иначе герой «проваливается» под них
  for (const building of START_VILLAGE) {
    if (building.kind === 'field') {
      drawBuilding(ctx, building, TILE, options.time)
    }
  }

  if (options.moveTarget) drawMoveTarget(ctx, options.moveTarget, options.time)

  const drawables: SceneDrawable[] = START_VILLAGE.filter(
    (building) => building.kind !== 'field',
  ).map((building) => ({
    baseY: (building.y + building.h) * TILE,
    bounds: {
      x: building.x * TILE,
      y: building.y * TILE,
      w: building.w * TILE,
      h: building.h * TILE,
    },
    draw: () => {
      drawBuilding(ctx, building, TILE, options.time)
    },
  }))

  for (const prop of VILLAGE_PROPS) {
    drawables.push({
      baseY: (prop.y + prop.h) * TILE,
      bounds: {
        x: prop.x * TILE,
        y: prop.y * TILE,
        w: prop.w * TILE,
        h: prop.h * TILE,
      },
      draw: () => {
        drawProp(ctx, prop, TILE)
      },
    })
  }

  for (const node of options.nodes) {
    drawables.push({
      baseY: node.y,
      bounds: { x: node.x - 14, y: node.y - 18, w: 28, h: 20 },
      draw: () => {
        drawGatheringNode(ctx, node.kind, node.x, node.y, node.ready)
      },
    })
  }

  for (const npc of options.npcs) {
    drawables.push({
      baseY: npc.y,
      bounds: { x: npc.x - 10, y: npc.y - 32, w: 20, h: 32 },
      draw: () => {
        if (npc.kind === 'villager') {
          drawVillager(ctx, npc.x, npc.y, npc.facing, options.time)
        } else {
          drawTrader(ctx, npc.x, npc.y, npc.facing, options.time)
        }
      },
    })
  }

  for (const spot of options.spots) {
    drawables.push({
      baseY: spot.y,
      bounds: { x: spot.x - 18, y: spot.y - 10, w: 36, h: 14 },
      draw: () => {
        drawTracks(ctx, spot.x, spot.y, spot.ready)
      },
    })
  }

  for (const structure of STRUCTURES) {
    if (!options.buildings.includes(structure.id)) continue

    drawables.push({
      baseY: (structure.y + structure.h) * TILE,
      bounds: {
        x: structure.x * TILE,
        y: structure.y * TILE,
        w: structure.w * TILE,
        h: structure.h * TILE,
      },
      draw: () => {
        drawStructure(
          ctx,
          structure.kind,
          structure.x * TILE,
          structure.y * TILE,
          structure.w * TILE,
          structure.h * TILE,
          options.time,
        )
      },
    })
  }

  const player = options.player
  const playerBounds: Rect | null = player
    ? { x: player.x - 8, y: player.y - 32, w: 16, h: 32 }
    : null

  if (player) {
    drawables.push({
      baseY: player.y,
      bounds: playerBounds ?? { x: player.x - 8, y: player.y - 32, w: 16, h: 32 },
      draw: () => {
        drawPlayer(ctx, player.x, player.y, player.facing, options.time, player.moving)
      },
    })
  }

  drawables.sort((first, second) => first.baseY - second.baseY)
  for (const drawable of drawables) drawable.draw()

  // Если герой закрыт высоким предметом или домом — показываем силуэт поверх.
  if (player && playerBounds) {
    const occluded = drawables.some(
      (drawable) => drawable.baseY > player.y && intersects(drawable.bounds, playerBounds),
    )

    if (occluded) {
      ctx.save()
      ctx.globalAlpha = 0.5
      drawPlayer(ctx, player.x, player.y, player.facing, options.time, player.moving)
      ctx.restore()
    }
  }

  if (options.hoveredId !== null) {
    const hovered = START_VILLAGE.find((building) => building.id === options.hoveredId)
    if (hovered) drawHover(ctx, hovered)
  }

  const hoveredLabel = options.hoveredLabel
  if (hoveredLabel) {
    ctx.save()
    ctx.strokeStyle = 'rgba(138, 90, 43, 0.85)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.ellipse(hoveredLabel.x, hoveredLabel.y, 18, 8, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    drawLabel(ctx, hoveredLabel.label, hoveredLabel.x, hoveredLabel.y - 38)
  }

  if (options.gatherProgress) drawGatherProgress(ctx, options.gatherProgress)
}
