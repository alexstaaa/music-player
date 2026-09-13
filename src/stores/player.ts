import { create } from 'zustand'
import { tracks } from '../data/demo'

// UI-side player state. The audio engine (HTMLAudioElement + Web Audio) plugs in next;
// until then `position` only moves when the user seeks.
type PlayerState = {
  trackId: string | null
  queue: string[]
  playing: boolean
  position: number
  volume: number
  shuffle: boolean
  repeat: boolean
  play: (trackId: string, queue?: string[]) => void
  toggle: () => void
  seek: (seconds: number) => void
  next: () => void
  prev: () => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
}

export const usePlayer = create<PlayerState>((set, get) => ({
  trackId: tracks[0]?.id ?? null,
  queue: tracks.map((t) => t.id),
  playing: false,
  position: 84,
  volume: 0.7,
  shuffle: false,
  repeat: false,
  play: (trackId, queue) =>
    set((s) =>
      s.trackId === trackId
        ? { playing: !s.playing }
        : { trackId, queue: queue ?? s.queue, playing: true, position: 0 },
    ),
  toggle: () => set((s) => ({ playing: !s.playing })),
  seek: (position) => set({ position }),
  next: () => {
    const { queue, trackId } = get()
    const i = queue.indexOf(trackId ?? '')
    const id = queue[(i + 1) % queue.length]
    if (id) set({ trackId: id, position: 0 })
  },
  prev: () => {
    const { queue, trackId, position } = get()
    if (position > 3) return set({ position: 0 })
    const i = queue.indexOf(trackId ?? '')
    const id = queue[(i - 1 + queue.length) % queue.length]
    if (id) set({ trackId: id, position: 0 })
  },
  setVolume: (volume) => set({ volume }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () => set((s) => ({ repeat: !s.repeat })),
}))
