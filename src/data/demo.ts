// Seed content for the showcase. Replaced by the IndexedDB-backed API in the next step.

export type Artist = { id: string; name: string; hue: number; followers: number }
export type Track = {
  id: string
  title: string
  artistId: string
  genre: string
  duration: number
  plays: number
  likes: number
  reposts: number
  comments: number
  cover: [number, number]
  seed: number
  daysAgo: number
}

export const artists: Artist[] = [
  { id: 'lisa', name: 'Лиса Ветрова', hue: 20, followers: 4300 },
  { id: 'nori', name: 'Нори', hue: 210, followers: 8400 },
  { id: 'teplo', name: 'ТЕПЛО', hue: 30, followers: 1200 },
  { id: 'aster', name: 'Aster Lane', hue: 130, followers: 51000 },
  { id: 'osa', name: 'Оса', hue: 70, followers: 2100 },
]

export const tracks: Track[] = [
  {
    id: 'midnight-tram',
    title: 'Полночный трамвай',
    artistId: 'lisa',
    genre: 'Электроника',
    duration: 232,
    plays: 24800,
    likes: 1200,
    reposts: 184,
    comments: 38,
    cover: [190, 300],
    seed: 7,
    daysAgo: 3,
  },
  {
    id: 'glass-rain',
    title: 'Стеклянный дождь',
    artistId: 'nori',
    genre: 'Эмбиент',
    duration: 258,
    plays: 48000,
    likes: 860,
    reposts: 72,
    comments: 15,
    cover: [210, 250],
    seed: 31,
    daysAgo: 0,
  },
  {
    id: 'basement-signal',
    title: 'Сигнал из подвала',
    artistId: 'teplo',
    genre: 'Техно',
    duration: 167,
    plays: 12000,
    likes: 312,
    reposts: 20,
    comments: 9,
    cover: [30, 350],
    seed: 113,
    daysAgo: 1,
  },
  {
    id: 'south-wind',
    title: 'Южный ветер',
    artistId: 'aster',
    genre: 'Инди',
    duration: 204,
    plays: 210000,
    likes: 9400,
    reposts: 1300,
    comments: 240,
    cover: [100, 160],
    seed: 57,
    daysAgo: 12,
  },
  {
    id: 'sleepless',
    title: 'Без сна',
    artistId: 'lisa',
    genre: 'Электроника',
    duration: 189,
    plays: 33000,
    likes: 1500,
    reposts: 96,
    comments: 22,
    cover: [280, 320],
    seed: 91,
    daysAgo: 20,
  },
  {
    id: 'film',
    title: 'Плёнка',
    artistId: 'osa',
    genre: 'Лоу-фай',
    duration: 146,
    plays: 29000,
    likes: 1100,
    reposts: 61,
    comments: 17,
    cover: [70, 40],
    seed: 23,
    daysAgo: 6,
  },
]

export const artistById = (id: string) => artists.find((a) => a.id === id)
export const trackById = (id: string) => tracks.find((t) => t.id === id)

export function coverGradient([h1, h2]: [number, number]) {
  return `radial-gradient(110% 90% at 18% 12%, oklch(0.82 0.13 ${h1}) 0%, transparent 60%), radial-gradient(90% 100% at 90% 95%, oklch(0.5 0.17 ${h2}) 0%, transparent 65%), oklch(0.3 0.08 ${h2})`
}

/** Deterministic fake peaks (0..1) until real audio decoding lands. */
export function fakePeaks(seed: number, n = 180): number[] {
  const out: number[] = []
  let s = seed
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280
    const r = s / 233280
    const x = i / n
    const env = 0.35 + 0.65 * Math.abs(Math.sin(x * Math.PI * 1.6 + 0.35)) * (0.75 + 0.25 * Math.sin(x * 23))
    out.push(env * (0.45 + 0.55 * r))
  }
  return out
}
