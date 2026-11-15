/**
 * Герой на сцене (5.2). Простая векторная фигура: силуэт, тень, лёгкое
 * покачивание при ходьбе. Лицо и одежда уточняются, когда появится 4.1.5.
 */

import type { Facing } from '../core/movement'

const SKIN = '#d8b08c'
const HAIR = '#4a3728'
const TUNIC = '#8a6f4e'
const BELT = '#5c4229'
const INK = '#3a2f24'

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

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: Facing,
  time: number,
  moving: boolean,
): void {
  const bob = moving ? Math.sin(time / 110) * 1.4 : 0
  const headY = y - 24 + bob

  // Тень
  ctx.fillStyle = 'rgba(58, 47, 36, 0.22)'
  ctx.beginPath()
  ctx.ellipse(x, y, 8, 3.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ноги
  ctx.strokeStyle = '#4b3a2a'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  const stride = moving ? Math.sin(time / 110) * 2 : 0
  ctx.beginPath()
  ctx.moveTo(x - 3, y - 8)
  ctx.lineTo(x - 3 + stride, y - 1)
  ctx.moveTo(x + 3, y - 8)
  ctx.lineTo(x + 3 - stride, y - 1)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Рубаха
  ctx.fillStyle = TUNIC
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.5
  roundRectPath(ctx, x - 7, headY + 9, 14, 13, 4)
  ctx.fill()
  ctx.stroke()

  // Пояс
  ctx.strokeStyle = BELT
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - 6.5, headY + 17)
  ctx.lineTo(x + 6.5, headY + 17)
  ctx.stroke()

  // Голова
  ctx.fillStyle = SKIN
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(x, headY + 4, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Волосы и лицо зависят от направления
  ctx.fillStyle = HAIR
  ctx.beginPath()
  if (facing === 'up') {
    ctx.arc(x, headY + 4, 6, 0, Math.PI * 2)
  } else if (facing === 'left') {
    ctx.arc(x + 1.5, headY + 3.4, 5.6, Math.PI * 0.55, Math.PI * 1.85)
  } else if (facing === 'right') {
    ctx.arc(x - 1.5, headY + 3.4, 5.6, Math.PI * 1.15, Math.PI * 0.45)
  } else {
    ctx.arc(x, headY + 3.2, 5.8, Math.PI * 1.02, Math.PI * 1.98)
  }
  ctx.fill()

  if (facing === 'down' || facing === 'left' || facing === 'right') {
    ctx.fillStyle = INK
    const eyeShift = facing === 'left' ? -1.8 : facing === 'right' ? 1.8 : 0
    if (facing === 'down') {
      ctx.beginPath()
      ctx.arc(x - 2.2, headY + 5.4, 0.9, 0, Math.PI * 2)
      ctx.arc(x + 2.2, headY + 5.4, 0.9, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.arc(x + eyeShift, headY + 5.4, 0.9, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
