/**
 * Камера сцены (4.2.2): масштаб, границы, плавное приближение.
 * Следование за героем появится вместе с перемещением (5.2).
 */

export interface WorldRect {
  x: number
  y: number
  w: number
  h: number
}

export class Camera {
  /** Центр обзора в мировых координатах. */
  x: number
  y: number
  zoom = 1

  readonly minZoom = 0.6
  readonly maxZoom = 2.4

  private viewWidth = 0
  private viewHeight = 0
  private world: WorldRect
  private userZoom = false

  constructor(world: WorldRect) {
    this.world = world
    this.x = world.x + world.w / 2
    this.y = world.y + world.h / 2
  }

  resize(viewWidth: number, viewHeight: number): void {
    this.viewWidth = Math.max(1, viewWidth)
    this.viewHeight = Math.max(1, viewHeight)
    if (!this.userZoom) this.zoom = this.fitZoom()
    this.clamp()
  }

  /** Масштаб, при котором сцена целиком помещается в окно. */
  fitZoom(): number {
    const zoom = Math.min(this.viewWidth / this.world.w, this.viewHeight / this.world.h)
    return Math.min(Math.max(zoom * 0.94, this.minZoom), this.maxZoom)
  }

  pan(dx: number, dy: number): void {
    this.x -= dx / this.zoom
    this.y -= dy / this.zoom
    this.clamp()
  }

  zoomBy(factor: number): void {
    this.zoom = Math.min(Math.max(this.zoom * factor, this.minZoom), this.maxZoom)
    this.userZoom = true
    this.clamp()
  }

  /** Вернуть масштаб «вся сцена целиком». */
  refit(): void {
    this.userZoom = false
    this.zoom = this.fitZoom()
    this.clamp()
  }

  /** Поставить масштаб напрямую (например, щипком на телефоне). */
  setZoom(value: number): void {
    this.zoom = Math.min(Math.max(value, this.minZoom), this.maxZoom)
    this.userZoom = true
    this.clamp()
  }

  /** Плавно подтянуть обзор к точке. */
  focusOn(targetX: number, targetY: number, dt: number): void {    const factor = Math.min(1, Math.max(0, 1 - Math.exp(-7 * dt)))
    this.x += (targetX - this.x) * factor
    this.y += (targetY - this.y) * factor
    this.clamp()
  }

  /** Поставить обзор сразу, без анимации. */
  centerOn(targetX: number, targetY: number): void {
    this.x = targetX
    this.y = targetY
    this.clamp()
  }

  /** Перевод координат указателя в мировые. */
  toWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewWidth / 2) / this.zoom + this.x,
      y: (screenY - this.viewHeight / 2) / this.zoom + this.y,
    }
  }

  /** Держит обзор внутри сцены; если сцена меньше окна — центрирует. */
  private clamp(): void {
    const halfW = this.viewWidth / (2 * this.zoom)
    const halfH = this.viewHeight / (2 * this.zoom)

    if (this.world.w <= halfW * 2) {
      this.x = this.world.x + this.world.w / 2
    } else {
      this.x = Math.min(Math.max(this.x, this.world.x + halfW), this.world.x + this.world.w - halfW)
    }

    if (this.world.h <= halfH * 2) {
      this.y = this.world.y + this.world.h / 2
    } else {
      this.y = Math.min(Math.max(this.y, this.world.y + halfH), this.world.y + this.world.h - halfH)
    }
  }
}
