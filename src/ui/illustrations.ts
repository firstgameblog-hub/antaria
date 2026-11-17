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

/** Староста: старик с посохом, утро, деревня за спиной. */
const HEADMAN: Draw = (ctx, w, h) => {
  // Утреннее небо.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55)
  sky.addColorStop(0, '#8b949a')
  sky.addColorStop(0.6, '#b9bcb2')
  sky.addColorStop(1, '#d6d2c2')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * 0.55)

  // Солнце сквозь дымку.
  const sun = ctx.createRadialGradient(w * 0.2, h * 0.12, 4, w * 0.2, h * 0.12, h * 0.5)
  sun.addColorStop(0, 'rgba(255, 240, 205, 0.5)')
  sun.addColorStop(1, 'rgba(255, 240, 205, 0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h * 0.6)

  // Дальние крыши.
  ctx.fillStyle = '#6b6255'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.44)
  ctx.lineTo(w * 0.16, h * 0.36)
  ctx.lineTo(w * 0.3, h * 0.42)
  ctx.lineTo(w * 0.46, h * 0.34)
  ctx.lineTo(w * 0.62, h * 0.42)
  ctx.lineTo(w * 0.78, h * 0.36)
  ctx.lineTo(w, h * 0.44)
  ctx.lineTo(w, h * 0.56)
  ctx.lineTo(0, h * 0.56)
  ctx.closePath()
  ctx.fill()

  // Дым над крышами.
  ctx.strokeStyle = 'rgba(220, 220, 214, 0.12)'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  for (const x of [w * 0.2, w * 0.68]) {
    ctx.beginPath()
    ctx.moveTo(x, h * 0.36)
    ctx.bezierCurveTo(x + 14, h * 0.3, x - 10, h * 0.24, x + 8, h * 0.16)
    ctx.stroke()
  }
  ctx.lineCap = 'butt'

  // Земля.
  ctx.fillStyle = '#5d5344'
  ctx.fillRect(0, h * 0.55, w, h * 0.45)

  // Частокол за спиной.
  ctx.fillStyle = '#4a3d2e'
  for (let x = 0; x < w; x += w * 0.028) {
    const postH = h * 0.1 + ((x * 11) % 9)
    ctx.fillRect(x, h * 0.56 - postH, w * 0.016, postH)
  }

  // Фигура старосты: стоит, опираясь на посох.
  const coat = '#584c3e'
  const coatDark = '#3f3629'
  const skin = '#b68a63'
  const outline = 'rgba(30, 20, 12, 0.85)'

  // Посох (за рукой, но перед кафтаном).
  ctx.strokeStyle = '#5b452c'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(w * 0.63, h * 0.1)
  ctx.lineTo(w * 0.615, h * 0.94)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // Ноги.
  ctx.fillStyle = '#3b3128'
  ctx.strokeStyle = outline
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(w * 0.445, h * 0.72)
  ctx.lineTo(w * 0.44, h * 0.9)
  ctx.lineTo(w * 0.472, h * 0.9)
  ctx.lineTo(w * 0.482, h * 0.72)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(w * 0.518, h * 0.72)
  ctx.lineTo(w * 0.528, h * 0.9)
  ctx.lineTo(w * 0.56, h * 0.9)
  ctx.lineTo(w * 0.555, h * 0.72)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Сапоги.
  ctx.fillStyle = '#2a2119'
  ctx.beginPath()
  ctx.ellipse(w * 0.455, h * 0.905, w * 0.028, h * 0.016, 0, 0, Math.PI * 2)
  ctx.ellipse(w * 0.54, h * 0.905, w * 0.028, h * 0.016, 0, 0, Math.PI * 2)
  ctx.fill()

  // Кафтан: от плеч к подолу, чуть расширяется.
  ctx.fillStyle = coat
  ctx.strokeStyle = outline
  ctx.lineWidth = 2.6
  ctx.beginPath()
  ctx.moveTo(w * 0.4, h * 0.38)
  ctx.quadraticCurveTo(w * 0.37, h * 0.55, w * 0.365, h * 0.73)
  ctx.lineTo(w * 0.635, h * 0.73)
  ctx.quadraticCurveTo(w * 0.63, h * 0.55, w * 0.6, h * 0.38)
  ctx.quadraticCurveTo(w * 0.5, h * 0.33, w * 0.4, h * 0.38)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Тень на левой половине кафтана.
  ctx.fillStyle = coatDark
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.moveTo(w * 0.4, h * 0.38)
  ctx.quadraticCurveTo(w * 0.37, h * 0.55, w * 0.365, h * 0.73)
  ctx.lineTo(w * 0.48, h * 0.73)
  ctx.lineTo(w * 0.47, h * 0.37)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Пояс.
  ctx.fillStyle = '#33281c'
  ctx.fillRect(w * 0.375, h * 0.53, w * 0.255, h * 0.022)
  ctx.strokeStyle = 'rgba(20, 14, 8, 0.6)'
  ctx.lineWidth = 1.2
  ctx.strokeRect(w * 0.375, h * 0.53, w * 0.255, h * 0.022)

  // Рукав и рука на посохе.
  ctx.fillStyle = coat
  ctx.strokeStyle = outline
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(w * 0.585, h * 0.4)
  ctx.quadraticCurveTo(w * 0.63, h * 0.44, w * 0.635, h * 0.5)
  ctx.lineTo(w * 0.6, h * 0.51)
  ctx.quadraticCurveTo(w * 0.58, h * 0.46, w * 0.555, h * 0.44)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(w * 0.622, h * 0.5, w * 0.017, h * 0.02, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Вторая рука вдоль тела.
  ctx.fillStyle = coat
  ctx.beginPath()
  ctx.moveTo(w * 0.41, h * 0.4)
  ctx.quadraticCurveTo(w * 0.375, h * 0.48, w * 0.385, h * 0.55)
  ctx.lineTo(w * 0.415, h * 0.55)
  ctx.quadraticCurveTo(w * 0.405, h * 0.47, w * 0.435, h * 0.41)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Шея и воротник.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.roundRect(w * 0.487, h * 0.33, w * 0.026, h * 0.055, 3)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#cfc7b6'
  ctx.beginPath()
  ctx.moveTo(w * 0.47, h * 0.375)
  ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.53, h * 0.375)
  ctx.quadraticCurveTo(w * 0.5, h * 0.39, w * 0.47, h * 0.375)
  ctx.fill()

  // Голова.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.275, w * 0.042, h * 0.048, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Борода: ниже подбородка, тяжёлая.
  ctx.fillStyle = 'rgba(206, 198, 182, 0.95)'
  ctx.beginPath()
  ctx.moveTo(w * 0.462, h * 0.29)
  ctx.quadraticCurveTo(w * 0.5, h * 0.365, w * 0.538, h * 0.29)
  ctx.quadraticCurveTo(w * 0.52, h * 0.33, w * 0.5, h * 0.34)
  ctx.quadraticCurveTo(w * 0.48, h * 0.33, w * 0.462, h * 0.29)
  ctx.closePath()
  ctx.fill()

  // Шапка с меховой опушкой.
  ctx.fillStyle = '#4a3b2b'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.245, w * 0.048, h * 0.036, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#6b5a44'
  ctx.fillRect(w * 0.452, h * 0.24, w * 0.096, h * 0.014)

  // Глаза под шапкой — две короткие тени.
  ctx.strokeStyle = 'rgba(40, 26, 16, 0.85)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(w * 0.478, h * 0.27)
  ctx.lineTo(w * 0.488, h * 0.268)
  ctx.moveTo(w * 0.512, h * 0.268)
  ctx.lineTo(w * 0.522, h * 0.27)
  ctx.stroke()

  // Тёплый свет утра сбоку.
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#ffe9bd'
  ctx.beginPath()
  ctx.moveTo(w * 0.16, 0)
  ctx.lineTo(w * 0.42, 0)
  ctx.lineTo(w * 0.34, h)
  ctx.lineTo(w * 0.06, h)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  vignette(ctx, w, h, 0.55)
}

/** Протекающая крыша: изба, капли, женщина под стрехой. */
const MARTA_ROOF: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#9aa0a0', '#4c463a')

  // Изба справа.
  const hx = w * 0.42
  const hy = h * 0.3
  const hw = w * 0.5
  const hh = h * 0.5

  ctx.fillStyle = '#6b5844'
  ctx.strokeStyle = 'rgba(30, 22, 14, 0.85)'
  ctx.lineWidth = 3
  ctx.fillRect(hx, hy + hh * 0.35, hw, hh * 0.65)
  ctx.strokeRect(hx, hy + hh * 0.35, hw, hh * 0.65)

  // Соломенная крыша с прорехой.
  ctx.fillStyle = '#a89159'
  ctx.beginPath()
  ctx.moveTo(hx - w * 0.04, hy + hh * 0.38)
  ctx.lineTo(hx + hw * 0.5, hy)
  ctx.lineTo(hx + hw + w * 0.04, hy + hh * 0.38)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#8d7a4c'
  ctx.beginPath()
  ctx.moveTo(hx + hw * 0.6, hy + hh * 0.12)
  ctx.lineTo(hx + hw * 0.72, hy + hh * 0.2)
  ctx.lineTo(hx + hw * 0.62, hy + hh * 0.36)
  ctx.lineTo(hx + hw * 0.5, hy + hh * 0.24)
  ctx.closePath()
  ctx.fill()

  // Дверь и окно.
  ctx.fillStyle = '#33261a'
  ctx.fillRect(hx + hw * 0.6, hy + hh * 0.62, hw * 0.16, hh * 0.38)
  ctx.fillStyle = 'rgba(240, 220, 160, 0.35)'
  ctx.fillRect(hx + hw * 0.2, hy + hh * 0.62, hw * 0.12, hh * 0.16)

  // Земля и лужа.
  ctx.fillStyle = '#4e4536'
  ctx.fillRect(0, h * 0.8, w, h * 0.2)
  ctx.fillStyle = 'rgba(96, 120, 120, 0.4)'
  ctx.beginPath()
  ctx.ellipse(hx + hw * 0.18, h * 0.9, w * 0.11, h * 0.03, 0, 0, Math.PI * 2)
  ctx.fill()

  // Капли.
  ctx.strokeStyle = 'rgba(200, 220, 225, 0.5)'
  ctx.lineWidth = 2
  for (let i = 0; i < 5; i += 1) {
    const dx = hx + hw * (0.5 + i * 0.03)
    ctx.beginPath()
    ctx.moveTo(dx, hy + hh * 0.4 + i * 6)
    ctx.lineTo(dx, hy + hh * 0.5 + i * 12)
    ctx.stroke()
  }

  // Женщина в платке под стрехой.
  ctx.fillStyle = '#4a4048'
  ctx.beginPath()
  ctx.ellipse(hx - w * 0.07, h * 0.72, w * 0.045, h * 0.11, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#c09070'
  ctx.beginPath()
  ctx.arc(hx - w * 0.07, h * 0.65, w * 0.025, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#8d5a4a'
  ctx.beginPath()
  ctx.arc(hx - w * 0.07, h * 0.645, w * 0.03, Math.PI, Math.PI * 2)
  ctx.fill()

  vignette(ctx, w, h, 0.55)
}

/** Корней: телега, товар, торговец в плаще. */
const KORNEY: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#a7a79c', '#5a5344')

  // Земля.
  ctx.fillStyle = '#574d3d'
  ctx.fillRect(0, h * 0.74, w, h * 0.26)

  // Телега слева.
  ctx.fillStyle = '#6b533a'
  ctx.strokeStyle = 'rgba(30, 22, 14, 0.8)'
  ctx.lineWidth = 3
  ctx.fillRect(w * 0.06, h * 0.5, w * 0.34, h * 0.16)
  ctx.strokeRect(w * 0.06, h * 0.5, w * 0.34, h * 0.16)

  ctx.fillStyle = '#3f3122'
  ctx.beginPath()
  ctx.arc(w * 0.12, h * 0.72, h * 0.08, 0, Math.PI * 2)
  ctx.arc(w * 0.34, h * 0.72, h * 0.08, 0, Math.PI * 2)
  ctx.fill()

  // Тюки в телеге.
  ctx.fillStyle = '#b9a887'
  ctx.beginPath()
  ctx.ellipse(w * 0.16, h * 0.48, w * 0.07, h * 0.06, 0, 0, Math.PI * 2)
  ctx.ellipse(w * 0.3, h * 0.46, w * 0.06, h * 0.05, 0, 0, Math.PI * 2)
  ctx.fill()

  // Расстеленная ткань с товаром.
  ctx.fillStyle = 'rgba(220, 208, 180, 0.85)'
  ctx.beginPath()
  ctx.moveTo(w * 0.46, h * 0.8)
  ctx.lineTo(w * 0.82, h * 0.74)
  ctx.lineTo(w * 0.88, h * 0.86)
  ctx.lineTo(w * 0.5, h * 0.92)
  ctx.closePath()
  ctx.fill()

  // Верёвка, камень, нож.
  ctx.strokeStyle = '#8f6d42'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(w * 0.56, h * 0.83, w * 0.035, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#8a857c'
  ctx.beginPath()
  ctx.ellipse(w * 0.68, h * 0.83, w * 0.03, h * 0.02, 0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#cfd4d6'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(w * 0.76, h * 0.85)
  ctx.lineTo(w * 0.82, h * 0.82)
  ctx.stroke()

  // Корней: плащ, капюшон, посох-палка.
  ctx.fillStyle = '#4d4335'
  ctx.beginPath()
  ctx.ellipse(w * 0.42, h * 0.62, w * 0.075, h * 0.17, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#b08a63'
  ctx.beginPath()
  ctx.arc(w * 0.42, h * 0.44, w * 0.05, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#5e5140'
  ctx.beginPath()
  ctx.arc(w * 0.42, h * 0.43, w * 0.058, Math.PI, Math.PI * 2)
  ctx.fill()

  vignette(ctx, w, h, 0.5)
}

/** Дорога на юг: колея между жердями, дымка. */
const ROAD: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#b3b3a8', '#6f6552')

  // Поле.
  ctx.fillStyle = '#7d7554'
  ctx.fillRect(0, h * 0.45, w, h * 0.55)

  // Дорога с перспективой.
  ctx.fillStyle = '#8d7c5c'
  ctx.beginPath()
  ctx.moveTo(w * 0.42, h * 0.45)
  ctx.lineTo(w * 0.58, h * 0.45)
  ctx.lineTo(w * 0.92, h)
  ctx.lineTo(w * 0.08, h)
  ctx.closePath()
  ctx.fill()

  // Колеи.
  ctx.strokeStyle = 'rgba(90, 72, 48, 0.55)'
  ctx.lineWidth = 4
  for (const offset of [-0.12, 0.12]) {
    ctx.beginPath()
    ctx.moveTo(w * (0.5 + offset * 0.08), h * 0.46)
    ctx.lineTo(w * (0.5 + offset), h)
    ctx.stroke()
  }

  // Жерди вдоль дороги.
  ctx.strokeStyle = '#5d4a34'
  ctx.lineWidth = 3
  for (let i = 0; i < 8; i += 1) {
    const t = i / 8
    const y = h * (0.5 + t * 0.1)
    const spread = w * (0.2 + t * 0.45)
    ctx.beginPath()
    ctx.moveTo(w * 0.5 - spread, y)
    ctx.lineTo(w * 0.5 - spread, y + h * 0.12)
    ctx.moveTo(w * 0.5 + spread, y)
    ctx.lineTo(w * 0.5 + spread, y + h * 0.12)
    ctx.stroke()
  }

  // Дальние крыши.
  ctx.fillStyle = 'rgba(94, 86, 70, 0.8)'
  ctx.beginPath()
  ctx.moveTo(w * 0.24, h * 0.45)
  ctx.lineTo(w * 0.33, h * 0.38)
  ctx.lineTo(w * 0.42, h * 0.45)
  ctx.closePath()
  ctx.moveTo(w * 0.58, h * 0.45)
  ctx.lineTo(w * 0.67, h * 0.39)
  ctx.lineTo(w * 0.76, h * 0.45)
  ctx.closePath()
  ctx.fill()

  vignette(ctx, w, h, 0.45)
}

/** Стена и башня: то, что защищает. */
const WALL: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#9fa6a8', '#57503f')

  // Земля.
  ctx.fillStyle = '#5b5242'
  ctx.fillRect(0, h * 0.72, w, h * 0.28)

  // Частокол.
  ctx.fillStyle = '#5f4a33'
  for (let x = 0; x < w; x += w * 0.026) {
    const postH = h * (0.28 + ((x * 13) % 11) / 100)
    ctx.fillRect(x, h * 0.72 - postH, w * 0.016, postH)
  }

  // Башня справа.
  const tx = w * 0.66
  const tw = w * 0.16
  const ty = h * 0.2

  ctx.fillStyle = '#8f8a80'
  ctx.strokeStyle = 'rgba(30, 24, 16, 0.8)'
  ctx.lineWidth = 3
  ctx.fillRect(tx, ty + h * 0.1, tw, h * 0.52)
  ctx.strokeRect(tx, ty + h * 0.1, tw, h * 0.52)

  // Кладка.
  ctx.strokeStyle = 'rgba(40, 32, 22, 0.25)'
  ctx.lineWidth = 1.5
  for (let row = 1; row < 5; row += 1) {
    const y = ty + h * 0.1 + (h * 0.52 * row) / 5
    ctx.beginPath()
    ctx.moveTo(tx, y)
    ctx.lineTo(tx + tw, y)
    ctx.stroke()
  }

  // Крыша и флаг.
  ctx.fillStyle = '#6b4a37'
  ctx.beginPath()
  ctx.moveTo(tx - tw * 0.15, ty + h * 0.12)
  ctx.lineTo(tx + tw * 0.5, ty - h * 0.02)
  ctx.lineTo(tx + tw * 1.15, ty + h * 0.12)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = '#4a3a2a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(tx + tw * 0.5, ty - h * 0.02)
  ctx.lineTo(tx + tw * 0.5, ty - h * 0.14)
  ctx.stroke()

  ctx.fillStyle = '#a8503f'
  ctx.beginPath()
  ctx.moveTo(tx + tw * 0.5, ty - h * 0.14)
  ctx.lineTo(tx + tw * 0.86, ty - h * 0.1)
  ctx.lineTo(tx + tw * 0.5, ty - h * 0.05)
  ctx.closePath()
  ctx.fill()

  // Ворота слева.
  ctx.fillStyle = '#3f3122'
  ctx.fillRect(w * 0.18, h * 0.62, w * 0.14, h * 0.1)

  vignette(ctx, w, h, 0.5)
}

/** Зима: крыши под снегом, дым, снежинки. */
const WINTER: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#b9c2c4', '#6f7a7a')

  // Снег на земле.
  ctx.fillStyle = '#e8eeec'
  ctx.fillRect(0, h * 0.6, w, h * 0.4)

  // Избы.
  const huts = [
    { x: 0.08, w: 0.22 },
    { x: 0.38, w: 0.26 },
    { x: 0.7, w: 0.2 },
  ]

  for (const hut of huts) {
    const hx = w * hut.x
    const hw = w * hut.w
    const hy = h * 0.48

    ctx.fillStyle = '#5b4a39'
    ctx.fillRect(hx, hy, hw, h * 0.16)

    ctx.fillStyle = '#4a3b2d'
    ctx.beginPath()
    ctx.moveTo(hx - hw * 0.08, hy)
    ctx.lineTo(hx + hw * 0.5, hy - h * 0.13)
    ctx.lineTo(hx + hw * 1.08, hy)
    ctx.closePath()
    ctx.fill()

    // Снег на крыше.
    ctx.fillStyle = '#f2f6f4'
    ctx.beginPath()
    ctx.moveTo(hx - hw * 0.06, hy - h * 0.01)
    ctx.lineTo(hx + hw * 0.5, hy - h * 0.14)
    ctx.lineTo(hx + hw * 1.06, hy - h * 0.01)
    ctx.lineTo(hx + hw * 0.96, hy - h * 0.03)
    ctx.lineTo(hx + hw * 0.5, hy - h * 0.11)
    ctx.lineTo(hx + hw * 0.04, hy - h * 0.03)
    ctx.closePath()
    ctx.fill()

    // Дым.
    ctx.strokeStyle = 'rgba(230, 236, 234, 0.4)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(hx + hw * 0.7, hy - h * 0.1)
    ctx.bezierCurveTo(hx + hw * 0.8, hy - h * 0.2, hx + hw * 0.6, hy - h * 0.26, hx + hw * 0.74, hy - h * 0.34)
    ctx.stroke()
  }

  // Снежинки.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 137) % w
    const y = (i * 71) % h
    ctx.beginPath()
    ctx.arc(x, y, i % 4 === 0 ? 1.8 : 1.1, 0, Math.PI * 2)
    ctx.fill()
  }

  vignette(ctx, w, h, 0.35)
}

/** Костёр вечером: огонь и силуэты вокруг. */
const CAMPFIRE: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#1a1712', '#0a0806')

  // Силуэты изб.
  ctx.fillStyle = '#221c15'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.62)
  ctx.lineTo(w * 0.16, h * 0.48)
  ctx.lineTo(w * 0.34, h * 0.62)
  ctx.lineTo(w * 0.5, h * 0.5)
  ctx.lineTo(w * 0.68, h * 0.62)
  ctx.lineTo(w * 0.86, h * 0.46)
  ctx.lineTo(w, h * 0.62)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // Огонь.
  const fire = ctx.createRadialGradient(w * 0.5, h * 0.78, 6, w * 0.5, h * 0.78, h * 0.5)
  fire.addColorStop(0, 'rgba(240, 170, 80, 0.45)')
  fire.addColorStop(1, 'rgba(240, 170, 80, 0)')
  ctx.fillStyle = fire
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = '#e08a3c'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.8, w * 0.02, h * 0.05, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f6d79a'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.8, w * 0.01, h * 0.03, 0, 0, Math.PI * 2)
  ctx.fill()

  // Искры.
  ctx.fillStyle = 'rgba(246, 200, 130, 0.7)'
  for (let i = 0; i < 12; i += 1) {
    const y = h * (0.7 - (i % 6) * 0.06)
    const x = w * (0.48 + Math.sin(i) * 0.05)
    ctx.beginPath()
    ctx.arc(x, y, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Силуэты у огня.
  const figures = [0.3, 0.36, 0.64, 0.7]
  for (const fx of figures) {
    const fy = h * 0.84
    ctx.fillStyle = 'rgba(14, 11, 8, 0.9)'
    ctx.beginPath()
    ctx.ellipse(w * fx, fy, w * 0.022, h * 0.045, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(w * fx - w * 0.022, fy + h * 0.04)
    ctx.quadraticCurveTo(w * fx, fy - h * 0.08, w * fx + w * 0.022, fy + h * 0.04)
    ctx.closePath()
    ctx.fill()
  }

  vignette(ctx, w, h, 0.6)
}

/** Ты поднимаешься и оглядываешься: утро, деревня, люди. */
const RISING: Draw = (ctx, w, h) => {
  backdrop(ctx, w, h, '#9aa3a4', '#cfc9b6')

  // Облака: рваные полосы утреннего неба.
  ctx.fillStyle = 'rgba(228, 226, 216, 0.3)'
  for (let i = 0; i < 5; i += 1) {
    const y = h * (0.06 + i * 0.055)
    ctx.beginPath()
    ctx.ellipse(w * (0.2 + i * 0.16), y, w * (0.16 + (i % 3) * 0.05), h * 0.02, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Солнце сквозь дымку.
  const sun = ctx.createRadialGradient(w * 0.78, h * 0.12, 4, w * 0.78, h * 0.12, h * 0.45)
  sun.addColorStop(0, 'rgba(255, 240, 205, 0.45)')
  sun.addColorStop(1, 'rgba(255, 240, 205, 0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h * 0.6)

  // Утренняя дымка.
  const haze = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.7)
  haze.addColorStop(0, 'rgba(232, 230, 216, 0.55)')
  haze.addColorStop(1, 'rgba(232, 230, 216, 0)')
  ctx.fillStyle = haze
  ctx.fillRect(0, h * 0.3, w, h * 0.45)

  // Дальние избы.
  ctx.fillStyle = '#6f6250'
  for (const hut of [
    { x: 0.04, w: 0.2 },
    { x: 0.3, w: 0.16 },
    { x: 0.66, w: 0.2 },
    { x: 0.86, w: 0.12 },
  ]) {
    const hx = w * hut.x
    const hw = w * hut.w
    ctx.fillRect(hx, h * 0.44, hw, h * 0.12)
    ctx.beginPath()
    ctx.moveTo(hx - hw * 0.08, h * 0.44)
    ctx.lineTo(hx + hw * 0.5, h * 0.34)
    ctx.lineTo(hx + hw * 1.08, h * 0.44)
    ctx.closePath()
    ctx.fill()
  }

  // Частокол.
  ctx.fillStyle = '#584330'
  for (let x = 0; x < w; x += w * 0.024) {
    const postH = h * 0.09 + ((x * 13) % 8)
    ctx.fillRect(x, h * 0.58 - postH, w * 0.014, postH)
  }

  // Земля.
  ctx.fillStyle = '#6d6450'
  ctx.fillRect(0, h * 0.58, w, h * 0.42)

  // Костёр слева.
  const fire = ctx.createRadialGradient(w * 0.24, h * 0.62, 3, w * 0.24, h * 0.62, h * 0.24)
  fire.addColorStop(0, 'rgba(240, 170, 80, 0.4)')
  fire.addColorStop(1, 'rgba(240, 170, 80, 0)')
  ctx.fillStyle = fire
  ctx.fillRect(0, h * 0.35, w * 0.5, h * 0.5)

  ctx.fillStyle = '#dd8a3e'
  ctx.beginPath()
  ctx.ellipse(w * 0.24, h * 0.63, w * 0.008, h * 0.025, 0, 0, Math.PI * 2)
  ctx.fill()

  // Две фигуры у огня — смотрят на тебя.
  ctx.fillStyle = 'rgba(38, 30, 22, 0.9)'
  for (const fx of [0.18, 0.3]) {
    ctx.beginPath()
    ctx.ellipse(w * fx, h * 0.63, w * 0.011, h * 0.02, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(w * fx - w * 0.014, h * 0.66)
    ctx.quadraticCurveTo(w * fx, h * 0.58, w * fx + w * 0.014, h * 0.66)
    ctx.closePath()
    ctx.fill()
  }

  // Ты: спиной к нам, только поднялся, голова повёрнута вбок.
  const cx = w * 0.52
  const skin = '#bb8b61'
  const tunic = '#6f6654'
  const tunicDark = '#575043'
  const trousers = '#4a3d2f'
  const outline = 'rgba(28, 20, 12, 0.85)'

  ctx.strokeStyle = outline
  ctx.lineWidth = 2.6

  // Ноги: одна ещё согнута, вторая упирается.
  ctx.fillStyle = trousers
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.045, h * 0.78)
  ctx.quadraticCurveTo(cx - w * 0.06, h * 0.92, cx - w * 0.045, h * 1.04)
  ctx.lineTo(cx - w * 0.008, h * 1.04)
  ctx.quadraticCurveTo(cx - w * 0.016, h * 0.9, cx - w * 0.012, h * 0.79)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx + w * 0.005, h * 0.79)
  ctx.quadraticCurveTo(cx + w * 0.03, h * 0.9, cx + w * 0.05, h * 1.04)
  ctx.lineTo(cx + w * 0.088, h * 1.04)
  ctx.quadraticCurveTo(cx + w * 0.066, h * 0.9, cx + w * 0.048, h * 0.78)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Сапоги.
  ctx.fillStyle = '#2b2119'
  ctx.beginPath()
  ctx.ellipse(cx - w * 0.028, h * 1.03, w * 0.03, h * 0.016, 0, 0, Math.PI * 2)
  ctx.ellipse(cx + w * 0.07, h * 1.03, w * 0.03, h * 0.016, 0, 0, Math.PI * 2)
  ctx.fill()

  // Торс, наклонён вперёд.
  ctx.fillStyle = tunic
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.075, h * 0.55)
  ctx.quadraticCurveTo(cx - w * 0.085, h * 0.68, cx - w * 0.055, h * 0.8)
  ctx.lineTo(cx + w * 0.06, h * 0.8)
  ctx.quadraticCurveTo(cx + w * 0.085, h * 0.68, cx + w * 0.07, h * 0.55)
  ctx.quadraticCurveTo(cx, h * 0.5, cx - w * 0.075, h * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Тень по спине.
  ctx.fillStyle = tunicDark
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.075, h * 0.55)
  ctx.quadraticCurveTo(cx - w * 0.085, h * 0.68, cx - w * 0.055, h * 0.8)
  ctx.lineTo(cx - w * 0.012, h * 0.8)
  ctx.lineTo(cx - w * 0.018, h * 0.53)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Пояс.
  ctx.fillStyle = '#3a2c1e'
  ctx.fillRect(cx - w * 0.07, h * 0.72, w * 0.135, h * 0.02)

  // Рука упирается в землю: по ней видно, что он только поднялся.
  ctx.fillStyle = tunic
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.07, h * 0.57)
  ctx.quadraticCurveTo(cx - w * 0.115, h * 0.72, cx - w * 0.125, h * 0.9)
  ctx.lineTo(cx - w * 0.096, h * 0.905)
  ctx.quadraticCurveTo(cx - w * 0.088, h * 0.75, cx - w * 0.052, h * 0.6)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(cx - w * 0.11, h * 0.915, w * 0.02, h * 0.015, 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Вторая рука свободно опущена, кисть на конце рукава.
  ctx.fillStyle = tunic
  ctx.beginPath()
  ctx.moveTo(cx + w * 0.062, h * 0.57)
  ctx.quadraticCurveTo(cx + w * 0.1, h * 0.66, cx + w * 0.096, h * 0.74)
  ctx.lineTo(cx + w * 0.072, h * 0.74)
  ctx.quadraticCurveTo(cx + w * 0.076, h * 0.66, cx + w * 0.045, h * 0.59)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(cx + w * 0.085, h * 0.755, w * 0.018, h * 0.015, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Шея: короткая и толстая, без жирафьей длины.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.roundRect(cx - w * 0.024, h * 0.468, w * 0.048, h * 0.055, 5)
  ctx.fill()
  ctx.stroke()

  // Голова повёрнута вправо: видно затылок и профиль.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(cx + w * 0.004, h * 0.438, w * 0.04, h * 0.05, 0.08, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Нос и подбородок — по ним видно, что смотрит в сторону.
  ctx.beginPath()
  ctx.moveTo(cx + w * 0.042, h * 0.425)
  ctx.lineTo(cx + w * 0.052, h * 0.437)
  ctx.lineTo(cx + w * 0.04, h * 0.447)
  ctx.stroke()

  // Волосы.
  ctx.fillStyle = '#3b2a1c'
  ctx.beginPath()
  ctx.ellipse(cx - w * 0.004, h * 0.415, w * 0.032, h * 0.036, 0.12, Math.PI * 0.7, Math.PI * 2.1)
  ctx.fill()

  // Тень на земле.
  ctx.fillStyle = 'rgba(24, 18, 10, 0.22)'
  ctx.beginPath()
  ctx.ellipse(cx + w * 0.01, h * 1.04, w * 0.11, h * 0.03, 0, 0, Math.PI * 2)
  ctx.fill()

  vignette(ctx, w, h, 0.42)
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
  headman: HEADMAN,
  rising: RISING,
  marta_roof: MARTA_ROOF,
  korney: KORNEY,
  road: ROAD,
  wall: WALL,
  winter: WINTER,
  campfire: CAMPFIRE,
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
