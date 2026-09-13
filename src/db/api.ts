// Local "backend": every read is a live query, every write a small Dexie transaction.
// Swap this module for real HTTP calls later; components only use these functions and hooks.
import { useLiveQuery } from 'dexie-react-hooks'
import { type Comment, db, type Genre, ME, type Playlist, type Track, type User } from './schema'

const uid = () => crypto.randomUUID().slice(0, 12)

/* ---------- reads ---------- */

export const useUsers = () =>
  useLiveQuery(
    async () => new Map((await db.users.toArray()).map((u) => [u.id, u])),
    [],
    new Map<string, User>(),
  )

export const useUser = (id: string | undefined) =>
  useLiveQuery(() => (id ? db.users.get(id) : undefined), [id])
export const useMe = () => useUser(ME)

export const useTrack = (id: string | undefined) =>
  useLiveQuery(() => (id ? db.tracks.get(id) : undefined), [id])

export const useTracks = () =>
  useLiveQuery(() => db.tracks.orderBy('createdAt').reverse().toArray(), [], [] as Track[])

export const useTracksByIds = (ids: string[]) =>
  useLiveQuery(
    async () => (await db.tracks.bulkGet(ids)).filter((t): t is Track => !!t),
    [ids.join(',')],
    [] as Track[],
  )

export const useUserTracks = (userId: string) =>
  useLiveQuery(
    async () =>
      (await db.tracks.where('userId').equals(userId).toArray()).sort((a, b) => b.createdAt - a.createdAt),
    [userId],
    [] as Track[],
  )

export type FeedItem =
  | { kind: 'track'; key: string; at: number; track: Track }
  | { kind: 'repost'; key: string; at: number; track: Track; by: string }
  | { kind: 'playlist'; key: string; at: number; playlist: Playlist }

export const useFeed = () =>
  useLiveQuery(
    async () => {
      const [tracks, reposts, playlists] = await Promise.all([
        db.tracks.toArray(),
        db.reposts.toArray(),
        db.playlists.toArray(),
      ])
      const byId = new Map(tracks.map((t) => [t.id, t]))
      const items: FeedItem[] = [
        ...tracks.map((track) => ({
          kind: 'track' as const,
          key: `t:${track.id}`,
          at: track.createdAt,
          track,
        })),
        ...reposts.flatMap((r) => {
          const track = byId.get(r.trackId)
          return track && r.userId !== ME
            ? [{ kind: 'repost' as const, key: `r:${r.id}`, at: r.createdAt, track, by: r.userId }]
            : []
        }),
        ...playlists
          .filter((p) => p.userId !== ME && p.trackIds.length)
          .map((playlist) => ({
            kind: 'playlist' as const,
            key: `p:${playlist.id}`,
            at: playlist.createdAt,
            playlist,
          })),
      ]
      // One entry per track: the most recent of the upload and its reposts.
      const seen = new Set<string>()
      return items
        .sort((a, b) => b.at - a.at)
        .filter((it) => it.kind === 'playlist' || (!seen.has(it.track.id) && !!seen.add(it.track.id)))
    },
    [],
    [] as FeedItem[],
  )

export const useIsLiked = (trackId: string) =>
  useLiveQuery(async () => !!(await db.likes.get(`${ME}:${trackId}`)), [trackId], false)
export const useIsReposted = (trackId: string) =>
  useLiveQuery(async () => !!(await db.reposts.get(`${ME}:${trackId}`)), [trackId], false)
export const useIsFollowing = (userId: string) =>
  useLiveQuery(async () => !!(await db.follows.get(`${ME}:${userId}`)), [userId], false)

export const useFollowerCount = (userId: string) =>
  useLiveQuery(
    async () => {
      const user = await db.users.get(userId)
      return (user?.followersBase ?? 0) + (await db.follows.where('followeeId').equals(userId).count())
    },
    [userId],
    0,
  )

export const useComments = (trackId: string) =>
  useLiveQuery(
    async () => (await db.comments.where('trackId').equals(trackId).toArray()).sort((a, b) => a.at - b.at),
    [trackId],
    [] as Comment[],
  )

export const usePlaylists = (userId?: string) =>
  useLiveQuery(
    async () => {
      const all = userId
        ? await db.playlists.where('userId').equals(userId).toArray()
        : await db.playlists.toArray()
      return all.sort((a, b) => b.createdAt - a.createdAt)
    },
    [userId],
    [] as Playlist[],
  )

export const usePlaylist = (id: string) => useLiveQuery(() => db.playlists.get(id), [id])

export const useLikedTracks = () =>
  useLiveQuery(
    async () => {
      const likes = (await db.likes.where('userId').equals(ME).toArray()).sort(
        (a, b) => b.createdAt - a.createdAt,
      )
      return (await db.tracks.bulkGet(likes.map((l) => l.trackId))).filter((t): t is Track => !!t)
    },
    [],
    [] as Track[],
  )

export const useHistory = () =>
  useLiveQuery(
    async () => {
      const entries = await db.history.orderBy('playedAt').reverse().limit(200).toArray()
      const seen = new Set<string>()
      const ids = entries.map((e) => e.trackId).filter((id) => !seen.has(id) && !!seen.add(id))
      return (await db.tracks.bulkGet(ids)).filter((t): t is Track => !!t)
    },
    [],
    [] as Track[],
  )

export const useFollowing = () =>
  useLiveQuery(
    async () => {
      const follows = await db.follows.where('followerId').equals(ME).toArray()
      return (await db.users.bulkGet(follows.map((f) => f.followeeId))).filter((u): u is User => !!u)
    },
    [],
    [] as User[],
  )

export const useArtists = () =>
  useLiveQuery(
    async () => {
      const tracks = await db.tracks.toArray()
      const ids = new Set(tracks.map((t) => t.userId))
      return (await db.users.toArray()).filter((u) => ids.has(u.id) && u.id !== ME)
    },
    [],
    [] as User[],
  )

/* ---------- writes ---------- */

export async function toggleLike(trackId: string) {
  const id = `${ME}:${trackId}`
  return db.transaction('rw', db.likes, db.tracks, async () => {
    const liked = !!(await db.likes.get(id))
    if (liked) await db.likes.delete(id)
    else await db.likes.add({ id, userId: ME, trackId, createdAt: Date.now() })
    await db.tracks
      .where('id')
      .equals(trackId)
      .modify((t) => {
        t.likes = Math.max(0, t.likes + (liked ? -1 : 1))
      })
    return !liked
  })
}

export async function toggleRepost(trackId: string) {
  const id = `${ME}:${trackId}`
  return db.transaction('rw', db.reposts, db.tracks, async () => {
    const reposted = !!(await db.reposts.get(id))
    if (reposted) await db.reposts.delete(id)
    else await db.reposts.add({ id, userId: ME, trackId, createdAt: Date.now() })
    await db.tracks
      .where('id')
      .equals(trackId)
      .modify((t) => {
        t.reposts = Math.max(0, t.reposts + (reposted ? -1 : 1))
      })
    return !reposted
  })
}

export async function toggleFollow(userId: string) {
  const id = `${ME}:${userId}`
  if (await db.follows.get(id)) {
    await db.follows.delete(id)
    return false
  }
  await db.follows.add({ id, followerId: ME, followeeId: userId, createdAt: Date.now() })
  return true
}

export const addComment = (trackId: string, at: number, text: string) =>
  db.comments.add({
    id: uid(),
    trackId,
    userId: ME,
    at: Math.round(at),
    text: text.trim(),
    createdAt: Date.now(),
  })

export const deleteComment = (id: string) => db.comments.delete(id)

export async function createPlaylist(name: string, trackIds: string[] = []) {
  const id = uid()
  const hue = Math.floor(Math.random() * 360)
  await db.playlists.add({
    id,
    userId: ME,
    name: name.trim(),
    trackIds,
    cover: [hue, (hue + 90) % 360],
    createdAt: Date.now(),
  })
  return id
}

export const renamePlaylist = (id: string, name: string) => db.playlists.update(id, { name: name.trim() })
export const deletePlaylist = (id: string) => db.playlists.delete(id)

export async function addToPlaylist(playlistId: string, trackId: string) {
  let added = false
  await db.playlists
    .where('id')
    .equals(playlistId)
    .modify((p) => {
      if (!p.trackIds.includes(trackId)) {
        p.trackIds.push(trackId)
        added = true
      }
    })
  return added
}

export const removeFromPlaylist = (playlistId: string, trackId: string) =>
  db.playlists
    .where('id')
    .equals(playlistId)
    .modify((p) => {
      p.trackIds = p.trackIds.filter((id) => id !== trackId)
    })

export async function uploadTrack(input: {
  file: Blob
  title: string
  genre: Genre
  description: string
  tags: string[]
  cover: [number, number]
  duration: number
  peaks: number[]
}) {
  const id = uid()
  await db.tracks.add({
    id,
    title: input.title.trim(),
    userId: ME,
    genre: input.genre,
    description: input.description.trim(),
    tags: input.tags,
    cover: input.cover,
    duration: input.duration,
    peaks: input.peaks,
    audio: input.file,
    source: 'upload',
    seed: 0,
    createdAt: Date.now(),
    plays: 0,
    likes: 0,
    reposts: 0,
  })
  return id
}

export const deleteTrack = (id: string) =>
  db.transaction('rw', [db.tracks, db.likes, db.reposts, db.comments, db.playlists], async () => {
    await db.tracks.delete(id)
    await db.likes.where('trackId').equals(id).delete()
    await db.reposts.where('trackId').equals(id).delete()
    await db.comments.where('trackId').equals(id).delete()
    await db.playlists.toCollection().modify((p) => {
      p.trackIds = p.trackIds.filter((t) => t !== id)
    })
  })

export async function recordPlay(trackId: string) {
  await db.history.add({ trackId, playedAt: Date.now() })
  await db.tracks
    .where('id')
    .equals(trackId)
    .modify((t) => {
      t.plays += 1
    })
}

export const savePeaks = (trackId: string, peaks: number[]) => db.tracks.update(trackId, { peaks })

export const updateMe = (patch: Partial<Pick<User, 'name' | 'bio' | 'hue'>>) => db.users.update(ME, patch)

export const clearHistory = () => db.history.clear()
