import { createFileRoute, Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { Icon } from '../components/Icon'
import { ArtistRow, PlaylistGrid } from '../components/lists'
import { TrackRow } from '../components/TrackRow'
import { btn, EmptyState, PageTitle, Tabs } from '../components/ui'
import {
  clearHistory,
  useFollowing,
  useHistory,
  useLikedTracks,
  usePlaylists,
  useUserTracks,
} from '../db/api'
import { ME, type Track } from '../db/schema'
import { m } from '../paraglide/messages.js'
import { useUi } from '../stores/ui'

const TABS = ['liked', 'playlists', 'history', 'uploads', 'following'] as const
type Tab = (typeof TABS)[number]

export const Route = createFileRoute('/library')({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => ({
    tab: TABS.includes(s.tab as Tab) ? (s.tab as Tab) : undefined,
  }),
  component: Library,
})

function Library() {
  const { tab = 'liked' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const liked = useLikedTracks()
  const playlists = usePlaylists(ME)
  const history = useHistory()
  const uploads = useUserTracks(ME)
  const following = useFollowing()
  const openNewPlaylist = useUi((s) => s.openNewPlaylist)

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{m.library_title()}</PageTitle>
      <Tabs
        value={tab}
        onChange={(t) => navigate({ search: { tab: t === 'liked' ? undefined : t }, replace: true })}
        items={[
          { value: 'liked', label: m.tab_liked() },
          { value: 'playlists', label: m.tab_playlists() },
          { value: 'history', label: m.tab_history() },
          { value: 'uploads', label: m.tab_uploads() },
          { value: 'following', label: m.tab_following() },
        ]}
      />

      {tab === 'liked' && <TrackList tracks={liked} empty={m.empty_liked()} />}

      {tab === 'playlists' && (
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => openNewPlaylist()}
            className={clsx(btn.base, btn.soft, btn.md, 'self-start')}
          >
            <Icon name="plus" size={18} /> {m.new_playlist()}
          </button>
          <PlaylistGrid playlists={playlists} />
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col gap-4">
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => clearHistory()}
              className={clsx(btn.base, btn.ghost, btn.sm, 'self-start')}
            >
              {m.clear_history()}
            </button>
          )}
          <TrackList tracks={history} empty={m.empty_history()} />
        </div>
      )}

      {tab === 'uploads' &&
        (uploads.length ? (
          <TrackList tracks={uploads} empty="" />
        ) : (
          <EmptyState
            action={
              <Link to="/upload" className={clsx(btn.base, btn.primary, btn.md)}>
                {m.nav_upload()}
              </Link>
            }
          >
            {m.empty_uploads()}
          </EmptyState>
        ))}

      {tab === 'following' &&
        (following.length ? (
          <div className="flex max-w-xl flex-col">
            {following.map((u) => (
              <ArtistRow key={u.id} user={u} />
            ))}
          </div>
        ) : (
          <EmptyState>{m.empty_following()}</EmptyState>
        ))}
    </div>
  )
}

function TrackList({ tracks, empty }: { tracks: Track[]; empty: string }) {
  if (!tracks.length) return <EmptyState>{empty}</EmptyState>
  const ids = tracks.map((t) => t.id)
  return (
    <div className="flex flex-col">
      {tracks.map((t, i) => (
        <TrackRow key={t.id} track={t} index={i} queue={ids} />
      ))}
    </div>
  )
}
