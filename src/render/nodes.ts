/**
 * Отрисовка узлов сбора (6.1).
 *
 * Собранный узел не исчезает: он выглядит ощипанным, чтобы место не забывалось.
 */

import type { NodeKind } from '../data/gathering'

const INK = '#3a2f24'

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(58, 47, 36, 0.13)'
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawHerb(ctx: CanvasRenderingContext2D, x: number, y: number, ready: boolean): void {
  drawShadow(ctx, x, y, 11, 4)

  const height = ready ? 13 : 6
  const blades = [
    { offset: -7, lean: -2.5 },
    { offset: -3, lean: -1 },
    { offset: 0, lean: 0.5 },
    { offset: 3, lean: 2 },
    { offset: 7, lean: 2.8 },
  ]

  for (const blade of blades) {
    ctx.strokeStyle = ready ? '#7d8f4a' : '#8f8a5e'
    ctx.lineWidth = 1.6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + blade.offset, y)
    ctx.quadraticCurveTo(
      x + blade.offset + blade.lean * 0.5,
      y - height * 0.6,
      x + blade.offset + blade.lean,
      y - height,
    )
    ctx.stroke()
  }
  ctx.lineCap = 'butt'

  if (ready) {
    ctx.fillStyle = '#e3c96a'
    ctx.beginPath()
    ctx.arc(x - 3, y - height + 2, 1.5, 0, Math.PI * 2)
    ctx.arc(x + 4, y - height + 1, 1.3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBerry(ctx: CanvasRenderingContext2D, x: number, y: number, ready: boolean): void {
  drawShadow(ctx, x, y, 14, 4.5)

  ctx.fillStyle = ready ? '#6f8140' : '#8a8a5f'
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(x - 5, y - 6, 8, 0, Math.PI * 2)
  ctx.arc(x + 5, y - 6, 7.5, 0, Math.PI * 2)
  ctx.arc(x, y - 12, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  if (ready) {
    ctx.fillStyle = '#a83b3b'
    const berries = [
      [-6, -8],
      [2, -10],
      [6, -4],
      [-2, -4],
      [0, -15],
    ]
    for (const [dx, dy] of berries) {
      ctx.beginPath()
      ctx.arc(x + (dx ?? 0), y + (dy ?? 0), 1.9, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawBranch(ctx: CanvasRenderingContext2D, x: number, y: number, ready: boolean): void {
  drawShadow(ctx, x, y, 12, 4)

  ctx.strokeStyle = ready ? '#8a5f38' : '#9d8f7a'
  ctx.lineWidth = 2.6
  ctx.lineCap = 'round'

  const sticks = ready
    ? [
        [-10, 0, 8, -5],
        [-7, -2, 9, 2],
        [-11, -4, 3, -1],
      ]
    : [[-6, 0, 4, -1]]

  for (const [x1, y1, x2, y2] of sticks) {
    ctx.beginPath()
    ctx.moveTo(x + (x1 ?? 0), y + (y1 ?? 0))
    ctx.lineTo(x + (x2 ?? 0), y + (y2 ?? 0))
    ctx.stroke()
  }
  ctx.lineCap = 'butt'
}

function drawLogPile(ctx: CanvasRenderingContext2D, x: number, y: number, ready: boolean): void {
  drawShadow(ctx, x, y, 15, 5)

  if (!ready) {
    ctx.strokeStyle = '#9d8f7a'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 6, y - 1)
    ctx.lineTo(x + 5, y - 2)
    ctx.stroke()
    ctx.lineCap = 'butt'
    return
  }

  ctx.lineCap = 'round'
  ctx.strokeStyle = '#7c5836'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(x - 14, y - 3)
  ctx.lineTo(x + 6, y - 6)
  ctx.stroke()

  ctx.strokeStyle = '#8a5f38'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(x - 8, y + 3)
  ctx.lineTo(x + 13, y)
  ctx.stroke()
  ctx.lineCap = 'butt'

  ctx.fillStyle = '#d8b87a'
  ctx.strokeStyle = '#3a2f24'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(x + 6, y - 6, 2, 3.6, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawStone(ctx: CanvasRenderingContext2D, x: number, y: number, ready: boolean): void {  drawShadow(ctx, x, y, 13, 4.5)

  ctx.fillStyle = ready ? '#9a958a' : '#b3ada2'
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.2

  const stones = ready
    ? [
        [0, 0, 6.5, 4.5],
        [-7, 1, 4.5, 3.2],
        [7, 1, 4.2, 3],
      ]
    : [
        [0, 0, 4, 2.6],
        [6, 1, 3, 2],
      ]

  for (const [dx, dy, rx, ry] of stones) {
    ctx.beginPath()
    ctx.ellipse(x + (dx ?? 0), y + (dy ?? 0), rx ?? 4, ry ?? 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

function drawOre(ctx: CanvasRenderingContext2D, x: number, y: number, ready: boolean): void {
  drawShadow(ctx, x, y, 14, 5)

  ctx.fillStyle = ready ? '#6f6a63' : '#8f8a80'
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.3

  const stones = ready
    ? [
        [0, 0, 9, 6],
        [-8, 2, 5.5, 3.6],
        [8, 2, 5, 3.2],
      ]
    : [[0, 1, 6, 3.6]]

  for (const [dx, dy, rx, ry] of stones) {
    ctx.beginPath()
    ctx.ellipse(x + (dx ?? 0), y + (dy ?? 0), rx ?? 5, ry ?? 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  if (ready) {
    ctx.strokeStyle = 'rgba(180, 160, 120, 0.85)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(x - 4, y - 2)
    ctx.lineTo(x + 2, y + 1)
    ctx.moveTo(x + 3, y - 3)
    ctx.lineTo(x + 7, y - 1)
    ctx.stroke()
  }
}

export function drawGatheringNode(
  ctx: CanvasRenderingContext2D,
  kind: NodeKind,
  x: number,
  y: number,
  ready: boolean,
): void {
  switch (kind) {
    case 'herb':
      drawHerb(ctx, x, y, ready)
      break
    case 'berry':
      drawBerry(ctx, x, y, ready)
      break
    case 'branch':
      drawBranch(ctx, x, y, ready)
      break
    case 'stone':
      drawStone(ctx, x, y, ready)
      break
    case 'log':
      drawLogPile(ctx, x, y, ready)
      break
    case 'ore':
      drawOre(ctx, x, y, ready)
      break
  }
}

/** Логово: тёмная нора, кости у входа. */
export function drawLair(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save()

  ctx.fillStyle = 'rgba(58, 47, 36, 0.16)'
  ctx.beginPath()
  ctx.ellipse(x, y + 2, 20, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  const hole = ctx.createRadialGradient(x, y - 4, 2, x, y - 4, 18)
  hole.addColorStop(0, '#201913')
  hole.addColorStop(0.75, '#3a2f24')
  hole.addColorStop(1, 'rgba(58, 47, 36, 0)')

  ctx.fillStyle = hole
  ctx.beginPath()
  ctx.ellipse(x, y - 4, 18, 11, 0, 0, Math.PI * 2)
  ctx.fill()

  // Кости у входа
  ctx.strokeStyle = '#d8cdb6'
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 14, y + 4)
  ctx.lineTo(x - 6, y + 2)
  ctx.moveTo(x + 6, y + 5)
  ctx.lineTo(x + 14, y + 3)
  ctx.stroke()
  ctx.lineCap = 'butt'

  ctx.restore()
}

/** Следы зверя: пара отпечатков, уходящих в сторону. */
export function drawTracks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ready: boolean,
): void {
  ctx.save()
  ctx.fillStyle = ready ? 'rgba(84, 66, 46, 0.5)' : 'rgba(84, 66, 46, 0.16)'

  for (let index = 0; index < 4; index += 1) {
    const offsetX = -13 + index * 9
    const offsetY = index % 2 === 0 ? -3 : 4

    ctx.beginPath()
    ctx.ellipse(x + offsetX, y + offsetY, 2.3, 3.4, 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
