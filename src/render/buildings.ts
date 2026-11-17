/**
 * Векторные постройки-заглушки (4.1, 4.2.3).
 *
 * Пока это ручные формы, а не параметрические модули: задача 4.1.2–4.1.4
 * делает генератор позже. Здесь важно проверить, что стиль читается.
 */

import type { BuildingKind, PlacedBuilding } from '../content/scene'
import { PALETTE } from './palette'

interface HouseStyle {
  wall: string
  roof: string
  roofDark: string
  porch?: boolean
  /** Каменный цоколь под стеной. */
  foundation?: boolean
  /** Сколько окон на фасаде. */
  windows?: number
  /** Труба с дымом. */
  chimney?: boolean
  /** Черепица: горизонтальные линии на скатах. */
  tiles?: boolean
  /** Наличники вокруг окон. */
  frames?: boolean
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save()
  ctx.fillStyle = PALETTE.shadow
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h - 2, w * 0.52, h * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  style: HouseStyle,
): void {
  drawShadow(ctx, x, y, w, h)

  const wallTop = y + h * 0.52
  const wallHeight = h * 0.48

  // Стена
  ctx.fillStyle = style.wall
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 2
  roundRect(ctx, x + w * 0.09, wallTop, w * 0.82, wallHeight, 2)
  ctx.fill()
  ctx.stroke()

  // Каменный цоколь: видно, что дом пережил не одну зиму.
  if (style.foundation === true) {
    ctx.fillStyle = '#a8a094'
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = 1.4
    roundRect(ctx, x + w * 0.09, wallTop + wallHeight - h * 0.09, w * 0.82, h * 0.09, 1)
    ctx.fill()
    ctx.stroke()

    ctx.strokeStyle = 'rgba(58, 47, 36, 0.25)'
    ctx.lineWidth = 1
    for (let row = 1; row < 2; row += 1) {
      const lineY = wallTop + wallHeight - h * 0.09 + (h * 0.09 * row) / 2
      ctx.beginPath()
      ctx.moveTo(x + w * 0.1, lineY)
      ctx.lineTo(x + w * 0.9, lineY)
      ctx.stroke()
    }
  }

  // Крыша: два ската, разделённые коньком
  const eave = wallTop + 5
  const ridgeLeft = x + w * 0.17
  const ridgeRight = x + w * 0.83
  const mid = x + w * 0.5

  ctx.fillStyle = style.roof
  ctx.beginPath()
  ctx.moveTo(x + w * 0.02, eave)
  ctx.lineTo(ridgeLeft, y)
  ctx.lineTo(mid, y)
  ctx.lineTo(mid, eave)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = style.roofDark
  ctx.beginPath()
  ctx.moveTo(mid, y)
  ctx.lineTo(ridgeRight, y)
  ctx.lineTo(x + w * 0.98, eave)
  ctx.lineTo(mid, eave)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + w * 0.02, eave)
  ctx.lineTo(ridgeLeft, y)
  ctx.lineTo(ridgeRight, y)
  ctx.lineTo(x + w * 0.98, eave)
  ctx.stroke()

  // Конёк
  ctx.strokeStyle = 'rgba(255, 246, 230, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(mid, y + 2)
  ctx.lineTo(mid, eave)
  ctx.stroke()

  // Черепица: с третьего стиля крыша перестаёт быть соломой.
  if (style.tiles === true) {
    ctx.strokeStyle = 'rgba(58, 47, 36, 0.2)'
    ctx.lineWidth = 1
    for (let row = 1; row < 4; row += 1) {
      const lineY = y + ((eave - y) * row) / 4
      ctx.beginPath()
      ctx.moveTo(mid + (row * w) / 12, lineY)
      ctx.lineTo(x + w * 0.98 - (row * w) / 20, lineY)
      ctx.moveTo(mid - (row * w) / 12, lineY)
      ctx.lineTo(x + w * 0.02 + (row * w) / 20, lineY)
      ctx.stroke()
    }
  }

  // Труба: признак того, что в доме есть печь, а не очаг по-старому.
  if (style.chimney === true) {
    ctx.fillStyle = '#8d8378'
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = 1.4
    const chimneyX = x + w * 0.66
    ctx.fillRect(chimneyX, y - h * 0.06, w * 0.08, h * 0.16)
    ctx.strokeRect(chimneyX, y - h * 0.06, w * 0.08, h * 0.16)
  }

  // Дверь
  const doorW = w * 0.15
  const doorH = wallHeight * 0.62
  ctx.fillStyle = '#5c4229'
  roundRect(ctx, x + w * 0.5 - doorW / 2, wallTop + wallHeight - doorH, doorW, doorH, 1)
  ctx.fill()

  // Окна: одно в старой избе, два — в доме, который надстраивали.
  const windows = style.windows ?? 1
  const winW = w * 0.11
  const winH = wallHeight * 0.22
  const winY = wallTop + wallHeight * 0.28
  const windowXs = windows >= 2 ? [0.22, 0.66] : [0.22]

  for (const position of windowXs) {
    const winX = x + w * position

    if (style.frames === true) {
      ctx.fillStyle = '#f2ece0'
      ctx.strokeStyle = PALETTE.ink
      ctx.lineWidth = 1.2
      ctx.fillRect(winX - 1.5, winY - 1.5, winW + 3, winH + 3)
      ctx.strokeRect(winX - 1.5, winY - 1.5, winW + 3, winH + 3)
    }

    ctx.fillStyle = 'rgba(255, 240, 200, 0.55)'
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = 1.2
    ctx.fillRect(winX, winY, winW, winH)
    ctx.strokeRect(winX, winY, winW, winH)

    // Переплёт
    ctx.beginPath()
    ctx.moveTo(winX + winW / 2, winY)
    ctx.lineTo(winX + winW / 2, winY + winH)
    ctx.moveTo(winX, winY + winH / 2)
    ctx.lineTo(winX + winW, winY + winH / 2)
    ctx.stroke()
  }

  if (style.porch === true) {
    ctx.fillStyle = PALETTE.woodDark
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = 1.5
    roundRect(ctx, x + w * 0.36, y + h - 3, w * 0.28, 5, 1)
    ctx.fill()
    ctx.stroke()
  }

  // Дым
  ctx.strokeStyle = 'rgba(90, 80, 70, 0.28)'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.72, y + 2)
  ctx.quadraticCurveTo(x + w * 0.78, y - 10, x + w * 0.7, y - 20)
  ctx.stroke()
  ctx.lineCap = 'butt'
}

function drawField(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = PALETTE.soil
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 2
  roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 3)
  ctx.fill()
  ctx.stroke()

  const rows = 4
  const gap = (h - 14) / rows
  for (let row = 0; row < rows; row += 1) {
    const rowY = y + 9 + row * gap

    // Борозда
    ctx.fillStyle = PALETTE.soilDark
    ctx.globalAlpha = 0.5
    roundRect(ctx, x + 9, rowY, w - 18, gap * 0.34, 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // Всходы
    const plants = 6
    for (let plant = 0; plant < plants; plant += 1) {
      const plantX = x + 14 + (plant * (w - 28)) / (plants - 1)
      const top = rowY + gap * 0.34

      ctx.strokeStyle = PALETTE.cropDark
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(plantX, top)
      ctx.lineTo(plantX, top - 6)
      ctx.stroke()

      ctx.fillStyle = PALETTE.crop
      ctx.beginPath()
      ctx.ellipse(plantX - 2.2, top - 6, 2.4, 1.6, -0.5, 0, Math.PI * 2)
      ctx.ellipse(plantX + 2.2, top - 7, 2.4, 1.6, 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
  const cx = x + w / 2
  const cy = y + h * 0.62
  const pulse = 0.85 + Math.sin(time / 220) * 0.12

  // Свет
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 92 * pulse)
  glow.addColorStop(0, 'rgba(240, 176, 92, 0.42)')
  glow.addColorStop(0.45, 'rgba(232, 158, 76, 0.16)')
  glow.addColorStop(1, 'rgba(232, 158, 76, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, cy, 92 * pulse, 0, Math.PI * 2)
  ctx.fill()

  // Камни
  const stoneCount = 9
  for (let i = 0; i < stoneCount; i += 1) {
    const angle = (i / stoneCount) * Math.PI * 2
    const stoneX = cx + Math.cos(angle) * 22
    const stoneY = cy + Math.sin(angle) * 11
    ctx.fillStyle = i % 2 === 0 ? PALETTE.stone : PALETTE.stoneDark
    ctx.beginPath()
    ctx.ellipse(stoneX, stoneY, 4.2, 3, angle, 0, Math.PI * 2)
    ctx.fill()
  }

  // Поленья
  ctx.strokeStyle = PALETTE.woodDark
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 9, cy + 2)
  ctx.lineTo(cx + 9, cy - 2)
  ctx.moveTo(cx - 8, cy - 3)
  ctx.lineTo(cx + 8, cy + 4)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Пламя
  const flicker = 1 + Math.sin(time / 90) * 0.16
  ctx.fillStyle = PALETTE.flame
  ctx.beginPath()
  ctx.ellipse(cx, cy - 8 * flicker, 6.5, 13 * flicker, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = PALETTE.flameCore
  ctx.beginPath()
  ctx.ellipse(cx, cy - 6 * flicker, 3, 7 * flicker, 0, 0, Math.PI * 2)
  ctx.fill()

  // Искры
  for (let i = 0; i < 3; i += 1) {
    const phase = ((time / 900 + i / 3) % 1)
    const sparkY = cy - 10 - phase * 34
    ctx.globalAlpha = (1 - phase) * 0.7
    ctx.fillStyle = PALETTE.flameCore
    ctx.beginPath()
    ctx.arc(cx + Math.sin(phase * 9 + i) * 5, sparkY, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/**
 * Стиль домов по эпохе (4.1.8).
 * 0 — старая изба, 1 — подлатанная, 2 — посад с цоколем, 3 — город.
 */
const HOUSE_STYLES: Record<
  'headman_hut' | 'workers_house',
  readonly [HouseStyle, HouseStyle, HouseStyle, HouseStyle]
> = {
  headman_hut: [
    { wall: '#6d5740', roof: PALETTE.thatch, roofDark: PALETTE.thatchDark, porch: true, windows: 1 },
    { wall: PALETTE.wood, roof: PALETTE.roofWood, roofDark: PALETTE.roofWoodDark, porch: true, windows: 1 },
    { wall: '#cdbb98', roof: '#9a6a4e', roofDark: '#7f553e', porch: true, foundation: true, windows: 2, chimney: true, tiles: true },
    { wall: '#e9e1d1', roof: '#a4543f', roofDark: '#83402f', porch: true, foundation: true, windows: 2, chimney: true, tiles: true, frames: true },
  ],
  workers_house: [
    { wall: '#5f4b36', roof: PALETTE.thatch, roofDark: PALETTE.thatchDark, windows: 1 },
    { wall: PALETTE.woodDark, roof: PALETTE.roofWood, roofDark: PALETTE.roofWoodDark, windows: 1 },
    { wall: '#bfae8c', roof: '#8f6248', roofDark: '#744e39', foundation: true, windows: 2, chimney: true, tiles: true },
    { wall: '#ded6c6', roof: '#98503c', roofDark: '#7a3d2d', foundation: true, windows: 2, chimney: true, tiles: true, frames: true },
  ],
}

/** Эпоха по id стадии: чем дальше, тем крепче стройка. */
export function stageTier(stageId: string): 0 | 1 | 2 | 3 {
  switch (stageId) {
    case 'stage_dying':
      return 0
    case 'stage_first_smoke':
    case 'stage_trade_road':
      return 1
    case 'stage_stone_belt':
    case 'stage_free_town':
      return 2
    default:
      return 3
  }
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  building: PlacedBuilding,
  tile: number,
  time: number,
  stageId = 'stage_dying',
): void {
  const x = building.x * tile
  const y = building.y * tile
  const w = building.w * tile
  const h = building.h * tile

  const tier = stageTier(stageId)

  switch (building.kind as BuildingKind) {
    case 'campfire':
      drawCampfire(ctx, x, y, w, h, time)
      break
    case 'field':
      drawField(ctx, x, y, w, h)
      break
    case 'headman_hut':
      drawHouse(ctx, x, y, w, h, HOUSE_STYLES.headman_hut[tier] ?? HOUSE_STYLES.headman_hut[0])
      break
    case 'workers_house':
      drawHouse(
        ctx,
        x,
        y,
        w,
        h,
        HOUSE_STYLES.workers_house[tier] ?? HOUSE_STYLES.workers_house[0],
      )
      break
  }
}
