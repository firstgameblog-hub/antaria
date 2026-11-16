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

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 900 + Math.random() * 1800
  filter.Q.value = 1.5

  const gain = ctx.createGain()
  const now = ctx.currentTime
  const duration = 0.03 + Math.random() * 0.05

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.015 + Math.random() * 0.045, now + 0.005)
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
  private ducked = false

  start(): void {
    const buses = audio.get()
    if (!buses || this.started) return
    this.started = true

    this.startWind(buses)
    this.scheduleFire()
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
    gain.gain.value = 0.05

    source.connect(filter).connect(gain).connect(ambience)
    source.start()

    // Медленное «дыхание» ветра.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.028
    lfo.connect(lfoGain).connect(gain.gain)
    lfo.start()
  }

  private scheduleFire(): void {
    const delay = 160 + Math.random() * 520

    this.fireTimer = globalThis.setTimeout(() => {
      const current = audio.get()
      if (!current) return
      crackle(current, current.ambience)
      this.scheduleFire()
    }, delay)
  }

  /** Приглушить окружение, пока игрок читает сцену (4.4.5). */
  setDucked(ducked: boolean): void {
    this.ducked = ducked

    const buses = audio.get()
    if (!buses) return

    const now = buses.ctx.currentTime
    buses.ambience.gain.cancelScheduledValues(now)
    buses.ambience.gain.setValueAtTime(buses.ambience.gain.value, now)
    buses.ambience.gain.linearRampToValueAtTime(ducked ? 0.12 : 0.5, now + 0.5)
  }

  stop(): void {
    if (this.fireTimer !== null) {
      globalThis.clearTimeout(this.fireTimer)
      this.fireTimer = null
    }
  }
}

export const ambience = new Ambience()
