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

  // Пол.
  ctx.fillStyle = '#10141a'
  ctx.fillRect(0, h * 0.78, w, h * 0.22)
  ctx.strokeStyle = 'rgba(160, 180, 200, 0.1)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, h * 0.78)
  ctx.lineTo(w, h * 0.78)
  ctx.stroke()

  const cx = w * 0.46
  const cw = w * 0.3
  const top = h * 0.18
  const bottom = h * 0.78

  // Тень.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.beginPath()
  ctx.ellipse(cx, bottom + h * 0.02, cw * 0.75, h * 0.03, 0, 0, Math.PI * 2)
  ctx.fill()

  // Корпус капсулы.
  ctx.fillStyle = '#242b35'
  ctx.strokeStyle = '#0a0c10'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(cx - cw / 2, bottom)
  ctx.lineTo(cx - cw / 2, top + h * 0.06)
  ctx.quadraticCurveTo(cx - cw / 2, top, cx - cw / 2 + cw * 0.16, top)
  ctx.lineTo(cx + cw / 2 - cw * 0.16, top)
  ctx.quadraticCurveTo(cx + cw / 2, top, cx + cw / 2, top + h * 0.06)
  ctx.lineTo(cx + cw / 2, bottom)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Открытая ниша: тёмная глубина и подсветка по краю.
  const innerX = cx - cw * 0.34
  const innerW = cw * 0.68
  const innerTop = top + h * 0.07
  const innerBottom = bottom - h * 0.06

  const depth = ctx.createLinearGradient(0, innerTop, 0, innerBottom)
  depth.addColorStop(0, '#0b1317')
  depth.addColorStop(0.55, '#122126')
  depth.addColorStop(1, '#0a1013')
  ctx.fillStyle = depth
  ctx.fillRect(innerX, innerTop, innerW, innerBottom - innerTop)

  // Ложе внутри: подушки-сегменты.
  ctx.strokeStyle = 'rgba(120, 180, 180, 0.18)'
  ctx.lineWidth = 2
  for (let i = 1; i <= 4; i += 1) {
    const ly = innerTop + ((innerBottom - innerTop) * i) / 5
    ctx.beginPath()
    ctx.moveTo(innerX + 4, ly)
    ctx.lineTo(innerX + innerW - 4, ly)
    ctx.stroke()
  }

  // Зелёный свет изнутри.
  const glow = ctx.createRadialGradient(cx, (innerTop + innerBottom) / 2, 6, cx, (innerTop + innerBottom) / 2, cw * 0.75)
  glow.addColorStop(0, 'rgba(120, 220, 190, 0.28)')
  glow.addColorStop(1, 'rgba(120, 220, 190, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(innerX - 8, innerTop - 8, innerW + 16, innerBottom - innerTop + 16)

  // Кромка, в которую упиралась крышка.
  ctx.strokeStyle = 'rgba(190, 220, 220, 0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(innerX, innerTop, innerW, innerBottom - innerTop)

  // Крышка откинута назад: высокая панель за капсулой.
  ctx.save()
  ctx.translate(cx + cw * 0.42, top - h * 0.06)
  ctx.rotate(0.16)

  ctx.fillStyle = '#1c232c'
  ctx.strokeStyle = '#0a0c10'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(0, 0, cw * 0.72, (bottom - top) * 1.04, 10)
  ctx.fill()
  ctx.stroke()

  // Стекло крышки с бликом.
  const glass = ctx.createLinearGradient(0, 0, cw * 0.7, (bottom - top) * 1.04)
  glass.addColorStop(0, 'rgba(150, 195, 205, 0.18)')
  glass.addColorStop(1, 'rgba(90, 130, 145, 0.1)')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.roundRect(cw * 0.07, h * 0.03, cw * 0.58, (bottom - top) * 0.98, 8)
  ctx.fill()

  ctx.strokeStyle = 'rgba(210, 230, 235, 0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cw * 0.14, h * 0.05)
  ctx.lineTo(cw * 0.1, (bottom - top) * 0.9)
  ctx.stroke()

  ctx.restore()

  // Свет из открытой капсулы на пол.
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#a8e0d8'
  ctx.beginPath()
  ctx.moveTo(innerX, innerBottom)
  ctx.lineTo(innerX + innerW, innerBottom)
  ctx.lineTo(cx + cw * 0.9, h)
  ctx.lineTo(cx - cw * 0.9, h)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  vignette(ctx, w, h, 0.68)
  dust(ctx, w, h, 26)
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
  // Земля у порога: утоптанная глина, солома, редкие камни.
  backdrop(ctx, w, h, '#4a4033', '#221b15')

  // Пятна глины.
  for (let i = 0; i < 26; i += 1) {
    const x = (i * 137) % w
    const y = (i * 83) % h
    ctx.fillStyle = i % 2 === 0 ? 'rgba(96, 78, 54, 0.22)' : 'rgba(70, 56, 38, 0.22)'
    ctx.beginPath()
    ctx.ellipse(x, y, 26 + (i % 5) * 8, 12 + (i % 3) * 5, (i % 7) * 0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Солома: короткие штрихи в разные стороны.
  ctx.lineWidth = 1.8
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 61) % w
    const y = (i * 103) % h
    const angle = ((i * 37) % 360) * (Math.PI / 180)
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(186, 156, 104, 0.45)' : 'rgba(150, 124, 82, 0.3)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * 13, y - Math.sin(angle) * 7)
    ctx.stroke()
  }

  // Свет из открытой двери: мягкое пятно справа, без резкой границы.
  const door = ctx.createRadialGradient(w * 0.88, h * 0.16, 10, w * 0.88, h * 0.16, h * 0.85)
  door.addColorStop(0, 'rgba(230, 204, 152, 0.26)')
  door.addColorStop(1, 'rgba(230, 204, 152, 0)')
  ctx.fillStyle = door
  ctx.fillRect(0, 0, w, h)

  const scale = Math.min(w / 620, h / 340)

  ctx.save()
  ctx.translate(w * 0.48, h * 0.5)
  ctx.rotate(-0.08)
  ctx.scale(scale, scale)
  ctx.translate(20, 0)

  const skin = '#b9895f'
  const shirt = '#6f6858'
  const shirtDark = '#585244'
  const trousers = '#4a3d2f'
  const boot = '#2a2018'
  const outline = 'rgba(26, 16, 10, 0.85)'

  // Мягкая тень под лежащим.
  const shadow = ctx.createRadialGradient(-40, 8, 10, -40, 8, 210)
  shadow.addColorStop(0, 'rgba(0, 0, 0, 0.38)')
  shadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.ellipse(-40, 8, 210, 78, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ноги.
  ctx.strokeStyle = outline
  ctx.lineWidth = 2.4
  ctx.fillStyle = trousers

  // Дальняя нога: бедро, голень, сапог.
  ctx.beginPath()
  ctx.moveTo(0, -18)
  ctx.quadraticCurveTo(52, -16, 78, -2)
  ctx.lineTo(72, 16)
  ctx.quadraticCurveTo(44, 6, 0, 4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(70, -2)
  ctx.quadraticCurveTo(96, 10, 104, 30)
  ctx.lineTo(86, 38)
  ctx.quadraticCurveTo(78, 18, 64, 12)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = boot
  ctx.beginPath()
  ctx.ellipse(106, 40, 17, 9, 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Ближняя нога.
  ctx.fillStyle = trousers
  ctx.beginPath()
  ctx.moveTo(0, 4)
  ctx.quadraticCurveTo(48, 16, 72, 34)
  ctx.lineTo(58, 50)
  ctx.quadraticCurveTo(34, 30, -4, 22)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(66, 34)
  ctx.quadraticCurveTo(82, 50, 84, 66)
  ctx.lineTo(66, 70)
  ctx.quadraticCurveTo(64, 52, 52, 44)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = boot
  ctx.beginPath()
  ctx.ellipse(80, 72, 16, 9, 0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Торс: спина, рубаха.
  ctx.fillStyle = shirt
  ctx.strokeStyle = outline
  ctx.lineWidth = 2.6
  ctx.beginPath()
  ctx.moveTo(-124, -32)
  ctx.quadraticCurveTo(-70, -38, -16, -28)
  ctx.quadraticCurveTo(4, -20, 6, -6)
  ctx.quadraticCurveTo(4, 12, -14, 26)
  ctx.quadraticCurveTo(-70, 40, -122, 24)
  ctx.quadraticCurveTo(-136, -4, -124, -32)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Складки рубахи на спине.
  ctx.strokeStyle = 'rgba(30, 22, 14, 0.3)'
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-96 + i * 24, -26 + i * 2)
    ctx.quadraticCurveTo(-84 + i * 24, -4, -96 + i * 22, 20 + i * 3)
    ctx.stroke()
  }

  // Пояс.
  ctx.fillStyle = shirtDark
  ctx.strokeStyle = outline
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-14, -18)
  ctx.lineTo(6, -12)
  ctx.lineTo(4, 8)
  ctx.lineTo(-18, 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Левая рука вытянута вперёд, к свету.
  ctx.fillStyle = shirt
  ctx.beginPath()
  ctx.moveTo(-118, -26)
  ctx.quadraticCurveTo(-150, -40, -176, -42)
  ctx.lineTo(-178, -26)
  ctx.quadraticCurveTo(-148, -24, -118, -8)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Кисть вытянутой руки: пальцы поджаты, видна тыльная сторона с костяшками.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.moveTo(-178, -36)
  ctx.quadraticCurveTo(-188, -43, -197, -39)
  ctx.quadraticCurveTo(-203, -34, -199, -27)
  ctx.quadraticCurveTo(-190, -21, -181, -26)
  ctx.quadraticCurveTo(-176, -31, -178, -36)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Костяшки: четыре бугорка по краю, без отдельных пальцев.
  ctx.strokeStyle = 'rgba(70, 46, 30, 0.55)'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath()
    ctx.arc(-196 + i * 4.6, -38 + i * 1.1, 2.4, -2.4, 0.6)
    ctx.stroke()
  }

  // Складки на тыльной стороне.
  ctx.beginPath()
  ctx.moveTo(-193, -33)
  ctx.quadraticCurveTo(-188, -29, -184, -29)
  ctx.moveTo(-191, -30)
  ctx.quadraticCurveTo(-187, -27, -183, -27)
  ctx.stroke()

  // Большой палец поджат сбоку.
  ctx.fillStyle = skin
  ctx.strokeStyle = outline
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(-183, -24, 6, 4, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Тень под кистью.
  ctx.fillStyle = 'rgba(24, 16, 10, 0.25)'
  ctx.beginPath()
  ctx.ellipse(-192, -22, 15, 5, 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Шея.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.roundRect(-130, -16, 14, 26, 6)
  ctx.fill()
  ctx.stroke()

  // Голова лежит щекой: видно затылок и ухо.
  ctx.beginPath()
  ctx.ellipse(-150, -4, 24, 21, -0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Волосы.
  ctx.fillStyle = '#3b2a1c'
  ctx.beginPath()
  ctx.ellipse(-154, -12, 22, 17, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = 'rgba(90, 66, 42, 0.6)'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-168 + i * 4, -20 + (i % 3) * 3)
    ctx.quadraticCurveTo(-160 + i * 4, -10, -166 + i * 4, -2)
    ctx.stroke()
  }

  // Ухо.
  ctx.fillStyle = skin
  ctx.strokeStyle = 'rgba(60, 38, 24, 0.8)'
  ctx.beginPath()
  ctx.ellipse(-132, -2, 4, 6, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Линия челюсти у земли.
  ctx.beginPath()
  ctx.moveTo(-140, 10)
  ctx.quadraticCurveTo(-150, 16, -160, 12)
  ctx.stroke()

  ctx.restore()

  // Пара соломинок поверх тела.
  ctx.strokeStyle = 'rgba(186, 156, 104, 0.45)'
  ctx.lineWidth = 1.8
  for (let i = 0; i < 5; i += 1) {
    const x = w * (0.34 + i * 0.06)
    const y = h * (0.42 + (i % 2) * 0.05)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 12, y - 4)
    ctx.stroke()
  }

  vignette(ctx, w, h, 0.6)
}

/** Кисть руки: ладонь, четыре пальца и большой, с лёгким изгибом. */
function drawOpenHand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  angle: number,
  mirror = 1,
): void {
  const skin = '#b78c69'
  const shade = '#8f6647'
  const edge = 'rgba(42, 28, 18, 0.85)'
  const palmW = 26 * scale
  const palmH = 32 * scale

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.scale(mirror, 1)

  // Ладонь: не круг, а скошенный пятиугольник.
  ctx.fillStyle = skin
  ctx.strokeStyle = edge
  ctx.lineWidth = 1.6 * scale
  ctx.beginPath()
  ctx.moveTo(-palmW * 0.9, palmH * 0.55)
  ctx.quadraticCurveTo(-palmW * 1.05, -palmH * 0.1, -palmW * 0.7, -palmH * 0.55)
  ctx.quadraticCurveTo(0, -palmH * 0.75, palmW * 0.7, -palmH * 0.5)
  ctx.quadraticCurveTo(palmW * 1.02, palmH * 0.1, palmW * 0.85, palmH * 0.6)
  ctx.quadraticCurveTo(0, palmH * 0.95, -palmW * 0.9, palmH * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Тень у основания пальцев.
  ctx.fillStyle = shade
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.ellipse(0, -palmH * 0.2, palmW * 0.75, palmH * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Пальцы.
  const fingers = [
    { x: -palmW * 0.55, len: 1.45, tilt: -0.28, w: 0.36 },
    { x: -palmW * 0.16, len: 1.62, tilt: -0.1, w: 0.36 },
    { x: palmW * 0.22, len: 1.55, tilt: 0.08, w: 0.35 },
    { x: palmW * 0.58, len: 1.25, tilt: 0.26, w: 0.32 },
  ]

  for (const finger of fingers) {
    ctx.save()
    ctx.translate(finger.x, -palmH * 0.55)
    ctx.rotate(finger.tilt)
    const fw = palmW * finger.w
    const flen = palmH * finger.len

    ctx.fillStyle = skin
    ctx.strokeStyle = edge
    ctx.lineWidth = 1.5 * scale
    ctx.beginPath()
    ctx.roundRect(-fw / 2, -flen, fw, flen, fw * 0.48)
    ctx.fill()
    ctx.stroke()

    // Складки сгибов.
    ctx.strokeStyle = 'rgba(70, 46, 30, 0.45)'
    ctx.lineWidth = 1 * scale
    for (let joint = 1; joint <= 2; joint += 1) {
      const jy = -flen + (flen * joint) / 3
      ctx.beginPath()
      ctx.moveTo(-fw * 0.38, jy)
      ctx.lineTo(fw * 0.38, jy)
      ctx.stroke()
    }

    // Блик.
    ctx.fillStyle = 'rgba(255, 230, 200, 0.12)'
    ctx.beginPath()
    ctx.roundRect(-fw * 0.28, -flen + fw * 0.2, fw * 0.2, flen * 0.6, fw * 0.1)
    ctx.fill()

    ctx.restore()
  }

  // Большой палец.
  ctx.save()
  ctx.translate(palmW * 0.78, palmH * 0.05)
  ctx.rotate(0.75)
  ctx.fillStyle = skin
  ctx.strokeStyle = edge
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.roundRect(-palmW * 0.18, -palmH * 0.42, palmW * 0.36, palmH * 0.8, palmW * 0.18)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.restore()
}

const FATHER: Draw = (ctx, w, h) => {
  // Тёмная изба и балка над головой.
  backdrop(ctx, w, h, '#221a12', '#0a0705')

  ctx.fillStyle = '#171009'
  ctx.fillRect(0, 0, w, h * 0.18)
  ctx.strokeStyle = 'rgba(120, 92, 58, 0.16)'
  ctx.lineWidth = 2
  for (let y = h * 0.2; y < h * 0.75; y += h * 0.12) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Свет костра снизу.
  const fire = ctx.createRadialGradient(w * 0.52, h * 1.05, 12, w * 0.52, h * 1.05, h * 0.95)
  fire.addColorStop(0, 'rgba(232, 158, 76, 0.34)')
  fire.addColorStop(0.6, 'rgba(190, 110, 50, 0.12)')
  fire.addColorStop(1, 'rgba(190, 110, 50, 0)')
  ctx.fillStyle = fire
  ctx.fillRect(0, 0, w, h)

  // Холодный свет из щели в крыше — мягкое пятно, а не полоса поперёк лица.
  ctx.globalAlpha = 0.04
  ctx.fillStyle = '#cfd8d4'
  ctx.beginPath()
  ctx.ellipse(w * 0.74, h * 0.06, w * 0.12, h * 0.14, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Плечи в грубой рубахе.
  ctx.fillStyle = '#4a4136'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 1.22, w * 0.44, h * 0.46, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(120, 105, 86, 0.25)'
  ctx.lineWidth = 2
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath()
    ctx.moveTo(w * 0.5 + i * w * 0.06, h * 0.84)
    ctx.lineTo(w * 0.5 + i * w * 0.075, h)
    ctx.stroke()
  }

  // Шея.
  ctx.fillStyle = '#a97c58'
  ctx.beginPath()
  ctx.roundRect(w * 0.45, h * 0.6, w * 0.1, h * 0.2, w * 0.02)
  ctx.fill()

  // Голова: наклонена к тебе, видна снизу.
  ctx.save()
  ctx.translate(w * 0.5, h * 0.42)
  ctx.rotate(-0.05)

  const faceW = w * 0.155
  const faceH = h * 0.205

  ctx.fillStyle = '#b68a63'
  ctx.strokeStyle = 'rgba(48, 30, 18, 0.9)'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(-faceW, -faceH * 0.15)
  ctx.quadraticCurveTo(-faceW * 1.02, faceH * 0.55, -faceW * 0.42, faceH * 0.92)
  ctx.quadraticCurveTo(0, faceH * 1.08, faceW * 0.42, faceH * 0.92)
  ctx.quadraticCurveTo(faceW * 1.02, faceH * 0.55, faceW, -faceH * 0.15)
  ctx.quadraticCurveTo(0, -faceH * 0.95, -faceW, -faceH * 0.15)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Тень на левой щеке, тёплый свет на правой.
  ctx.fillStyle = 'rgba(70, 45, 28, 0.35)'
  ctx.beginPath()
  ctx.ellipse(-faceW * 0.5, faceH * 0.15, faceW * 0.45, faceH * 0.5, -0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(240, 190, 130, 0.14)'
  ctx.beginPath()
  ctx.ellipse(faceW * 0.52, faceH * 0.1, faceW * 0.4, faceH * 0.45, 0.2, 0, Math.PI * 2)
  ctx.fill()

  // Лысина с бликом.
  ctx.fillStyle = 'rgba(255, 235, 205, 0.1)'
  ctx.beginPath()
  ctx.ellipse(0, -faceH * 0.5, faceW * 0.6, faceH * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  // Седина по бокам: узкие пряди у самого края головы.
  ctx.fillStyle = 'rgba(198, 190, 174, 0.5)'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(
      side * faceW * 0.95,
      -faceH * 0.05,
      faceW * 0.1,
      faceH * 0.36,
      side * 0.1,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // Брови: тяжёлые, седые.
  ctx.strokeStyle = 'rgba(176, 168, 152, 0.95)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-faceW * 0.62, -faceH * 0.16)
  ctx.quadraticCurveTo(-faceW * 0.3, -faceH * 0.27, -faceW * 0.08, -faceH * 0.16)
  ctx.moveTo(faceW * 0.08, -faceH * 0.16)
  ctx.quadraticCurveTo(faceW * 0.3, -faceH * 0.27, faceW * 0.62, -faceH * 0.16)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Глаза: глубоко посаженные, с тяжёлым веком.
  for (const side of [-1, 1]) {
    const ex = side * faceW * 0.34
    ctx.fillStyle = 'rgba(230, 220, 205, 0.9)'
    ctx.beginPath()
    ctx.ellipse(ex, -faceH * 0.03, faceW * 0.16, faceH * 0.055, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#3a2a1c'
    ctx.beginPath()
    ctx.arc(ex, -faceH * 0.03, faceW * 0.07, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 250, 240, 0.75)'
    ctx.beginPath()
    ctx.arc(ex - faceW * 0.02, -faceH * 0.045, faceW * 0.022, 0, Math.PI * 2)
    ctx.fill()

    // Верхнее веко.
    ctx.strokeStyle = 'rgba(60, 40, 26, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ex - faceW * 0.17, -faceH * 0.06)
    ctx.quadraticCurveTo(ex, -faceH * 0.12, ex + faceW * 0.17, -faceH * 0.06)
    ctx.stroke()

    // Мешки и морщины.
    ctx.strokeStyle = 'rgba(120, 80, 52, 0.55)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(ex - faceW * 0.14, faceH * 0.03)
    ctx.quadraticCurveTo(ex, faceH * 0.08, ex + faceW * 0.14, faceH * 0.03)
    ctx.stroke()
  }

  // Нос: длинный, с горбинкой.
  ctx.fillStyle = '#b08560'
  ctx.strokeStyle = 'rgba(60, 38, 24, 0.7)'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(-faceW * 0.06, -faceH * 0.09)
  ctx.quadraticCurveTo(faceW * 0.02, faceH * 0.1, -faceW * 0.1, faceH * 0.17)
  ctx.quadraticCurveTo(0, faceH * 0.24, faceW * 0.12, faceH * 0.16)
  ctx.stroke()

  // Морщины на лбу.
  ctx.strokeStyle = 'rgba(110, 74, 48, 0.45)'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-faceW * 0.42, -faceH * (0.36 + i * 0.06))
    ctx.quadraticCurveTo(0, -faceH * (0.42 + i * 0.06), faceW * 0.42, -faceH * (0.36 + i * 0.06))
    ctx.stroke()
  }

  // Усы: тяжёлые, свисают по сторонам рта.
  ctx.fillStyle = 'rgba(200, 192, 176, 0.98)'
  ctx.beginPath()
  ctx.moveTo(-faceW * 0.5, faceH * 0.3)
  ctx.quadraticCurveTo(-faceW * 0.2, faceH * 0.14, 0, faceH * 0.2)
  ctx.quadraticCurveTo(faceW * 0.2, faceH * 0.14, faceW * 0.5, faceH * 0.3)
  ctx.quadraticCurveTo(faceW * 0.3, faceH * 0.44, faceW * 0.06, faceH * 0.36)
  ctx.quadraticCurveTo(0, faceH * 0.33, -faceW * 0.06, faceH * 0.36)
  ctx.quadraticCurveTo(-faceW * 0.3, faceH * 0.44, -faceW * 0.5, faceH * 0.3)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(150, 142, 126, 0.5)'
  ctx.lineWidth = 1.2
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath()
    ctx.moveTo(i * faceW * 0.12, faceH * 0.23)
    ctx.lineTo(i * faceW * 0.14, faceH * 0.34)
    ctx.stroke()
  }

  // Рот: опущенные уголки, тревога.
  ctx.strokeStyle = 'rgba(58, 34, 22, 0.9)'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(-faceW * 0.22, faceH * 0.42)
  ctx.quadraticCurveTo(0, faceH * 0.37, faceW * 0.22, faceH * 0.42)
  ctx.stroke()

  // Борода: тяжёлая, неровная, с прядями.
  ctx.fillStyle = 'rgba(178, 172, 158, 0.95)'
  ctx.beginPath()
  ctx.moveTo(-faceW * 0.88, faceH * 0.34)
  ctx.quadraticCurveTo(-faceW * 0.95, faceH * 1.05, -faceW * 0.2, faceH * 1.35)
  ctx.quadraticCurveTo(0, faceH * 1.45, faceW * 0.2, faceH * 1.35)
  ctx.quadraticCurveTo(faceW * 0.95, faceH * 1.05, faceW * 0.88, faceH * 0.34)
  ctx.quadraticCurveTo(faceW * 0.45, faceH * 0.62, 0, faceH * 0.6)
  ctx.quadraticCurveTo(-faceW * 0.45, faceH * 0.62, -faceW * 0.88, faceH * 0.34)
  ctx.closePath()
  ctx.fill()

  // Тени в бороде.
  ctx.strokeStyle = 'rgba(120, 112, 98, 0.5)'
  ctx.lineWidth = 1.2
  for (let i = -5; i <= 5; i += 1) {
    ctx.beginPath()
    ctx.moveTo(i * faceW * 0.14, faceH * 0.7)
    ctx.quadraticCurveTo(i * faceW * 0.17, faceH * 1.05, i * faceW * 0.12, faceH * 1.34)
    ctx.stroke()
  }

  ctx.restore()

  vignette(ctx, w, h, 0.6)
}

const NOEXIT: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#17130f', '#050403')

  // Свет из щели: холодная полоса сверху, тепло снизу.
  const slit = ctx.createLinearGradient(0, 0, 0, h * 0.45)
  slit.addColorStop(0, 'rgba(206, 218, 220, 0.14)')
  slit.addColorStop(1, 'rgba(206, 218, 220, 0)')
  ctx.fillStyle = slit
  ctx.fillRect(0, 0, w, h * 0.45)

  const warm = ctx.createRadialGradient(w * 0.5, h * 1.1, 10, w * 0.5, h * 1.1, h * 0.7)
  warm.addColorStop(0, 'rgba(226, 150, 70, 0.2)')
  warm.addColorStop(1, 'rgba(226, 150, 70, 0)')
  ctx.fillStyle = warm
  ctx.fillRect(0, 0, w, h)

  // Пустая рамка меню, которого нет: только контур и серые места под кнопки.
  const mx = w * 0.27
  const my = h * 0.16
  const mw = w * 0.46
  const mh = h * 0.3

  ctx.strokeStyle = 'rgba(200, 214, 214, 0.12)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 8])
  ctx.beginPath()
  ctx.roundRect(mx, my, mw, mh, 6)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = 'rgba(200, 214, 214, 0.04)'
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath()
    ctx.roundRect(mx + mw * 0.08, my + mh * (0.16 + i * 0.26), mw * 0.84, mh * 0.14, 3)
    ctx.fill()
  }

  // Дым между лицами и руками.
  ctx.strokeStyle = 'rgba(190, 190, 185, 0.06)'
  ctx.lineWidth = 18
  ctx.lineCap = 'round'
  for (const baseX of [w * 0.42, w * 0.58]) {
    ctx.beginPath()
    ctx.moveTo(baseX, h * 0.95)
    ctx.bezierCurveTo(baseX - w * 0.06, h * 0.66, baseX + w * 0.08, h * 0.46, baseX, h * 0.24)
    ctx.stroke()
  }
  ctx.lineCap = 'butt'

  // Руки перед лицом: ближняя крупнее, дальняя меньше и выше. Предплечья уходят вниз.
  ctx.fillStyle = '#a97f5d'
  ctx.strokeStyle = 'rgba(42, 28, 18, 0.8)'
  ctx.lineWidth = 3

  ctx.beginPath()
  ctx.moveTo(w * 0.24, h * 1.02)
  ctx.lineTo(w * 0.26, h * 0.9)
  ctx.quadraticCurveTo(w * 0.33, h * 0.84, w * 0.4, h * 0.9)
  ctx.lineTo(w * 0.44, h * 1.02)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(w * 0.6, h * 1.02)
  ctx.lineTo(w * 0.63, h * 0.82)
  ctx.quadraticCurveTo(w * 0.68, h * 0.76, w * 0.73, h * 0.83)
  ctx.lineTo(w * 0.76, h * 1.02)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  drawOpenHand(ctx, w * 0.33, h * 0.92, 2.0, -0.16, -1)
  drawOpenHand(ctx, w * 0.68, h * 0.84, 1.6, 0.2, 1)

  // Холодный контровой свет по верхним фалангам.
  ctx.strokeStyle = 'rgba(206, 220, 220, 0.14)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.2, h * 0.55)
  ctx.lineTo(w * 0.3, h * 0.44)
  ctx.moveTo(w * 0.6, h * 0.48)
  ctx.lineTo(w * 0.72, h * 0.5)
  ctx.stroke()

  vignette(ctx, w, h, 0.78)
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
