/**
 * Отрисовка новых построек (M2.2).
 *
 * Всё из тех же простых форм: камень, доски, ткань. Облик по стадиям
 * появится вместе с генератором (4.1.2–4.1.4).
 */

import type { StructureKind } from '../data/buildings'
import { PALETTE } from './palette'

const INK = '#3a2f24'

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

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(58, 47, 36, 0.16)'
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h - 2, w * 0.5, h * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawWell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  shadow(ctx, x, y, w, h)

  const cx = x + w / 2
  const cy = y + h * 0.72

  ctx.fillStyle = PALETTE.stone
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.42, h * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#3f3a33'
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.26, h * 0.14, 0, 0, Math.PI * 2)
  ctx.fill()

  // Стойки и крыша
  ctx.strokeStyle = PALETTE.woodDark
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.34, cy)
  ctx.lineTo(cx - w * 0.34, y + h * 0.28)
  ctx.moveTo(cx + w * 0.34, cy)
  ctx.lineTo(cx + w * 0.34, y + h * 0.28)
  ctx.stroke()

  ctx.fillStyle = PALETTE.roofWood
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.46, y + h * 0.32)
  ctx.lineTo(cx, y + h * 0.06)
  ctx.lineTo(cx + w * 0.46, y + h * 0.32)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Ворот и ведро
  ctx.strokeStyle = PALETTE.wood
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.3, y + h * 0.36)
  ctx.lineTo(cx + w * 0.3, y + h * 0.36)
  ctx.stroke()

  ctx.strokeStyle = '#8a8172'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, y + h * 0.36)
  ctx.lineTo(cx, y + h * 0.55)
  ctx.stroke()

  ctx.fillStyle = PALETTE.wood
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.2
  roundRect(ctx, cx - 4, y + h * 0.53, 8, 6, 1.5)
  ctx.fill()
  ctx.stroke()
}

function drawBarn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  shadow(ctx, x, y, w, h)

  const wallTop = y + h * 0.5

  ctx.fillStyle = '#8f6a45'
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  roundRect(ctx, x + w * 0.05, wallTop, w * 0.9, h * 0.48, 2)
  ctx.fill()
  ctx.stroke()

  // Крыша
  const eave = wallTop + 4
  ctx.fillStyle = PALETTE.roofWood
  ctx.beginPath()
  ctx.moveTo(x, eave)
  ctx.lineTo(x + w * 0.5, y + h * 0.08)
  ctx.lineTo(x + w, eave)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 246, 230, 0.28)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x + w * 0.5, y + h * 0.1)
  ctx.lineTo(x + w * 0.5, eave)
  ctx.stroke()

  // Ворота
  const doorW = w * 0.34
  ctx.fillStyle = '#5c4229'
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  roundRect(ctx, x + w * 0.5 - doorW / 2, wallTop + h * 0.06, doorW, h * 0.38, 1)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 240, 200, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x + w * 0.5, wallTop + h * 0.08)
  ctx.lineTo(x + w * 0.5, wallTop + h * 0.42)
  ctx.stroke()
}

function drawForge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
  shadow(ctx, x, y, w, h)

  const baseY = y + h * 0.86

  // Каменная основа
  ctx.fillStyle = PALETTE.stoneDark
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  roundRect(ctx, x + w * 0.08, baseY - h * 0.42, w * 0.6, h * 0.42, 3)
  ctx.fill()
  ctx.stroke()

  // Горн
  ctx.fillStyle = '#4a4038'
  roundRect(ctx, x + w * 0.16, baseY - h * 0.62, w * 0.34, h * 0.24, 2)
  ctx.fill()
  ctx.stroke()

  // Огонь
  const flicker = 1 + Math.sin(time / 130) * 0.2
  ctx.fillStyle = '#e08a3c'
  ctx.beginPath()
  ctx.ellipse(x + w * 0.33, baseY - h * 0.6, 5, 6 * flicker, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(240, 176, 92, 0.25)'
  ctx.beginPath()
  ctx.ellipse(x + w * 0.33, baseY - h * 0.6, 18, 14, 0, 0, Math.PI * 2)
  ctx.fill()

  // Труба
  ctx.fillStyle = PALETTE.stone
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  roundRect(ctx, x + w * 0.58, y + h * 0.12, w * 0.14, h * 0.46, 1)
  ctx.fill()
  ctx.stroke()

  // Наковальня
  ctx.fillStyle = '#4b4b4f'
  ctx.strokeStyle = INK
  ctx.beginPath()
  ctx.rect(x + w * 0.72, baseY - h * 0.16, w * 0.18, h * 0.1)
  ctx.fill()
  ctx.stroke()
}

function drawStall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  shadow(ctx, x, y, w, h)

  const postTop = y + h * 0.3

  // Столбы
  ctx.strokeStyle = PALETTE.woodDark
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x + w * 0.08, y + h * 0.9)
  ctx.lineTo(x + w * 0.08, postTop)
  ctx.moveTo(x + w * 0.92, y + h * 0.9)
  ctx.lineTo(x + w * 0.92, postTop)
  ctx.stroke()

  // Навес в полоску
  const stripes = 6
  for (let index = 0; index < stripes; index += 1) {
    const stripeWidth = (w * 0.94) / stripes
    ctx.fillStyle = index % 2 === 0 ? '#b96f5a' : '#e0cbb0'
    ctx.fillRect(x + w * 0.03 + index * stripeWidth, y + h * 0.12, stripeWidth, h * 0.22)
  }

  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  ctx.strokeRect(x + w * 0.03, y + h * 0.12, w * 0.94, h * 0.22)

  // Прилавок
  ctx.fillStyle = PALETTE.wood
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  roundRect(ctx, x + w * 0.12, y + h * 0.6, w * 0.76, h * 0.16, 2)
  ctx.fill()
  ctx.stroke()

  // Товар
  ctx.fillStyle = '#c9a36a'
  ctx.beginPath()
  ctx.arc(x + w * 0.3, y + h * 0.58, 3, 0, Math.PI * 2)
  ctx.arc(x + w * 0.42, y + h * 0.58, 2.4, 0, Math.PI * 2)
  ctx.fill()
}

/** Сторожевая башня: каменное основание, деревянный верх, флаг. */
function drawTower(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  shadow(ctx, x, y, w, h)

  const cx = x + w / 2
  const baseTop = y + h * 0.42

  ctx.fillStyle = PALETTE.stone
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  roundRect(ctx, x + w * 0.22, baseTop, w * 0.56, h * 0.5, 2)
  ctx.fill()
  ctx.stroke()

  // Кладка
  ctx.strokeStyle = 'rgba(58, 47, 36, 0.25)'
  ctx.lineWidth = 1
  for (let row = 1; row < 4; row += 1) {
    const lineY = baseTop + (h * 0.5 * row) / 4
    ctx.beginPath()
    ctx.moveTo(x + w * 0.24, lineY)
    ctx.lineTo(x + w * 0.76, lineY)
    ctx.stroke()
  }

  // Верхняя площадка
  ctx.fillStyle = PALETTE.wood
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.8
  roundRect(ctx, x + w * 0.12, y + h * 0.26, w * 0.76, h * 0.18, 2)
  ctx.fill()
  ctx.stroke()

  // Крыша
  ctx.fillStyle = PALETTE.roofWood
  ctx.beginPath()
  ctx.moveTo(x + w * 0.05, y + h * 0.28)
  ctx.lineTo(cx, y + h * 0.04)
  ctx.lineTo(x + w * 0.95, y + h * 0.28)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Флаг
  ctx.strokeStyle = '#6b4f31'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx, y + h * 0.04)
  ctx.lineTo(cx, y - h * 0.12)
  ctx.stroke()

  ctx.fillStyle = '#a8503f'
  ctx.beginPath()
  ctx.moveTo(cx, y - h * 0.12)
  ctx.lineTo(cx + w * 0.22, y - h * 0.06)
  ctx.lineTo(cx, y)
  ctx.closePath()
  ctx.fill()
}

export function drawStructure(
  ctx: CanvasRenderingContext2D,
  kind: StructureKind,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
): void {
  switch (kind) {
    case 'well':
      drawWell(ctx, x, y, w, h)
      break
    case 'barn':
      drawBarn(ctx, x, y, w, h)
      break
    case 'forge':
      drawForge(ctx, x, y, w, h, time)
      break
    case 'stall':
      drawStall(ctx, x, y, w, h)
      break
    case 'tower':
      drawTower(ctx, x, y, w, h)
      break
  }
}

/** Пустой участок: пунктир и крест, чтобы было видно, куда можно строить. */
export function drawPlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(138, 90, 43, 0.35)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([7, 6])
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6)
  ctx.setLineDash([])

  ctx.strokeStyle = 'rgba(138, 90, 43, 0.22)'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.4, y + h * 0.35)
  ctx.lineTo(x + w * 0.6, y + h * 0.65)
  ctx.moveTo(x + w * 0.6, y + h * 0.35)
  ctx.lineTo(x + w * 0.4, y + h * 0.65)
  ctx.stroke()
  ctx.restore()
}
