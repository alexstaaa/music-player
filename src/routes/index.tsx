import { createFileRoute, Link } from '@tanstack/react-router'
import { ArtistRow } from '../components/lists'
import { TrackCard } from '../components/TrackCard'
import { Avatar, Cover, PageTitle, PlaylistCover, Tabs } from '../components/ui'
import { type FeedItem, useArtists, useFeed, useTracks, useTracksByIds, useUsers } from '../db/api'
import type { Playlist } from '../db/schema'
import { formatCount } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'

type Filter = 'all' | 'tracks' | 'reposts' | 'playlists'

export const Route = createFileRoute('/')({
  validateSearch: (s: Record<string, unknown>): { filter?: Filter } => ({
    filter: ['tracks', 'reposts', 'playlists'].includes(s.filter as string)
      ? (s.filter as Filter)
      : undefined,
  }),
  component: Feed,
})

function Feed() {
  const { filter = 'all' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const feed = useFeed()
  const items = feed.filter(
    (it) =>
      filter === 'all' ||
      (filter === 'tracks' && it.kind === 'track') ||
      (filter === 'reposts' && it.kind === 'repost') ||
      (filter === 'playlists' && it.kind === 'playlist'),
  )
  const queue = items.flatMap((it) => (it.kind === 'playlist' ? [] : [it.track.id]))

  return (
    <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageTitle>{m.feed_title()}</PageTitle>
          <Tabs
            value={filter}
            onChange={(f) => navigate({ search: { filter: f === 'all' ? undefined : f }, replace: true })}
            items={[
              { value: 'all', label: m.filter_all() },
              { value: 'tracks', label: m.filter_tracks() },
              { value: 'reposts', label: m.filter_reposts() },
              { value: 'playlists', label: m.filter_playlists() },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          {items.map((it) => (
            <FeedEntry key={it.key} item={it} queue={queue} />
          ))}
        </div>
      </section>

      <aside className="hidden flex-col gap-5 xl:flex">
        <Trending />
        <WhoToFollow />
      </aside>
    </div>
  )
}

function FeedEntry({ item, queue }: { item: FeedItem; queue: string[] }) {
  if (item.kind === 'playlist') return <PlaylistCard playlist={item.playlist} />
  return (
    <TrackCard track={item.track} queue={queue} repostBy={item.kind === 'repost' ? item.by : undefined} />
  )
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const tracks = useTracksByIds(playlist.trackIds)
  const users = useUsers()
  const owner = users.get(playlist.userId)
  return (
    <article className="flex gap-4 rounded-[20px] p-3 sm:gap-5 sm:p-4">
      <Link to="/playlist/$playlistId" params={{ playlistId: playlist.id }}>
        <PlaylistCover
          playlist={playlist}
          tracks={tracks}
          className="size-24 rounded-[14px] sm:size-[132px]"
        />
      </Link>
      <div className="flex min-w-0 grow flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] text-fg-2">
          <Avatar user={owner} size={18} />
          {owner?.name} · {m.playlist_kicker()}
        </div>
        <Link
          to="/playlist/$playlistId"
          params={{ playlistId: playlist.id }}
          className="truncate text-lg font-semibold hover:underline"
        >
          {playlist.name}
        </Link>
        <ol className="flex flex-col gap-1 text-sm text-fg-2">
          {tracks.slice(0, 3).map((t, i) => (
            <li key={t.id} className="flex gap-2 truncate">
              <span className="w-4 text-fg-3">{i + 1}</span>
              <button
                type="button"
                className="truncate hover:text-fg hover:underline"
                onClick={() => usePlayer.getState().playTrack(t.id, playlist.trackIds)}
              >
                {t.title} — {users.get(t.userId)?.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </article>
  )
}

function Trending() {
  const tracks = useTracks()
  const users = useUsers()
  const top = [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 5)
  return (
    <div className="flex flex-col gap-1.5 rounded-[20px] border border-line bg-panel p-5">
      <h2 className="mb-2 text-[17px] font-semibold">{m.trending()}</h2>
      {top.map((t, i) => (
        <div key={t.id} className="group flex h-[52px] items-center gap-3">
          <span className="w-4 text-[13px] font-semibold text-fg-3">{i + 1}</span>
          <button
            type="button"
            aria-label={m.play()}
            onClick={() =>
              usePlayer.getState().playTrack(
                t.id,
                top.map((x) => x.id),
              )
            }
          >
            <Cover cover={t.cover} className="size-10 rounded-lg" />
          </button>
          <Link to="/track/$trackId" params={{ trackId: t.id }} className="flex min-w-0 grow flex-col">
            <span className="truncate text-sm font-semibold group-hover:underline">{t.title}</span>
            <span className="truncate text-xs text-fg-2">{users.get(t.userId)?.name}</span>
          </Link>
          <span className="text-xs text-fg-3">{formatCount(t.plays)}</span>
        </div>
      ))}
    </div>
  )
}

function WhoToFollow() {
  const artists = useArtists()
  return (
    <div className="flex flex-col gap-1.5 rounded-[20px] border border-line bg-panel p-5">
      <h2 className="mb-2 text-[17px] font-semibold">{m.who_to_follow()}</h2>
      {artists.slice(0, 4).map((a) => (
        <ArtistRow key={a.id} user={a} />
      ))}
    </div>
  )
}
