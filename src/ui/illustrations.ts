/**
 * Иллюстрации к сценам (4.1.9).
 *
 * Каждая картинка рисуется кодом под конкретный абзац: пролог идёт от
 * холодного света современной комнаты к серому утру над частоколом.
 */

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/** Плотный фон с мягким переходом сверху вниз. */
function backdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  top: string,
  bottom: string,
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

/** Затемнение по краям: картинка читается как кадр, а не как заливка. */
function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.55): void {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

/** Пылинки и шум: чтобы вектор не выглядел стерильным. */
function dust(ctx: CanvasRenderingContext2D, w: number, h: number, count: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
  for (let i = 0; i < count; i += 1) {
    const x = ((i * 97.3) % w) + ((i * 13) % 7)
    const y = ((i * 53.7) % h) + ((i * 7) % 5)
    ctx.fillRect(x, y, 1.4, 1.4)
  }
}

const ROOM: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#222b38', '#0d1015')

  // Обои: вертикальные полосы, чтобы комната не была пустой заливкой.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
  ctx.lineWidth = 2
  for (let x = 0; x < w; x += w * 0.04) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h * 0.72)
    ctx.stroke()
  }

  // Окно: за ним ночной город и чужие окна.
  const wx = w * 0.58
  const wy = h * 0.16
  const ww = w * 0.32
  const wh = h * 0.44

  ctx.fillStyle = '#141b26'
  ctx.fillRect(wx, wy, ww, wh)

  ctx.fillStyle = 'rgba(226, 196, 130, 0.5)'
  for (let i = 0; i < 9; i += 1) {
    const bx = wx + ww * (0.1 + (i % 3) * 0.28)
    const by = wy + wh * (0.18 + Math.floor(i / 3) * 0.24)
    ctx.fillRect(bx, by, ww * 0.1, wh * 0.09)
  }

  ctx.strokeStyle = '#0a0d12'
  ctx.lineWidth = 6
  ctx.strokeRect(wx, wy, ww, wh)
  ctx.beginPath()
  ctx.moveTo(wx + ww / 2, wy)
  ctx.lineTo(wx + ww / 2, wy + wh)
  ctx.moveTo(wx, wy + wh / 2)
  ctx.lineTo(wx + ww, wy + wh / 2)
  ctx.stroke()

  // Свет от фар по потолку.
  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = '#dbe8ff'
  ctx.translate(w * 0.5, h * 0.08)
  ctx.rotate(-0.16)
  ctx.fillRect(-w * 0.35, 0, w * 0.95, h * 0.07)
  ctx.restore()

  // Кровать слева.
  ctx.fillStyle = '#1a212b'
  ctx.fillRect(0, h * 0.66, w * 0.44, h * 0.34)
  ctx.fillStyle = '#2a3440'
  ctx.fillRect(w * 0.02, h * 0.6, w * 0.16, h * 0.12)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.06, h * 0.78)
  ctx.lineTo(w * 0.4, h * 0.74)
  ctx.stroke()

  // Стол с монитором справа.
  ctx.fillStyle = '#151b23'
  ctx.fillRect(w * 0.6, h * 0.72, w * 0.3, h * 0.05)
  ctx.fillStyle = 'rgba(120, 180, 210, 0.25)'
  ctx.fillRect(w * 0.68, h * 0.6, w * 0.14, h * 0.11)

  vignette(ctx, w, h, 0.55)
  dust(ctx, w, h, 30)
}

const CAPSULE: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#1a1f27', '#0a0c10')

  // Пол комнаты: линия, по которой видно, что капсула стоит.
  ctx.fillStyle = '#10141a'
  ctx.fillRect(0, h * 0.8, w, h * 0.2)
  ctx.strokeStyle = 'rgba(160, 180, 200, 0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, h * 0.8)
  ctx.lineTo(w, h * 0.8)
  ctx.stroke()

  const cx = w * 0.5
  const cw = w * 0.3
  const top = h * 0.16
  const bottom = h * 0.8

  // Тень на полу.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.beginPath()
  ctx.ellipse(cx, bottom + h * 0.03, cw * 0.8, h * 0.035, 0, 0, Math.PI * 2)
  ctx.fill()

  // Корпус.
  ctx.fillStyle = '#222934'
  ctx.strokeStyle = '#0a0c10'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(cx - cw / 2, bottom)
  ctx.lineTo(cx - cw / 2, top + h * 0.07)
  ctx.quadraticCurveTo(cx - cw / 2, top, cx - cw / 2 + cw * 0.18, top)
  ctx.lineTo(cx + cw / 2 - cw * 0.18, top)
  ctx.quadraticCurveTo(cx + cw / 2, top, cx + cw / 2, top + h * 0.07)
  ctx.lineTo(cx + cw / 2, bottom)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Стекло: уже, чем корпус, с холодным отсветом.
  const glassX = cx - cw * 0.33
  const glassW = cw * 0.66
  const glassTop = top + h * 0.07
  const glassBottom = bottom - h * 0.08

  const inside = ctx.createLinearGradient(glassX, glassTop, glassX + glassW, glassBottom)
  inside.addColorStop(0, 'rgba(150, 200, 205, 0.22)')
  inside.addColorStop(0.45, 'rgba(70, 120, 125, 0.12)')
  inside.addColorStop(1, 'rgba(120, 190, 170, 0.2)')

  ctx.fillStyle = inside
  ctx.strokeStyle = 'rgba(190, 220, 220, 0.28)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(glassX, glassTop, glassW, glassBottom - glassTop, 8)
  ctx.fill()
  ctx.stroke()

  // Внутри — смутный силуэт и зелёная подсветка.
  const glow = ctx.createRadialGradient(cx, glassTop + (glassBottom - glassTop) * 0.5, 4, cx, glassTop + (glassBottom - glassTop) * 0.5, cw * 0.7)
  glow.addColorStop(0, 'rgba(120, 220, 190, 0.3)')
  glow.addColorStop(1, 'rgba(120, 220, 190, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(glassX, glassTop, glassW, glassBottom - glassTop)

  ctx.fillStyle = 'rgba(20, 30, 34, 0.5)'
  ctx.beginPath()
  ctx.ellipse(cx, glassTop + (glassBottom - glassTop) * 0.55, glassW * 0.16, (glassBottom - glassTop) * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // Панель с огоньками у основания.
  ctx.fillStyle = '#1a2029'
  ctx.strokeStyle = '#0a0c10'
  ctx.lineWidth = 2
  ctx.fillRect(cx - cw * 0.18, bottom - h * 0.06, cw * 0.36, h * 0.035)
  ctx.strokeRect(cx - cw * 0.18, bottom - h * 0.06, cw * 0.36, h * 0.035)

  ctx.fillStyle = '#7fd8b0'
  ctx.beginPath()
  ctx.arc(cx - cw * 0.1, bottom - h * 0.042, 2.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(226, 138, 60, 0.8)'
  ctx.beginPath()
  ctx.arc(cx + cw * 0.04, bottom - h * 0.042, 2, 0, Math.PI * 2)
  ctx.fill()

  // Кабели.
  ctx.strokeStyle = '#161b22'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - cw / 2, bottom - h * 0.02)
  ctx.quadraticCurveTo(cx - cw * 1.1, bottom + h * 0.02, cx - cw * 1.5, h * 0.98)
  ctx.moveTo(cx + cw / 2, bottom - h * 0.02)
  ctx.quadraticCurveTo(cx + cw * 1.1, bottom + h * 0.02, cx + cw * 1.5, h * 0.98)
  ctx.stroke()
  ctx.lineCap = 'butt'

  vignette(ctx, w, h, 0.6)
  dust(ctx, w, h, 40)
}

const REASON: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#1b2029', '#0b0d11')

  // Корпус капсулы крупным планом: край и стекло.
  ctx.fillStyle = '#1b222c'
  ctx.fillRect(0, h * 0.52, w, h * 0.48)
  ctx.strokeStyle = 'rgba(190, 220, 230, 0.25)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, h * 0.52)
  ctx.lineTo(w, h * 0.52)
  ctx.stroke()

  // Холодный отсвет стекла слева.
  ctx.globalAlpha = 0.1
  ctx.fillStyle = '#a8d8e8'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w * 0.34, 0)
  ctx.lineTo(w * 0.1, h * 0.52)
  ctx.lineTo(0, h * 0.52)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Рука: ладонь на краю, пальцы свисают внутрь.
  const skin = '#c9a07c'
  const skinDark = '#a67f5e'
  const skinEdge = '#463022'

  ctx.fillStyle = skin
  ctx.strokeStyle = skinEdge
  ctx.lineWidth = 3

  // Ладонь.
  ctx.beginPath()
  ctx.moveTo(w * 0.2, h * 1.02)
  ctx.lineTo(w * 0.24, h * 0.56)
  ctx.quadraticCurveTo(w * 0.36, h * 0.48, w * 0.5, h * 0.54)
  ctx.lineTo(w * 0.54, h * 1.02)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Пальцы, свисающие за край.
  for (let i = 0; i < 4; i += 1) {
    const fx = w * (0.28 + i * 0.062)
    const fw = w * 0.048
    ctx.fillStyle = i % 2 === 0 ? skin : skinDark
    ctx.beginPath()
    ctx.roundRect(fx, h * 0.52, fw, h * (0.2 + (i % 2) * 0.02), fw * 0.45)
    ctx.fill()
    ctx.stroke()

    // Складка на сгибе.
    ctx.strokeStyle = 'rgba(70, 48, 34, 0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(fx + fw * 0.15, h * 0.58)
    ctx.lineTo(fx + fw * 0.85, h * 0.58)
    ctx.stroke()
    ctx.strokeStyle = skinEdge
    ctx.lineWidth = 3
  }

  // Рукав.
  ctx.fillStyle = '#3a414c'
  ctx.strokeStyle = '#1b2029'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(w * 0.22, h * 0.86, w * 0.34, h * 0.16, 4)
  ctx.fill()
  ctx.stroke()

  vignette(ctx, w, h, 0.7)
}

const LID: Draw = (ctx, w, h) => {
  // Вид изнутри: крышка идёт вниз, света всё меньше.
  backdrop(ctx, w, h, '#161c24', '#04050a')

  // Стенки капсулы по краям.
  ctx.fillStyle = '#0d1117'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w * 0.12, 0)
  ctx.lineTo(w * 0.2, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(w, 0)
  ctx.lineTo(w * 0.88, 0)
  ctx.lineTo(w * 0.8, h)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fill()

  // Проём: полоса света, которая сужается.
  const sx = w * 0.2
  const sw = w * 0.6
  ctx.fillStyle = '#dfe9ee'
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.moveTo(sx, 0)
  ctx.lineTo(sx + sw, 0)
  ctx.lineTo(sx + sw * 0.94, h * 0.2)
  ctx.lineTo(sx + sw * 0.06, h * 0.2)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Крышка: тёмная масса сверху, съедающая кадр.
  ctx.fillStyle = '#0a0d12'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.2)
  ctx.quadraticCurveTo(w / 2, h * 0.36, w, h * 0.2)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // Стекло крышки: тонкая светлая кромка и отблеск.
  ctx.strokeStyle = 'rgba(200, 225, 235, 0.5)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, h * 0.2)
  ctx.quadraticCurveTo(w / 2, h * 0.36, w, h * 0.2)
  ctx.stroke()

  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#cfe2ea'
  ctx.beginPath()
  ctx.moveTo(w * 0.16, h * 0.22)
  ctx.lineTo(w * 0.34, h * 0.27)
  ctx.lineTo(w * 0.24, h * 0.5)
  ctx.lineTo(w * 0.1, h * 0.42)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Пылинки в полосе света.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  for (let i = 0; i < 22; i += 1) {
    const x = sx + ((i * 53) % sw)
    const y = ((i * 37) % (h * 0.18))
    ctx.fillRect(x, y, 1.4, 1.4)
  }

  vignette(ctx, w, h, 0.75)
}

const WARNING: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#0d1117', '#05070a')

  // Стекло капсулы: мутная плоскость с бликами.
  const glass = ctx.createLinearGradient(0, 0, w, h)
  glass.addColorStop(0, 'rgba(140, 180, 190, 0.14)')
  glass.addColorStop(0.5, 'rgba(80, 110, 130, 0.06)')
  glass.addColorStop(1, 'rgba(160, 200, 210, 0.12)')
  ctx.fillStyle = glass
  ctx.fillRect(0, 0, w, h)

  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#ffffff'
  ctx.save()
  ctx.translate(w * 0.2, h * 0.1)
  ctx.rotate(-0.5)
  ctx.fillRect(0, 0, w * 0.1, h * 1.4)
  ctx.restore()
  ctx.globalAlpha = 1

  // Панель предупреждения.
  const px = w * 0.22
  const py = h * 0.24
  const pw = w * 0.56
  const ph = h * 0.46

  ctx.fillStyle = 'rgba(20, 14, 12, 0.72)'
  ctx.strokeStyle = 'rgba(226, 108, 78, 0.65)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(px, py, pw, ph, 3)
  ctx.fill()
  ctx.stroke()

  // Знак: треугольник с восклицанием.
  ctx.strokeStyle = 'rgba(226, 108, 78, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(px + pw * 0.5, py + ph * 0.12)
  ctx.lineTo(px + pw * 0.56, py + ph * 0.3)
  ctx.lineTo(px + pw * 0.44, py + ph * 0.3)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(px + pw * 0.5, py + ph * 0.17)
  ctx.lineTo(px + pw * 0.5, py + ph * 0.24)
  ctx.stroke()

  // Слова: два читаемых и третье — не на языке игры.
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(238, 150, 122, 0.95)'
  ctx.font = `600 ${Math.round(h * 0.045)}px monospace`
  ctx.fillText('СИСТЕМА', w * 0.5, py + ph * 0.52)
  ctx.fillText('ПЕРЕХОД', w * 0.5, py + ph * 0.68)

  ctx.fillStyle = 'rgba(238, 150, 122, 0.6)'
  for (let i = 0; i < 8; i += 1) {
    const gw = w * (0.02 + ((i * 7) % 3) * 0.008)
    ctx.fillRect(w * 0.5 - w * 0.11 + i * w * 0.028, py + ph * 0.8, gw, 3)
  }
  ctx.textAlign = 'left'

  // Отражение лица — еле видно.
  ctx.globalAlpha = 0.07
  ctx.fillStyle = '#dfe8ee'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.72, w * 0.1, h * 0.14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  vignette(ctx, w, h, 0.72)
}

const SMELL: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#1d1309', '#070403')

  // Стены избы: брёвна и потолочная балка.
  ctx.fillStyle = '#150e08'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(96, 70, 44, 0.25)'
  ctx.lineWidth = 2
  for (let y = h * 0.08; y < h * 0.62; y += h * 0.09) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  ctx.fillStyle = '#241811'
  ctx.fillRect(w * 0.06, h * 0.02, w * 0.88, h * 0.06)

  // Очаг и угли.
  ctx.fillStyle = '#2a2019'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.74, w * 0.24, h * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.72, 6, w * 0.5, h * 0.72, w * 0.55)
  glow.addColorStop(0, 'rgba(230, 140, 60, 0.45)')
  glow.addColorStop(1, 'rgba(230, 140, 60, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, h * 0.4, w, h * 0.6)

  ctx.fillStyle = '#c46a2a'
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath()
    ctx.ellipse(w * (0.4 + i * 0.05), h * (0.73 + (i % 2) * 0.02), 4, 2.4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Дым: мягкие завитки вверх.
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.08)'
  ctx.lineWidth = 16
  ctx.lineCap = 'round'
  for (let i = 0; i < 4; i += 1) {
    const baseX = w * (0.36 + i * 0.1)
    ctx.beginPath()
    ctx.moveTo(baseX, h * 0.7)
    ctx.bezierCurveTo(baseX + 34, h * 0.5, baseX - 30, h * 0.34, baseX + 12, h * 0.14)
    ctx.stroke()
  }
  ctx.lineCap = 'butt'

  // Мокрая шерсть у нижнего края.
  ctx.strokeStyle = 'rgba(70, 52, 36, 0.85)'
  ctx.lineWidth = 3
  for (let i = 0; i < 30; i += 1) {
    const x = w * 0.08 + i * (w * 0.028)
    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(x + 7, h * 0.86)
    ctx.stroke()
  }

  vignette(ctx, w, h, 0.72)
}

const BODY: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#3b3329', '#171310')

  // Земля и солома под рукой.
  ctx.strokeStyle = 'rgba(120, 96, 60, 0.55)'
  ctx.lineWidth = 2
  for (let i = 0; i < 46; i += 1) {
    const x = (i * 53) % w
    const y = h * 0.5 + ((i * 31) % (h * 0.5))
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 16, y - 4)
    ctx.stroke()
  }

  // Рука лежит на земле ладонью вверх, чужая и слишком большая.
  const cx = w * 0.52
  const cy = h * 0.66
  const palmW = w * 0.17
  const palmH = h * 0.2

  const skin = '#c39a78'
  const skinShade = '#a87e5e'
  const edge = '#3f2b1e'

  // Тень под рукой.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(cx + w * 0.01, cy + palmH * 0.9, palmW * 1.25, palmH * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Пальцы.
  const fingers = [
    { dx: -palmW * 0.78, len: palmH * 0.95, tilt: -0.22 },
    { dx: -palmW * 0.28, len: palmH * 1.15, tilt: -0.08 },
    { dx: palmW * 0.2, len: palmH * 1.08, tilt: 0.06 },
    { dx: palmW * 0.62, len: palmH * 0.85, tilt: 0.2 },
  ]

  for (const finger of fingers) {
    const fx = cx + finger.dx
    const fy = cy - palmH * 0.55

    ctx.save()
    ctx.translate(fx, fy)
    ctx.rotate(finger.tilt)
    ctx.fillStyle = skin
    ctx.strokeStyle = edge
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.roundRect(-palmW * 0.16, -finger.len, palmW * 0.32, finger.len, palmW * 0.16)
    ctx.fill()
    ctx.stroke()

    // Складки на сгибах.
    ctx.strokeStyle = 'rgba(70, 48, 34, 0.45)'
    ctx.lineWidth = 1.4
    for (let joint = 1; joint <= 2; joint += 1) {
      const jy = -finger.len + (finger.len * joint) / 3
      ctx.beginPath()
      ctx.moveTo(-palmW * 0.13, jy)
      ctx.lineTo(palmW * 0.13, jy)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Ладонь.
  ctx.fillStyle = skin
  ctx.strokeStyle = edge
  ctx.lineWidth = 2.6
  ctx.beginPath()
  ctx.ellipse(cx, cy, palmW, palmH, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Тень на ладони и линии.
  ctx.fillStyle = skinShade
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.ellipse(cx + palmW * 0.15, cy + palmH * 0.15, palmW * 0.7, palmH * 0.7, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.strokeStyle = 'rgba(70, 48, 34, 0.5)'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(cx - palmW * 0.5, cy - palmH * 0.1)
  ctx.quadraticCurveTo(cx, cy + palmH * 0.1, cx + palmW * 0.45, cy - palmH * 0.2)
  ctx.moveTo(cx - palmW * 0.2, cy + palmH * 0.5)
  ctx.quadraticCurveTo(cx + palmW * 0.05, cy + palmH * 0.7, cx + palmW * 0.3, cy + palmH * 0.45)
  ctx.stroke()

  // Большой палец.
  ctx.fillStyle = skin
  ctx.strokeStyle = edge
  ctx.lineWidth = 2.4
  ctx.save()
  ctx.translate(cx - palmW * 0.9, cy + palmH * 0.15)
  ctx.rotate(-0.55)
  ctx.beginPath()
  ctx.roundRect(-palmW * 0.17, -palmH * 0.35, palmW * 0.34, palmH * 0.75, palmW * 0.17)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Заноза.
  ctx.strokeStyle = '#2f2014'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(cx - palmW * 0.1, cy + palmH * 0.05)
  ctx.lineTo(cx + palmW * 0.22, cy + palmH * 0.22)
  ctx.stroke()

  // Утренний свет узкой полосой.
  ctx.globalAlpha = 0.1
  ctx.fillStyle = '#d9d2bf'
  ctx.fillRect(0, h * 0.1, w, h * 0.08)
  ctx.globalAlpha = 1

  vignette(ctx, w, h, 0.66)
}

const FATHER: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#3d3729', '#12100c')

  // Свет от костра снизу: лицо выхвачено из темноты.
  const light = ctx.createRadialGradient(w * 0.5, h * 1.05, 10, w * 0.5, h * 1.05, h * 0.95)
  light.addColorStop(0, 'rgba(232, 158, 76, 0.3)')
  light.addColorStop(1, 'rgba(232, 158, 76, 0)')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, w, h)

  // Плечи в грубой рубахе.
  ctx.fillStyle = '#4a4238'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 1.16, w * 0.42, h * 0.42, 0, 0, Math.PI * 2)
  ctx.fill()

  // Голова склонена набок.
  ctx.save()
  ctx.translate(w * 0.5, h * 0.46)
  ctx.rotate(-0.06)

  ctx.fillStyle = '#b98f6a'
  ctx.strokeStyle = '#2f2115'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, 0, w * 0.14, h * 0.19, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Волосы: седая масса по краю головы, без иголок.
  ctx.fillStyle = 'rgba(198, 190, 176, 0.9)'
  ctx.beginPath()
  ctx.ellipse(0, -h * 0.09, w * 0.145, h * 0.075, 0, Math.PI, Math.PI * 2)
  ctx.fill()

  // Глаза в тени: тревога, а не умиление.
  ctx.fillStyle = 'rgba(40, 28, 18, 0.85)'
  ctx.beginPath()
  ctx.ellipse(-w * 0.05, -h * 0.02, w * 0.028, h * 0.016, 0.1, 0, Math.PI * 2)
  ctx.ellipse(w * 0.05, -h * 0.02, w * 0.028, h * 0.016, -0.1, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(240, 230, 210, 0.6)'
  ctx.beginPath()
  ctx.arc(-w * 0.047, -h * 0.024, w * 0.007, 0, Math.PI * 2)
  ctx.arc(w * 0.053, -h * 0.024, w * 0.007, 0, Math.PI * 2)
  ctx.fill()

  // Брови, нос, складки.
  ctx.strokeStyle = 'rgba(70, 52, 38, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-w * 0.085, -h * 0.045)
  ctx.lineTo(-w * 0.025, -h * 0.05)
  ctx.moveTo(w * 0.025, -h * 0.05)
  ctx.lineTo(w * 0.085, -h * 0.045)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, -h * 0.03)
  ctx.lineTo(-w * 0.01, h * 0.03)
  ctx.lineTo(w * 0.015, h * 0.035)
  ctx.stroke()

  // Рот — короткая прямая линия на коже, без улыбки.
  ctx.strokeStyle = 'rgba(60, 40, 28, 0.9)'
  ctx.beginPath()
  ctx.moveTo(-w * 0.028, h * 0.075)
  ctx.lineTo(w * 0.028, h * 0.075)
  ctx.stroke()

  // Борода ниже рта: широкая, тяжёлая.
  ctx.fillStyle = '#cfc7b9'
  ctx.strokeStyle = '#8d8577'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(-w * 0.118, h * 0.06)
  ctx.quadraticCurveTo(-w * 0.1, h * 0.22, 0, h * 0.27)
  ctx.quadraticCurveTo(w * 0.1, h * 0.22, w * 0.118, h * 0.06)
  ctx.quadraticCurveTo(w * 0.06, h * 0.11, 0, h * 0.105)
  ctx.quadraticCurveTo(-w * 0.06, h * 0.11, -w * 0.118, h * 0.06)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = 'rgba(120, 112, 100, 0.55)'
  ctx.lineWidth = 1
  for (let i = -4; i <= 4; i += 1) {
    ctx.beginPath()
    ctx.moveTo(i * w * 0.022, h * 0.12)
    ctx.lineTo(i * w * 0.026, h * 0.24)
    ctx.stroke()
  }

  // Морщины у глаз.
  ctx.strokeStyle = 'rgba(90, 70, 50, 0.5)'
  ctx.lineWidth = 1.2
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i += 1) {
      ctx.beginPath()
      ctx.moveTo(side * w * 0.075, -h * 0.015 + i * h * 0.012)
      ctx.lineTo(side * w * 0.1, -h * 0.03 + i * h * 0.014)
      ctx.stroke()
    }
  }

  ctx.restore()

  vignette(ctx, w, h, 0.55)
}

const NOEXIT: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#14110d', '#040302')

  // Слабый свет из щели под крышкой.
  const light = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.6)
  light.addColorStop(0, 'rgba(210, 220, 225, 0.16)')
  light.addColorStop(1, 'rgba(210, 220, 225, 0)')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, w, h * 0.6)

  // Ладони перед лицом: пальцы растопырены.
  const drawHand = (cx: number, cy: number, mirror: number): void => {
    const palmW = w * 0.105
    const palmH = h * 0.15

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(mirror, 1)

    const edge = '#3a281c'

    // Пальцы.
    for (const finger of [
      { dx: -0.78, len: 1.25, tilt: -0.3 },
      { dx: -0.26, len: 1.5, tilt: -0.1 },
      { dx: 0.22, len: 1.45, tilt: 0.1 },
      { dx: 0.66, len: 1.15, tilt: 0.28 },
    ]) {
      ctx.save()
      ctx.translate(finger.dx * palmW, -palmH * 0.6)
      ctx.rotate(finger.tilt)
      ctx.fillStyle = '#b98f6e'
      ctx.strokeStyle = edge
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(-palmW * 0.15, -palmH * finger.len, palmW * 0.3, palmH * finger.len, palmW * 0.15)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    // Ладонь.
    ctx.fillStyle = '#b98f6e'
    ctx.strokeStyle = edge
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.ellipse(0, 0, palmW, palmH * 0.85, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Большой палец.
    ctx.save()
    ctx.translate(palmW * 0.85, palmH * 0.1)
    ctx.rotate(0.6)
    ctx.beginPath()
    ctx.roundRect(-palmW * 0.16, -palmH * 0.35, palmW * 0.32, palmH * 0.7, palmW * 0.16)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Тень ладони.
    ctx.fillStyle = 'rgba(60, 40, 28, 0.25)'
    ctx.beginPath()
    ctx.ellipse(palmW * 0.2, palmH * 0.15, palmW * 0.6, palmH * 0.4, 0.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  drawHand(w * 0.28, h * 0.86, -1)
  drawHand(w * 0.72, h * 0.86, 1)

  // Дым между пальцами: никакого меню.
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.06)'
  ctx.lineWidth = 14
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h * 0.95)
  ctx.bezierCurveTo(w * 0.42, h * 0.6, w * 0.6, h * 0.42, w * 0.5, h * 0.1)
  ctx.stroke()
  ctx.lineCap = 'butt'

  vignette(ctx, w, h, 0.8)
}

const VILLAGE: Draw = (ctx, w, h) => {
  // Серое утро над крышами.
  backdrop(ctx, w, h, '#8f9086', '#c3bfae')

  // Дальние крыши.
  ctx.fillStyle = '#7a7263'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.62)
  ctx.lineTo(w * 0.18, h * 0.5)
  ctx.lineTo(w * 0.34, h * 0.6)
  ctx.lineTo(w * 0.52, h * 0.46)
  ctx.lineTo(w * 0.7, h * 0.58)
  ctx.lineTo(w * 0.86, h * 0.48)
  ctx.lineTo(w, h * 0.6)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // Частокол.
  ctx.fillStyle = '#6b533c'
  for (let x = 0; x < w; x += w * 0.022) {
    const postH = h * 0.16 + ((x * 7) % 12)
    ctx.fillRect(x, h * 0.74 - postH, w * 0.012, postH)
  }

  // Костёр: единственное тёплое пятно.
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.78, 2, w * 0.5, h * 0.78, h * 0.22)
  glow.addColorStop(0, 'rgba(232, 158, 76, 0.6)')
  glow.addColorStop(1, 'rgba(232, 158, 76, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(w * 0.3, h * 0.6, w * 0.4, h * 0.4)

  ctx.fillStyle = '#e08a3c'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.78, 6, 12, 0, 0, Math.PI * 2)
  ctx.fill()

  // Две фигуры у огня.
  ctx.fillStyle = '#2f2a24'
  for (const dx of [-w * 0.06, w * 0.07]) {
    ctx.beginPath()
    ctx.ellipse(w * 0.5 + dx, h * 0.78, w * 0.012, h * 0.03, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  vignette(ctx, w, h, 0.4)
}

const ILLUSTRATIONS: Record<string, Draw> = {
  room: ROOM,
  capsule: CAPSULE,
  reason: REASON,
  lid: LID,
  warning: WARNING,
  smell: SMELL,
  body: BODY,
  father: FATHER,
  noexit: NOEXIT,
  village: VILLAGE,
}

export function hasIllustration(id: string): boolean {
  return ILLUSTRATIONS[id] !== undefined
}

export function drawIllustration(
  ctx: CanvasRenderingContext2D,
  id: string,
  width: number,
  height: number,
): boolean {
  const draw = ILLUSTRATIONS[id]
  if (!draw) return false

  ctx.save()
  ctx.clearRect(0, 0, width, height)
  draw(ctx, width, height)
  ctx.restore()
  return true
}
