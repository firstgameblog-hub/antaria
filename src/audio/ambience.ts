/**
 * Окружение (4.4.3): ветер и костёр.
 *
 * Костёр есть всегда — это центр деревни. Ветер и треск идут тихо,
 * чтобы не превращаться в шумовую завесу.
 */

import { audio, type AudioBuses } from './engine'

function crackle(buses: AudioBuses, destination: GainNode): void {
  const { ctx, noise } = buses

  const source = ctx.createBufferSource()
  source.buffer = noise
  source.loop = true

  // Огонь трещит высоко и коротко: низкие частоты превращают треск в стук.
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2800 + Math.random() * 3200
  filter.Q.value = 0.7 + Math.random() * 0.8

  const gain = ctx.createGain()
  const now = ctx.currentTime
  const duration = 0.008 + Math.random() * 0.022

  // Большинство щелчков тихие, редкие — громче: так огонь звучит живым.
  const level = 0.03 + Math.random() ** 3 * 0.14

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(level, now + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  source.connect(filter).connect(gain).connect(destination)
  source.start(now)
  source.stop(now + duration + 0.02)
  source.onended = () => {
    source.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
}

class Ambience {
  private started = false
  private fireTimer: number | null = null

  start(): void {
    const buses = audio.get()
    if (!buses || this.started) return
    this.started = true

    this.startWind(buses)
    this.startFireBody(buses)
    this.scheduleFire()
  }

  /** Низкое гудение пламени: даёт телу огня то, чего не даёт треск. */
  private startFireBody(buses: AudioBuses): void {
    const { ctx, noise, ambience } = buses

    const source = ctx.createBufferSource()
    source.buffer = noise
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 220

    const gain = ctx.createGain()
    gain.gain.value = 0.16

    source.connect(filter).connect(gain).connect(ambience)
    source.start()

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.35
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.05
    lfo.connect(lfoGain).connect(gain.gain)
    lfo.start()
  }

  private startWind(buses: AudioBuses): void {
    const { ctx, noise, ambience } = buses

    const source = ctx.createBufferSource()
    source.buffer = noise
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420

    const gain = ctx.createGain()
    gain.gain.value = 0.22

    source.connect(filter).connect(gain).connect(ambience)
    source.start()

    // Медленное «дыхание» ветра.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.09
    lfo.connect(lfoGain).connect(gain.gain)
    lfo.start()
  }

  private scheduleFire(): void {
    const delay = 120 + Math.random() * 620

    this.fireTimer = globalThis.setTimeout(() => {
      const current = audio.get()
      if (!current) return
      crackle(current, current.ambience)
      this.scheduleFire()
    }, delay)
  }

  /** Приглушить окружение, пока игрок читает сцену (4.4.5). */
  setDucked(ducked: boolean): void {
    const buses = audio.get()
    if (!buses) return

    const now = buses.ctx.currentTime
    buses.ambience.gain.cancelScheduledValues(now)
    buses.ambience.gain.setValueAtTime(buses.ambience.gain.value, now)
    buses.ambience.gain.linearRampToValueAtTime(ducked ? 0.2 : 0.8, now + 0.5)
  }

  stop(): void {
    if (this.fireTimer !== null) {
      globalThis.clearTimeout(this.fireTimer)
      this.fireTimer = null
    }
  }
}

export const ambience = new Ambience()
