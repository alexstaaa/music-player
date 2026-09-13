import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RepeatMode = 'off' | 'all' | 'one'

type PlayerState = {
  trackId: string | null
  queue: string[]
  playing: boolean
  loading: boolean
  position: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  /** Seek requests for the engine: it applies `seekTo` whenever `seekNonce` changes. */
  seekTo: number
  seekNonce: number

  playTrack: (trackId: string, queue?: string[]) => void
  toggle: () => void
  pause: () => void
  seek: (seconds: number) => void
  seekBy: (delta: number) => void
  next: (auto?: boolean) => void
  prev: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  playNext: (trackId: string) => void
  addToQueue: (trackId: string) => void
  removeFromQueue: (trackId: string) => void
  clearQueue: () => void
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      trackId: null,
      queue: [],
      playing: false,
      loading: false,
      position: 0,
      duration: 0,
      volume: 0.8,
      muted: false,
      shuffle: false,
      repeat: 'off',
      seekTo: 0,
      seekNonce: 0,

      playTrack: (trackId, queue) => {
        const s = get()
        if (s.trackId === trackId) return set({ playing: !s.playing })
        const nextQueue = queue ?? (s.queue.includes(trackId) ? s.queue : [...s.queue, trackId])
        set({ trackId, queue: nextQueue, playing: true, position: 0, seekTo: 0, seekNonce: s.seekNonce + 1 })
      },
      toggle: () => set((s) => (s.trackId ? { playing: !s.playing } : {})),
      pause: () => set({ playing: false }),
      seek: (seconds) => {
        const s = get()
        const to = Math.max(0, Math.min(s.duration || seconds, seconds))
        set({ position: to, seekTo: to, seekNonce: s.seekNonce + 1 })
      },
      seekBy: (delta) => get().seek(get().position + delta),
      next: (auto = false) => {
        const s = get()
        if (!s.trackId || !s.queue.length) return
        if (auto && s.repeat === 'one') return get().seek(0)
        const i = s.queue.indexOf(s.trackId)
        let j = i + 1
        if (s.shuffle && s.queue.length > 1) {
          do j = Math.floor(Math.random() * s.queue.length)
          while (j === i)
        }
        if (j >= s.queue.length) {
          if (auto && s.repeat === 'off')
            return set({ playing: false, position: 0, seekTo: 0, seekNonce: s.seekNonce + 1 })
          j = 0
        }
        const id = s.queue[j]
        if (id)
          set({
            trackId: id,
            position: 0,
            seekTo: 0,
            seekNonce: s.seekNonce + 1,
            playing: auto ? true : s.playing,
          })
      },
      prev: () => {
        const s = get()
        if (!s.trackId) return
        if (s.position > 3) return get().seek(0)
        const i = s.queue.indexOf(s.trackId)
        const id = s.queue[(i - 1 + s.queue.length) % s.queue.length]
        if (id) set({ trackId: id, position: 0, seekTo: 0, seekNonce: s.seekNonce + 1 })
      },
      setVolume: (volume) => set({ volume, muted: volume === 0 }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),
      playNext: (trackId) =>
        set((s) => {
          if (!s.trackId) return { trackId, queue: [trackId], playing: true }
          const q = s.queue.filter((id) => id !== trackId)
          q.splice(q.indexOf(s.trackId) + 1, 0, trackId)
          return { queue: q }
        }),
      addToQueue: (trackId) =>
        set((s) =>
          s.trackId
            ? { queue: [...s.queue.filter((id) => id !== trackId), trackId] }
            : { trackId, queue: [trackId], playing: true },
        ),
      removeFromQueue: (trackId) =>
        set((s) => ({ queue: s.queue.filter((id) => id !== trackId || id === s.trackId) })),
      clearQueue: () => set((s) => ({ queue: s.trackId ? [s.trackId] : [] })),
    }),
    {
      name: 'player',
      partialize: (s) => ({
        trackId: s.trackId,
        queue: s.queue,
        position: s.position,
        volume: s.volume,
        muted: s.muted,
        shuffle: s.shuffle,
        repeat: s.repeat,
      }),
    },
  ),
)
