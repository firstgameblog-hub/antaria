/**
 * Аудио-движок (4.4.1).
 *
 * Три шины: эффекты, окружение, музыка. Плюс общий регулятор.
 * Контекст создаётся только после первого действия игрока — иначе браузер
 * не даёт звучать (политика автовоспроизведения).
 */

export interface AudioBuses {
  ctx: AudioContext
  sfx: GainNode
  ambience: GainNode
  music: GainNode
  noise: AudioBuffer
}

const NOISE_SECONDS = 2

class AudioEngine {
  private buses: AudioBuses | null = null
  private master: GainNode | null = null
  private enabled = true
  private readonly volume = 0.8

  /** Создаёт или возобновляет звук. Возвращает шины, если всё получилось. */
  ensure(): AudioBuses | null {
    if (this.buses) {
      if (this.buses.ctx.state === 'suspended') void this.buses.ctx.resume()
      return this.buses
    }

    const AudioCtor: typeof AudioContext | undefined =
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioCtor) return null

    const ctx = new AudioCtor()
    const master = ctx.createGain()
    master.gain.value = this.enabled ? this.volume : 0
    master.connect(ctx.destination)
    this.master = master

    const makeBus = (level: number): GainNode => {
      const gain = ctx.createGain()
      gain.gain.value = level
      gain.connect(master)
      return gain
    }

    const noise = ctx.createBuffer(1, ctx.sampleRate * NOISE_SECONDS, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1
    }

    this.buses = {
      ctx,
      sfx: makeBus(0.9),
      ambience: makeBus(0.5),
      music: makeBus(0.5),
      noise,
    }

    return this.buses
  }

  get(): AudioBuses | null {
    return this.buses
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    const buses = this.buses
    const master = this.master
    if (!buses || !master) return

    void buses.ctx.resume()
    const now = buses.ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(enabled ? this.volume : 0, now + 0.2)
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

export const audio = new AudioEngine()
