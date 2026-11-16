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
  private readonly volume = 2

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
    void ctx.resume()

    // Компрессор бережёт слух и не даёт клиппить, когда звуки накладываются.
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -12
    compressor.knee.value = 20
    compressor.ratio.value = 6
    compressor.attack.value = 0.003
    compressor.release.value = 0.25
    compressor.connect(ctx.destination)

    const master = ctx.createGain()
    master.gain.value = this.enabled ? this.volume : 0
    master.connect(compressor)
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
      sfx: makeBus(1),
      ambience: makeBus(0.8),
      music: makeBus(0.5),
      noise,
    }

    return this.buses
  }

  get(): AudioBuses | null {
    return this.buses
  }

  /** Мастер-шина: нужна для проверки уровня сигнала. */
  getMaster(): GainNode | null {
    return this.master
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
