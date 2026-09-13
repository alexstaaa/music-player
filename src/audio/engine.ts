// Single HTMLAudioElement driven by the player store. Lives outside React so
// navigation, locale switches and remounts never interrupt playback.
import { recordPlay } from '../db/api'
import { db, type Track } from '../db/schema'
import { usePlayer } from '../stores/player'
import { computePeaks, encodeWav } from './buffers'
import { renderSynthTrack } from './synth'

const audio = new Audio()
audio.preload = 'auto'
if (import.meta.env.DEV) Object.assign(window, { __audio: audio })

const urls = new Map<string, Promise<string>>()

function sourceUrl(track: Track): Promise<string> {
  let url = urls.get(track.id)
  if (!url) {
    url = (async () => {
      if (track.audio) return URL.createObjectURL(track.audio)
      // Demo tracks are rendered once, then cached in IndexedDB with their peaks.
      const buffer = await renderSynthTrack(track.genre, track.seed)
      const audio = encodeWav(buffer)
      await db.tracks.update(track.id, {
        audio,
        peaks: track.peaks.length ? track.peaks : computePeaks(buffer),
      })
      return URL.createObjectURL(audio)
    })()
    urls.set(track.id, url)
    url.catch(() => urls.delete(track.id))
  }
  return url
}

function coverArtwork(track: Track): string {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  const [h1, h2] = track.cover
  ctx.fillStyle = `oklch(0.3 0.08 ${h2})`
  ctx.fillRect(0, 0, 256, 256)
  const g1 = ctx.createRadialGradient(46, 30, 0, 46, 30, 200)
  g1.addColorStop(0, `oklch(0.82 0.13 ${h1})`)
  g1.addColorStop(1, 'transparent')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, 256, 256)
  const g2 = ctx.createRadialGradient(230, 243, 0, 230, 243, 220)
  g2.addColorStop(0, `oklch(0.5 0.17 ${h2})`)
  g2.addColorStop(1, 'transparent')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, 256, 256)
  return c.toDataURL('image/png')
}

let loadedId: string | null = null
let loadToken = 0
let countedPlay = false
/** Set when the engine pauses for a track switch, so the UI keeps showing "playing". */
let internalPause = false

async function load(trackId: string, startAt: number) {
  const token = ++loadToken
  if (!audio.paused) {
    internalPause = true
    audio.pause()
  }
  usePlayer.setState({ loading: true })
  const track = await db.tracks.get(trackId)
  if (!track) {
    usePlayer.setState({ loading: false, trackId: null, playing: false })
    return
  }
  usePlayer.setState({ duration: track.duration })
  try {
    const url = await sourceUrl(track)
    if (token !== loadToken) return
    audio.src = url
    audio.currentTime = startAt
    loadedId = trackId
    countedPlay = false
    updateMediaSession(track)
    usePlayer.setState({ loading: false })
    if (usePlayer.getState().playing) await play()
  } catch (err) {
    console.error('Failed to load track', err)
    if (token === loadToken) usePlayer.setState({ loading: false, playing: false })
  }
}

async function play() {
  try {
    await audio.play()
  } catch {
    // Autoplay without a user gesture (e.g. restored session) is refused; reflect it in the UI.
    usePlayer.setState({ playing: false })
  }
}

function updateMediaSession(track: Track) {
  currentTitle = track.title
  syncTitle()
  if (!('mediaSession' in navigator)) return
  db.users.get(track.userId).then((user) => {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: user?.name ?? '',
      artwork: [{ src: coverArtwork(track), sizes: '256x256', type: 'image/png' }],
    })
    syncTitle()
  })
}

let frame = 0
let lastTick = 0
function tick(now: number) {
  frame = requestAnimationFrame(tick)
  if (now - lastTick < 33) return
  lastTick = now
  const position = audio.currentTime
  if (Math.abs(position - usePlayer.getState().position) > 0.03) usePlayer.setState({ position })
  if (!countedPlay && position > 5 && loadedId) {
    countedPlay = true
    recordPlay(loadedId)
  }
}

let currentTitle = ''
const baseTitle = document.title
function syncTitle() {
  const { playing } = usePlayer.getState()
  document.title = playing && currentTitle ? `▶ ${currentTitle}` : baseTitle
}

export function startAudioEngine() {
  const initial = usePlayer.getState()
  audio.volume = initial.muted ? 0 : initial.volume ** 2
  if (initial.trackId) {
    usePlayer.setState({ playing: false })
    load(initial.trackId, initial.position)
  }

  usePlayer.subscribe((s, prev) => {
    if (s.trackId !== prev.trackId) {
      if (s.trackId) load(s.trackId, 0)
      else {
        audio.pause()
        audio.removeAttribute('src')
        loadedId = null
      }
    }
    if (s.playing !== prev.playing && loadedId === s.trackId && !s.loading) {
      if (s.playing) play()
      else audio.pause()
    }
    if (s.seekNonce !== prev.seekNonce && loadedId === s.trackId) audio.currentTime = s.seekTo
    if (s.volume !== prev.volume || s.muted !== prev.muted) audio.volume = s.muted ? 0 : s.volume ** 2
    if (s.playing !== prev.playing || s.trackId !== prev.trackId) syncTitle()
  })

  audio.addEventListener('play', () => {
    usePlayer.setState({ playing: true })
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(tick)
  })
  audio.addEventListener('pause', () => {
    cancelAnimationFrame(frame)
    if (internalPause) {
      internalPause = false
      return
    }
    usePlayer.setState({ playing: false, position: audio.currentTime })
  })
  // rAF stops in hidden tabs; timeupdate (~4 Hz) keeps position roughly current there.
  audio.addEventListener('timeupdate', () => {
    if (performance.now() - lastTick > 300) usePlayer.setState({ position: audio.currentTime })
  })
  audio.addEventListener('ended', () => usePlayer.getState().next(true))
  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) usePlayer.setState({ duration: audio.duration })
  })

  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession
    const p = usePlayer.getState
    ms.setActionHandler('play', () => usePlayer.setState({ playing: true }))
    ms.setActionHandler('pause', () => usePlayer.setState({ playing: false }))
    ms.setActionHandler('previoustrack', () => p().prev())
    ms.setActionHandler('nexttrack', () => p().next())
    ms.setActionHandler('seekbackward', () => p().seekBy(-10))
    ms.setActionHandler('seekforward', () => p().seekBy(10))
    ms.setActionHandler('seekto', (d) => d.seekTime != null && p().seek(d.seekTime))
  }

  // Precompute waveforms for demo tracks in the background, one at a time.
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? requestIdleCallback(cb) : setTimeout(cb, 500)
  idle(async () => {
    const missing = await db.tracks.filter((t) => t.source === 'synth' && !t.audio).toArray()
    for (const track of missing) await sourceUrl(track).catch(() => {})
  })
}
