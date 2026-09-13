import { PEAK_COUNT } from '../db/schema'

export function computePeaks(buffer: AudioBuffer, count = PEAK_COUNT): number[] {
  const data = buffer.getChannelData(0)
  const size = Math.max(1, Math.floor(data.length / count))
  const peaks: number[] = []
  let max = 0
  for (let i = 0; i < count; i++) {
    let peak = 0
    const end = Math.min(data.length, (i + 1) * size)
    for (let j = i * size; j < end; j += 4) {
      const v = Math.abs(data[j] ?? 0)
      if (v > peak) peak = v
    }
    peaks.push(peak)
    if (peak > max) max = peak
  }
  return peaks.map((p) => Number(((p / (max || 1)) ** 0.8).toFixed(3)))
}

/** Resample stored peaks to the number of bars a view draws (max per bucket). */
export function resamplePeaks(peaks: number[], bars: number): number[] {
  if (!peaks.length) return []
  const out: number[] = []
  const step = peaks.length / bars
  for (let i = 0; i < bars; i++) {
    let m = 0
    for (
      let j = Math.floor(i * step);
      j < Math.max(Math.floor((i + 1) * step), Math.floor(i * step) + 1);
      j++
    ) {
      m = Math.max(m, peaks[j] ?? 0)
    }
    out.push(m)
  }
  return out
}

export async function decodeFile(file: Blob): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, 1, 44100)
  return ctx.decodeAudioData(await file.arrayBuffer())
}

export function encodeWav(buffer: AudioBuffer): Blob {
  const data = buffer.getChannelData(0)
  const rate = buffer.sampleRate
  const out = new DataView(new ArrayBuffer(44 + data.length * 2))
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i))
  }
  str(0, 'RIFF')
  out.setUint32(4, 36 + data.length * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  out.setUint32(16, 16, true)
  out.setUint16(20, 1, true)
  out.setUint16(22, 1, true)
  out.setUint32(24, rate, true)
  out.setUint32(28, rate * 2, true)
  out.setUint16(32, 2, true)
  out.setUint16(34, 16, true)
  str(36, 'data')
  out.setUint32(40, data.length * 2, true)
  for (let i = 0; i < data.length; i++) {
    const v = Math.max(-1, Math.min(1, data[i] ?? 0))
    out.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true)
  }
  return new Blob([out], { type: 'audio/wav' })
}
