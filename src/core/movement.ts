/**
 * Перемещение по сцене (5.2).
 *
 * Чистая геометрия без DOM: используется и героем, и будущими жителями.
 * Столкновения — круг против прямоугольников, движение раздельно по осям,
 * чтобы герой скользил вдоль стены, а не застревал в ней.
 */

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type Facing = 'down' | 'up' | 'left' | 'right'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function collides(x: number, y: number, radius: number, obstacles: readonly Rect[]): boolean {
  for (const rect of obstacles) {
    const nearestX = clamp(x, rect.x, rect.x + rect.w)
    const nearestY = clamp(y, rect.y, rect.y + rect.h)
    const dx = x - nearestX
    const dy = y - nearestY
    if (dx * dx + dy * dy < radius * radius) return true
  }
  return false
}

/** Занята ли точка: выход за границы или пересечение с постройкой. */
export function isBlocked(
  position: Point,
  radius: number,
  obstacles: readonly Rect[],
  bounds: Rect,
): boolean {
  if (position.x < bounds.x + radius || position.x > bounds.x + bounds.w - radius) return true
  if (position.y < bounds.y + radius || position.y > bounds.y + bounds.h - radius) return true
  return collides(position.x, position.y, radius, obstacles)
}

/**
 * Ближайшее свободное место. Нужно как страховка: если сохранение придёт
 * с героем внутри постройки, он не должен застрять навсегда.
 */
export function findFreeSpot(
  position: Point,
  radius: number,
  obstacles: readonly Rect[],
  bounds: Rect,
  fallback: Point,
): Point {
  if (!isBlocked(position, radius, obstacles, bounds)) return position

  for (let step = 8; step <= 480; step += 8) {
    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2
      const candidate = {
        x: position.x + Math.cos(angle) * step,
        y: position.y + Math.sin(angle) * step,
      }
      if (!isBlocked(candidate, radius, obstacles, bounds)) return candidate
    }
  }

  return fallback
}

export function movePlayer(  position: Point,
  delta: Point,
  radius: number,
  obstacles: readonly Rect[],
  bounds: Rect,
): Point {
  let x = position.x
  let y = position.y

  const nextX = clamp(x + delta.x, bounds.x + radius, bounds.x + bounds.w - radius)
  if (!collides(nextX, y, radius, obstacles)) x = nextX

  const nextY = clamp(y + delta.y, bounds.y + radius, bounds.y + bounds.h - radius)
  if (!collides(x, nextY, radius, obstacles)) y = nextY

  return { x, y }
}

/** Направление шага: для выбора стороны спрайта. */
export function facingOf(delta: Point, previous: Facing): Facing {
  if (Math.abs(delta.x) > Math.abs(delta.y)) {
    if (Math.abs(delta.x) < 0.01) return previous
    return delta.x > 0 ? 'right' : 'left'
  }
  if (Math.abs(delta.y) < 0.01) return previous
  return delta.y > 0 ? 'down' : 'up'
}

export function distance(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}

/** Шаг к цели. Возвращает новое смещение и признак «дошли». */
export function stepToward(
  from: Point,
  to: Point,
  maxDistance: number,
): { delta: Point; arrived: boolean } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)

  if (length <= maxDistance || length < 0.0001) {
    return { delta: { x: dx, y: dy }, arrived: true }
  }

  return {
    delta: { x: (dx / length) * maxDistance, y: (dy / length) * maxDistance },
    arrived: false,
  }
}
