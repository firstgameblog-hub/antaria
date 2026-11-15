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

  // Волосы. Маска по голове, чтобы причёска не вылезала за силуэт.
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, headY + 4, 6, 0, Math.PI * 2)
  ctx.clip()

  ctx.fillStyle = HAIR
  if (facing === 'up') {
    ctx.fillRect(x - 7, headY - 3, 14, 14)
  } else if (facing === 'down') {
    ctx.fillRect(x - 7, headY - 3, 14, 6.6)
  } else if (facing === 'right') {
    ctx.fillRect(x - 7, headY - 3, 7.2, 14)
  } else {
    ctx.fillRect(x - 0.2, headY - 3, 7.2, 14)
  }
  ctx.restore()

  // Лицо
  ctx.fillStyle = '#3a2f24'
  if (facing === 'down') {
    ctx.beginPath()
    ctx.arc(x - 2.2, headY + 5.8, 0.9, 0, Math.PI * 2)
    ctx.arc(x + 2.2, headY + 5.8, 0.9, 0, Math.PI * 2)
    ctx.fill()
  } else if (facing === 'right' || facing === 'left') {
    const direction = facing === 'right' ? 1 : -1

    ctx.beginPath()
    ctx.arc(x + direction * 3.1, headY + 5.4, 0.9, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = INK
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.moveTo(x + direction * 5.2, headY + 4.9)
    ctx.lineTo(x + direction * 6.4, headY + 5.6)
    ctx.stroke()
  }
}
