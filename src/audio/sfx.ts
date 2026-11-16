/**
 * Синтез звуковых эффектов (4.4.2).
 *
 * Никаких файлов: всё собирается из шума и простых тонов.
 * Звуки короткие и тихие — они должны поддерживать сцену, а не спорить с ней.
 */

import { audio, type AudioBuses } from './engine'

interface NoiseOptions {
  duration: number
  frequency: number
  q?: number
  gain: number
  type?: BiquadFilterType
  delay?: number
}

function noiseBurst(buses: AudioBuses, options: NoiseOptions): void {
  const { ctx, noise, sfx } = buses
  const source = ctx.createBufferSource()
  source.buffer = noise
  source.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = options.type ?? 'bandpass'
  filter.frequency.value = options.frequency
  filter.Q.value = options.q ?? 1

  const gain = ctx.createGain()
  const start = ctx.currentTime + (options.delay ?? 0)
  const duration = Math.max(0.02, options.duration)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(options.gain, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.connect(filter).connect(gain).connect(sfx)
  source.start(start)
  source.stop(start + duration + 0.05)
  source.onended = () => {
    source.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
}

interface ToneOptions {
  frequency: number
  duration: number
  gain: number
  type?: OscillatorType
  delay?: number
  slideTo?: number
}

function tone(buses: AudioBuses, options: ToneOptions): void {
  const { ctx, sfx } = buses
  const oscillator = ctx.createOscillator()
  oscillator.type = options.type ?? 'sine'
  oscillator.frequency.value = options.frequency

  const gain = ctx.createGain()
  const start = ctx.currentTime + (options.delay ?? 0)
  const duration = Math.max(0.03, options.duration)

  oscillator.frequency.setValueAtTime(options.frequency, start)
  if (options.slideTo !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, start + duration)
  }

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(options.gain, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain).connect(sfx)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.05)
  oscillator.onended = () => {
    oscillator.disconnect()
    gain.disconnect()
  }
}

/** Шаг по земле. */
export function playStep(): void {
  const buses = audio.get()
  if (!buses) return
  noiseBurst(buses, {
    duration: 0.08,
    frequency: 380 + Math.random() * 120,
    q: 0.8,
    gain: 0.05,
  })
}

/** Шелест травы и веток. */
export function playRustle(): void {
  const buses = audio.get()
  if (!buses) return
  noiseBurst(buses, { duration: 0.16, frequency: 2400, q: 0.9, gain: 0.045 })
}

/** Удар по камню или дереву. */
export function playKnock(): void {
  const buses = audio.get()
  if (!buses) return
  noiseBurst(buses, { duration: 0.1, frequency: 900, q: 1.4, gain: 0.07 })
  tone(buses, { frequency: 120, duration: 0.14, gain: 0.05, type: 'triangle', slideTo: 70 })
}

/** Монеты. */
export function playCoin(): void {
  const buses = audio.get()
  if (!buses) return
  tone(buses, { frequency: 1180, duration: 0.09, gain: 0.05, type: 'triangle' })
  tone(buses, { frequency: 1620, duration: 0.11, gain: 0.04, type: 'triangle', delay: 0.05 })
}

/** Готовое изделие: короткий деревянный стук. */
export function playCraft(): void {
  const buses = audio.get()
  if (!buses) return
  noiseBurst(buses, { duration: 0.09, frequency: 700, q: 2, gain: 0.06 })
  tone(buses, { frequency: 520, duration: 0.12, gain: 0.04, type: 'triangle', delay: 0.04 })
}
