import Dexie, { type EntityTable } from 'dexie'

export type Genre = 'electronic' | 'ambient' | 'techno' | 'indie' | 'lofi' | 'synthwave'

export type User = {
  id: string
  name: string
  hue: number
  bio: string
  followersBase: number
  createdAt: number
}

export type Track = {
  id: string
  title: string
  userId: string
  genre: Genre
  description: string
  duration: number
  createdAt: number
  plays: number
  likes: number
  reposts: number
  cover: [number, number]
  /** 'synth' tracks are rendered in the browser from `seed`; 'upload' tracks carry `audio`. */
  source: 'synth' | 'upload'
  seed: number
  audio?: Blob
  /** Normalized 0..1 peaks (PEAK_COUNT buckets); empty until computed. */
  peaks: number[]
  tags: string[]
}

export type Like = { id: string; userId: string; trackId: string; createdAt: number }
export type Repost = { id: string; userId: string; trackId: string; createdAt: number }
export type Follow = { id: string; followerId: string; followeeId: string; createdAt: number }
export type Comment = {
  id: string
  trackId: string
  userId: string
  at: number
  text: string
  createdAt: number
}
export type Playlist = {
  id: string
  userId: string
  name: string
  trackIds: string[]
  cover: [number, number]
  createdAt: number
}
export type HistoryEntry = { id?: number; trackId: string; playedAt: number }

export const PEAK_COUNT = 600
export const ME = 'me'

export class MusicDB extends Dexie {
  users!: EntityTable<User, 'id'>
  tracks!: EntityTable<Track, 'id'>
  likes!: EntityTable<Like, 'id'>
  reposts!: EntityTable<Repost, 'id'>
  follows!: EntityTable<Follow, 'id'>
  comments!: EntityTable<Comment, 'id'>
  playlists!: EntityTable<Playlist, 'id'>
  history!: EntityTable<HistoryEntry, 'id'>

  constructor() {
    super('music-site')
    this.version(1).stores({
      users: 'id',
      tracks: 'id, userId, genre, createdAt, plays',
      likes: 'id, userId, trackId, createdAt',
      reposts: 'id, userId, trackId, createdAt',
      follows: 'id, followerId, followeeId',
      comments: 'id, trackId, createdAt',
      playlists: 'id, userId, createdAt',
      history: '++id, trackId, playedAt',
    })
  }
}

export const db = new MusicDB()
