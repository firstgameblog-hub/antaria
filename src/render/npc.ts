/**
 * Фигуры жителей и торговцев на сцене (5.5, 6.4).
 *
 * Пока это одна форма с разными цветами: у торговца плащ с капюшоном и посох.
 * Портреты и характеры появятся с 4.1.5.
 */

import type { Facing } from '../core/movement'

const CLOAK = '#5c5140'
const CLOAK_DARK = '#463d2f'
const SKIN = '#cfae8a'
const INK = '#2f261c'

function roundRectPath(
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

export function drawTrader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: Facing,
  time: number,
): void {
  const sway = Math.sin(time / 900) * 1.1
  const headY = y - 26 + sway

  // Тень
  ctx.fillStyle = 'rgba(58, 47, 36, 0.22)'
  ctx.beginPath()
  ctx.ellipse(x, y, 9, 3.6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Посох
  ctx.strokeStyle = '#6b4f31'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + 9, y - 2)
  ctx.lineTo(x + 11, y - 34)
  ctx.stroke()

  // Ноги
  ctx.strokeStyle = '#3b3227'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 3, y - 8)
  ctx.lineTo(x - 3, y - 1)
  ctx.moveTo(x + 3, y - 8)
  ctx.lineTo(x + 3, y - 1)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Плащ
  ctx.fillStyle = CLOAK
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.5
  roundRectPath(ctx, x - 9, headY + 8, 18, 15, 5)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = CLOAK_DARK
  roundRectPath(ctx, x - 9, headY + 16, 18, 4, 2)
  ctx.fill()

  // Голова в капюшоне
  ctx.fillStyle = CLOAK_DARK
  ctx.beginPath()
  ctx.arc(x, headY + 3, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.arc(x, headY + 5, 4.6, 0, Math.PI * 2)
  ctx.fill()

  // Лицо: видно только при взгляде не от нас
  if (facing !== 'up') {
    ctx.fillStyle = INK
    const shift = facing === 'left' ? -1.4 : facing === 'right' ? 1.4 : 0
    ctx.beginPath()
    ctx.arc(x - 1.6 + shift, headY + 4.6, 0.8, 0, Math.PI * 2)
    ctx.arc(x + 1.6 + shift, headY + 4.6, 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // Борода
  ctx.fillStyle = '#cfc3ad'
  ctx.beginPath()
  ctx.ellipse(x, headY + 8.6, 3.4, 2, 0, 0, Math.PI * 2)
  ctx.fill()
}
