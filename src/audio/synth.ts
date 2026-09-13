// Procedural demo music: every seeded track is rendered in the browser with an
// OfflineAudioContext, so the showcase ships no audio files and has no licensing questions.
import type { Genre } from '../db/schema'

const SAMPLE_RATE = 22050

type Style = {
  bpm: number
  bars: number
  drums: 'four' | 'break' | 'lofi' | 'none'
  lead: 'arp' | 'bell' | 'pluck'
  root: number
  progression: number[]
  padCutoff: number
  masterCutoff: number
  swing: number
}

function rng(seed: number) {
  let a = seed * 2654435761
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PROGRESSIONS = [
  [0, 5, 3, 6],
  [0, 3, 4, 4],
  [0, 6, 5, 6],
  [5, 3, 0, 4],
]
const MINOR = [0, 2, 3, 5, 7, 8, 10]

function styleFor(genre: Genre, seed: number): Style {
  const r = rng(seed)
  const base = {
    root: 45 + Math.floor(r() * 7),
    progression: PROGRESSIONS[Math.floor(r() * PROGRESSIONS.length)] ?? [0, 5, 3, 6],
    swing: 0,
    masterCutoff: 9000,
  }
  const pick = (
    bpm: number,
    rest: Omit<Style, 'bpm' | 'bars' | keyof typeof base> & Partial<Style>,
  ): Style => {
    const b = Math.round(bpm + r() * 6)
    // ~80–95 s, in whole 8-bar sections.
    const bars = Math.max(24, Math.round((85 * b) / 240 / 8) * 8)
    return { ...base, bpm: b, bars, ...rest }
  }
  switch (genre) {
    case 'ambient':
      return pick(70, { drums: 'none', lead: 'bell', padCutoff: 1600 })
    case 'techno':
      return pick(126, { drums: 'four', lead: 'pluck', padCutoff: 700 })
    case 'indie':
      return pick(100, { drums: 'break', lead: 'pluck', padCutoff: 1200 })
    case 'lofi':
      return pick(80, { drums: 'lofi', lead: 'bell', padCutoff: 900, masterCutoff: 3400, swing: 0.12 })
    case 'synthwave':
      return pick(104, { drums: 'four', lead: 'arp', padCutoff: 1400 })
    default:
      return pick(116, { drums: 'break', lead: 'arp', padCutoff: 1100 })
  }
}

export function synthDuration(genre: Genre, seed: number) {
  const s = styleFor(genre, seed)
  return (s.bars * 240) / s.bpm
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export async function renderSynthTrack(genre: Genre, seed: number): Promise<AudioBuffer> {
  const s = styleFor(genre, seed)
  const r = rng(seed + 1)
  const beat = 60 / s.bpm
  const duration = s.bars * 4 * beat
  const ctx = new OfflineAudioContext(1, Math.ceil((duration + 2) * SAMPLE_RATE), SAMPLE_RATE)

  const noise = ctx.createBuffer(1, SAMPLE_RATE, SAMPLE_RATE)
  const nd = noise.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

  // Master chain.
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 4
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = s.masterCutoff
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, 0)
  master.gain.linearRampToValueAtTime(0.9, 1.5)
  master.gain.setValueAtTime(0.9, duration - 3)
  master.gain.linearRampToValueAtTime(0, duration + 1)
  master.connect(tone).connect(comp).connect(ctx.destination)

  // Reverb + delay buses.
  const reverb = ctx.createConvolver()
  const ir = ctx.createBuffer(1, SAMPLE_RATE * 2.5, SAMPLE_RATE)
  const ird = ir.getChannelData(0)
  for (let i = 0; i < ird.length; i++) ird[i] = (Math.random() * 2 - 1) * (1 - i / ird.length) ** 3
  reverb.buffer = ir
  const reverbOut = ctx.createGain()
  reverbOut.gain.value = 0.35
  reverb.connect(reverbOut).connect(master)
  const delay = ctx.createDelay(2)
  delay.delayTime.value = beat * 0.75
  const feedback = ctx.createGain()
  feedback.gain.value = 0.35
  const delayOut = ctx.createGain()
  delayOut.gain.value = 0.3
  delay.connect(feedback).connect(delay)
  delay.connect(delayOut).connect(master)

  const env = (g: GainNode, t: number, peak: number, attack: number, decay: number) => {
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  }

  const kick = (t: number, v: number) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
    env(g, t, 0.9 * v, 0.004, 0.38)
    o.connect(g).connect(master)
    o.start(t)
    o.stop(t + 0.45)
  }
  // Shared filter buses: one filter (+ sends) per timbre instead of per note keeps the graph small.
  const buses = new Map<string, AudioNode>()
  const bus = (type: BiquadFilterType, freq: number, sends: { reverb?: number; delay?: number } = {}) => {
    const key = `${type}:${freq}:${sends.reverb ?? 0}:${sends.delay ?? 0}`
    let node = buses.get(key)
    if (!node) {
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.connect(master)
      if (sends.reverb) {
        const g = ctx.createGain()
        g.gain.value = sends.reverb
        f.connect(g).connect(reverb)
      }
      if (sends.delay) {
        const g = ctx.createGain()
        g.gain.value = sends.delay
        f.connect(g).connect(delay)
      }
      buses.set(key, f)
      node = f
    }
    return node
  }

  const noiseHit = (
    t: number,
    type: BiquadFilterType,
    freq: number,
    peak: number,
    decay: number,
    send = 0,
  ) => {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const g = ctx.createGain()
    env(g, t, peak, 0.002, decay)
    src.connect(g).connect(bus(type, freq, { reverb: send }))
    src.start(t, r() * 0.5)
    src.stop(t + decay + 0.05)
  }
  const voice = (
    t: number,
    freq: number,
    len: number,
    type: OscillatorType,
    peak: number,
    cutoff: number,
    sends: { reverb?: number; delay?: number } = {},
    detune = 0,
  ) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    o.detune.value = detune
    const g = ctx.createGain()
    const attack = Math.min(0.6, len * 0.3)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + Math.max(0.005, attack))
    g.gain.setValueAtTime(peak, t + Math.max(attack, len - 0.05))
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.4)
    o.connect(g).connect(bus('lowpass', cutoff, sends))
    o.start(t)
    o.stop(t + len + 0.5)
  }

  const sections = s.bars / 8
  for (let bar = 0; bar < s.bars; bar++) {
    const section = Math.floor(bar / 8)
    const isIntro = section === 0
    const isOutro = section === sections - 1
    const isBreak = !isIntro && !isOutro && section % 3 === 2
    const full = !isIntro && !isOutro && !isBreak
    const t0 = bar * 4 * beat
    const degree = s.progression[bar % s.progression.length] ?? 0
    const chord = [0, 2, 4].map((k) => {
      const idx = degree + k
      return s.root + 12 + (MINOR[idx % 7] ?? 0) + 12 * Math.floor(idx / 7)
    })

    // Pads.
    for (const n of chord) {
      voice(t0, hz(n), 4 * beat, 'sawtooth', 0.035, s.padCutoff, { reverb: 0.6 }, -7)
      voice(t0, hz(n), 4 * beat, 'sawtooth', 0.035, s.padCutoff, { reverb: 0.6 }, 7)
    }

    // Bass.
    if (!isIntro && s.drums !== 'none') {
      const bassNote = hz((chord[0] ?? s.root) - 12)
      const pattern = s.drums === 'four' ? [0.5, 1.5, 2.5, 3.5] : [0, 1.5, 2, 3]
      for (const p of pattern) voice(t0 + p * beat, bassNote, beat * 0.45, 'sawtooth', 0.16, 420)
    } else if (s.drums === 'none' && !isIntro) {
      voice(t0, hz((chord[0] ?? s.root) - 12), 4 * beat, 'sine', 0.12, 300)
    }

    // Drums.
    if (s.drums !== 'none' && !isIntro) {
      for (let step = 0; step < 16; step++) {
        const swing = step % 2 === 1 ? s.swing * beat : 0
        const t = t0 + (step / 4) * beat + swing
        if (full || isOutro) {
          if (s.drums === 'four' && step % 4 === 0) kick(t, 1)
          if (s.drums !== 'four' && (step === 0 || step === 10 || (step === 7 && r() > 0.5))) kick(t, 1)
          if (step === 4 || step === 12)
            noiseHit(t, 'bandpass', 1800, s.drums === 'lofi' ? 0.22 : 0.35, 0.18, 0.2)
        }
        if (s.drums === 'four' ? step % 4 === 2 : step % 2 === 0) {
          noiseHit(t, 'highpass', 7000, isBreak ? 0.04 : 0.08, s.drums === 'four' ? 0.09 : 0.04)
        }
      }
    }

    // Lead.
    if (!isIntro || s.lead === 'bell') {
      if (s.lead === 'arp' && (full || isBreak)) {
        for (let step = 0; step < 16; step++) {
          const n = (chord[step % 3] ?? s.root) + 12 * (step % 6 < 3 ? 1 : 2)
          voice(t0 + (step / 4) * beat, hz(n), beat * 0.2, 'square', 0.03, 2600, { delay: 0.5 })
        }
      } else if (s.lead === 'bell') {
        for (let i = 0; i < 4; i++) {
          if (r() > 0.55) continue
          const n = (chord[Math.floor(r() * 3)] ?? s.root) + 24
          const t = t0 + i * beat
          voice(t, hz(n), 0.05, 'sine', 0.09, 5000, { reverb: 0.9, delay: 0.3 })
          voice(t, hz(n) * 2.01, 0.03, 'sine', 0.025, 5000, { reverb: 0.9 })
        }
      } else if (s.lead === 'pluck' && full) {
        for (let step = 0; step < 8; step++) {
          if (r() > 0.5) continue
          const n = (chord[Math.floor(r() * 3)] ?? s.root) + 12
          voice(t0 + (step / 2) * beat, hz(n), beat * 0.15, 'sawtooth', 0.06, 1800, { delay: 0.45 })
        }
      }
    }
  }

  if (s.drums === 'lofi') {
    const crackle = ctx.createBufferSource()
    crackle.buffer = noise
    crackle.loop = true
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 3000
    const g = ctx.createGain()
    g.gain.value = 0.012
    crackle.connect(f).connect(g).connect(master)
    crackle.start(0)
    crackle.stop(duration)
  }

  const rendered = await ctx.startRendering()
  // Trim the reverb tail padding so duration matches the metadata.
  const out = new AudioBuffer({
    length: Math.ceil(duration * SAMPLE_RATE),
    sampleRate: SAMPLE_RATE,
    numberOfChannels: 1,
  })
  const samples = rendered.getChannelData(0).subarray(0, out.length)
  // Normalize so quiet genres (ambient) sit at the same level as the rest.
  let peak = 0
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i] ?? 0))
  if (peak > 0) for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] ?? 0) * (0.9 / peak)
  out.copyToChannel(samples, 0)
  return out
}
