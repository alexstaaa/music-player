import { synthDuration } from '../audio/synth'
import { type Comment, db, type Genre, ME, type Playlist, type Track, type User } from './schema'

const DAY = 86_400_000
const now = Date.now()

const users: User[] = [
  { id: ME, name: 'Вы', hue: 250, bio: '', followersBase: 0, createdAt: now - 90 * DAY },
  {
    id: 'lisa',
    name: 'Лиса Ветрова',
    hue: 20,
    bio: 'Ночная электроника из Петербурга.',
    followersBase: 4300,
    createdAt: now - 400 * DAY,
  },
  {
    id: 'nori',
    name: 'Нори',
    hue: 210,
    bio: 'Эмбиент для дождливых дней.',
    followersBase: 8400,
    createdAt: now - 700 * DAY,
  },
  {
    id: 'teplo',
    name: 'ТЕПЛО',
    hue: 30,
    bio: 'Техно из подвала. Громко.',
    followersBase: 1200,
    createdAt: now - 200 * DAY,
  },
  {
    id: 'aster',
    name: 'Aster Lane',
    hue: 130,
    bio: 'Indie duo. Tapes and synths.',
    followersBase: 51000,
    createdAt: now - 900 * DAY,
  },
  {
    id: 'osa',
    name: 'Оса',
    hue: 70,
    bio: 'Лоу-фай биты между парами.',
    followersBase: 2100,
    createdAt: now - 150 * DAY,
  },
  {
    id: 'neon',
    name: 'Неон Юг',
    hue: 330,
    bio: 'Синтвейв для поздних поездок.',
    followersBase: 16800,
    createdAt: now - 500 * DAY,
  },
  { id: 'mark', name: 'Марк Ю.', hue: 300, bio: '', followersBase: 40, createdAt: now - 60 * DAY },
  { id: 'aya', name: 'aya', hue: 40, bio: '', followersBase: 112, createdAt: now - 30 * DAY },
  { id: 'denis', name: 'Денис Орлов', hue: 200, bio: '', followersBase: 18, createdAt: now - 20 * DAY },
  { id: 'kirill', name: 'Кирилл', hue: 160, bio: '', followersBase: 65, createdAt: now - 45 * DAY },
]

const t = (
  id: string,
  title: string,
  userId: string,
  genre: Genre,
  seed: number,
  daysAgo: number,
  plays: number,
  likes: number,
  reposts: number,
  cover: [number, number],
  tags: string[],
  description = '',
): Track => ({
  id,
  title,
  userId,
  genre,
  seed,
  createdAt: now - daysAgo * DAY - seed * 1000,
  plays,
  likes,
  reposts,
  cover,
  tags,
  description,
  duration: synthDuration(genre, seed),
  source: 'synth',
  peaks: [],
})

const tracks: Track[] = [
  t(
    'midnight-tram',
    'Полночный трамвай',
    'lisa',
    'electronic',
    7,
    3,
    24800,
    1200,
    184,
    [190, 300],
    ['synthwave', 'ночь'],
    'Записано в последнем трамвае через весь город.',
  ),
  t(
    'glass-rain',
    'Стеклянный дождь',
    'nori',
    'ambient',
    31,
    0.2,
    48000,
    860,
    72,
    [210, 250],
    ['ambient', 'дождь'],
  ),
  t(
    'basement-signal',
    'Сигнал из подвала',
    'teplo',
    'techno',
    113,
    1,
    12000,
    312,
    20,
    [30, 350],
    ['techno', 'warehouse'],
  ),
  t(
    'south-wind',
    'Южный ветер',
    'aster',
    'indie',
    57,
    12,
    210000,
    9400,
    1300,
    [100, 160],
    ['indie', 'summer'],
    'From our tape "Coastline".',
  ),
  t('sleepless', 'Без сна', 'lisa', 'electronic', 91, 20, 33000, 1500, 96, [280, 320], ['electronic']),
  t('film', 'Плёнка', 'osa', 'lofi', 23, 6, 29000, 1100, 61, [70, 40], ['lofi', 'study']),
  t(
    'neon-highway',
    'Неоновое шоссе',
    'neon',
    'synthwave',
    77,
    2,
    67000,
    3100,
    410,
    [320, 260],
    ['synthwave', 'drive'],
  ),
  t('slow-morning', 'Медленное утро', 'osa', 'lofi', 45, 9, 8700, 420, 18, [50, 110], ['lofi', 'coffee']),
  t('orbit', 'Орбита', 'nori', 'ambient', 139, 30, 91000, 4200, 520, [240, 180], ['space', 'ambient']),
]

const c = (trackId: string, userId: string, at: number, text: string, hoursAgo: number): Comment => ({
  id: `${trackId}-${userId}-${at}`,
  trackId,
  userId,
  at,
  text,
  createdAt: now - hoursAgo * 3_600_000,
})

const comments: Comment[] = [
  c('midnight-tram', 'mark', 30, 'Вот этот переход — лучшее место в треке', 2),
  c('midnight-tram', 'aya', 14, 'Звучит как ночной город из окна автобуса', 5),
  c('midnight-tram', 'denis', 62, 'Ждём полный альбом', 26),
  c('midnight-tram', 'kirill', 48, 'Бас просто космос', 30),
  c('glass-rain', 'aya', 20, 'Идеально под дождь за окном', 1),
  c('glass-rain', 'lisa', 55, 'Очень красивые пэды', 8),
  c('basement-signal', 'kirill', 22, 'Дроп!', 3),
  c('basement-signal', 'mark', 40, 'Хочу это на рейве', 12),
  c('south-wind', 'aya', 10, 'Summer vibes', 50),
  c('south-wind', 'denis', 44, 'Эта гитара', 70),
  c('film', 'kirill', 18, 'Под учёбу самое то', 9),
  c('neon-highway', 'mark', 36, 'Как в фильмах из 80-х', 4),
  c('neon-highway', 'lisa', 58, 'Лучший синт в этом году', 20),
  c('orbit', 'teplo', 25, 'Невесомость', 100),
]

const playlists: Playlist[] = [
  {
    id: 'road',
    userId: ME,
    name: 'Для дороги',
    trackIds: ['neon-highway', 'south-wind', 'midnight-tram', 'film'],
    cover: [60, 20],
    createdAt: now - 10 * DAY,
  },
  {
    id: 'focus',
    userId: ME,
    name: 'Ночной фокус',
    trackIds: ['glass-rain', 'orbit', 'sleepless'],
    cover: [240, 280],
    createdAt: now - 7 * DAY,
  },
  {
    id: 'nori-best',
    userId: 'nori',
    name: 'Нори: лучшее',
    trackIds: ['orbit', 'glass-rain'],
    cover: [210, 180],
    createdAt: now - 3 * DAY,
  },
]

export async function seedIfEmpty() {
  if ((await db.users.count()) > 0) return
  await db.transaction(
    'rw',
    [db.users, db.tracks, db.comments, db.playlists, db.likes, db.reposts, db.follows],
    async () => {
      await db.users.bulkAdd(users)
      await db.tracks.bulkAdd(tracks)
      await db.comments.bulkAdd(comments)
      await db.playlists.bulkAdd(playlists)
      await db.likes.bulkAdd([
        { id: `${ME}:midnight-tram`, userId: ME, trackId: 'midnight-tram', createdAt: now - DAY },
      ])
      await db.reposts.bulkAdd([
        { id: 'kirill:glass-rain', userId: 'kirill', trackId: 'glass-rain', createdAt: now - 5 * 3_600_000 },
        { id: 'aya:film', userId: 'aya', trackId: 'film', createdAt: now - 30 * 3_600_000 },
      ])
      await db.follows.bulkAdd([
        { id: `${ME}:lisa`, followerId: ME, followeeId: 'lisa', createdAt: now - 20 * DAY },
        { id: `${ME}:aster`, followerId: ME, followeeId: 'aster', createdAt: now - 15 * DAY },
      ])
    },
  )
}
