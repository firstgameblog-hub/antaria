/**
 * Сцена деревни (4.2.1, 4.2.3): земля, дорожки, частокол, постройки по глубине.
 * Рисует в мировых координатах; камера ставится снаружи.
 */

import { SCENE_TILES, START_VILLAGE } from '../content/scene'
import { drawBuilding } from './buildings'
import { PALETTE } from './palette'

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
function drawPalisade(ctx: CanvasRenderingContext2D): void {
  const random = mulberry32(4242)
  const step = 11

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
    if (random() > 0.1) post(x, top + 2, false)
    const inGate = Math.abs(x - WORLD.w / 2) < 58
    if (!inGate && random() > 0.18) post(x, bottom, false)
  }
  for (let y = top; y <= bottom; y += step) {
    if (random() > 0.16) post(left, y, true)
    if (random() > 0.16) post(right, y, true)
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

function drawBarrel(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = PALETTE.wood
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.ellipse(x, y, 7, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = PALETTE.woodDark
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.ellipse(x, y - 3, 7, 3.4, 0, 0, Math.PI * 2)
  ctx.ellipse(x, y + 3, 7, 3.4, 0, 0, Math.PI * 2)
  ctx.stroke()
}

function drawLogSeat(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  ctx.fillStyle = PALETTE.woodDark
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.rect(-16, -5, 32, 10)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = PALETTE.thatchDark
  ctx.beginPath()
  ctx.ellipse(16, 0, 3.4, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

function drawWoodpile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const radius = 5
  for (let row = 0; row < 3; row += 1) {
    const count = 4 - row
    for (let i = 0; i < count; i += 1) {
      const cx = x + i * (radius * 1.9) + row * radius * 0.95
      const cy = y - row * radius * 1.7

      ctx.fillStyle = row % 2 === 0 ? PALETTE.wood : PALETTE.woodDark
      ctx.strokeStyle = PALETTE.ink
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = PALETTE.thatchDark
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** Дворовые мелочи: утоптанное место у костра, брёвна-скамьи, поленница, бочки. */
function drawProps(ctx: CanvasRenderingContext2D): void {
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

    drawLogSeat(ctx, fireX - 44, fireY + 8, 0.1)
    drawLogSeat(ctx, fireX + 44, fireY + 8, -0.12)
    drawLogSeat(ctx, fireX, fireY + 34, Math.PI / 2)
  }

  for (const building of START_VILLAGE) {
    if (building.kind === 'field') {
      drawFieldFence(
        ctx,
        building.x * TILE,
        building.y * TILE,
        building.w * TILE,
        building.h * TILE,
      )
    }
  }

  drawWoodpile(ctx, 14.2 * TILE, 17.6 * TILE)
  drawBarrel(ctx, 16.2 * TILE, 9.4 * TILE)
  drawBarrel(ctx, 16.9 * TILE, 9.9 * TILE)
  drawBarrel(ctx, 31.4 * TILE, 16.8 * TILE)
}

export interface SceneOptions {
  time: number
  showGrid: boolean
  hoveredId: string | null
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

  const label = building.label
  ctx.font = '13px Georgia, serif'
  const textWidth = ctx.measureText(label).width
  const boxX = x + w / 2 - textWidth / 2 - 8
  const boxY = y - 30

  ctx.fillStyle = 'rgba(239, 230, 214, 0.95)'
  ctx.strokeStyle = 'rgba(58, 47, 36, 0.35)'
  ctx.lineWidth = 1
  ctx.fillRect(boxX, boxY, textWidth + 16, 21)
  ctx.strokeRect(boxX, boxY, textWidth + 16, 21)

  ctx.fillStyle = '#2b2118'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, boxX + 8, boxY + 11)
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

  drawProps(ctx)
  drawPalisade(ctx)

  const ordered = [...START_VILLAGE].sort(
    (first, second) => first.y + first.h - (second.y + second.h),
  )

  for (const building of ordered) {
    drawBuilding(ctx, building, TILE, options.time)
  }

  if (options.hoveredId !== null) {
    const hovered = ordered.find((building) => building.id === options.hoveredId)
    if (hovered) drawHover(ctx, hovered)
  }
}
