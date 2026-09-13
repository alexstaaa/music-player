import { createFileRoute, Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { PlaylistGrid } from '../components/lists'
import { TrackRow } from '../components/TrackRow'
import { Avatar, EmptyState, GENRES, genreLabel, inputClass, PageTitle } from '../components/ui'
import { usePlaylists, useTracks, useUsers } from '../db/api'
import { type Genre, ME } from '../db/schema'
import { m } from '../paraglide/messages.js'

type Search = { q?: string; genre?: Genre }

export const Route = createFileRoute('/search')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === 'string' && s.q ? s.q : undefined,
    genre: GENRES.includes(s.genre as Genre) ? (s.genre as Genre) : undefined,
  }),
  component: SearchPage,
})

const norm = (s: string) => s.toLocaleLowerCase().replace(/ё/g, 'е')

function SearchPage() {
  const { q = '', genre } = Route.useSearch()
  const navigate = Route.useNavigate()
  const tracks = useTracks()
  const users = useUsers()
  const playlists = usePlaylists()
  const query = norm(q.trim())

  const matchedTracks = tracks.filter((t) => {
    if (genre && t.genre !== genre) return false
    if (!query) return true
    const hay = norm([t.title, users.get(t.userId)?.name ?? '', genreLabel(t.genre), ...t.tags].join(' '))
    return hay.includes(query)
  })
  const matchedArtists = query
    ? [...users.values()].filter(
        (u) => u.id !== ME && norm(u.name).includes(query) && tracks.some((t) => t.userId === u.id),
      )
    : []
  const matchedPlaylists = query ? playlists.filter((p) => norm(p.name).includes(query)) : []
  const nothing = query && !matchedTracks.length && !matchedArtists.length && !matchedPlaylists.length

  return (
    <div className="flex flex-col gap-7">
      <PageTitle>{m.search_title()}</PageTitle>
      <input
        type="search"
        value={q}
        onChange={(e) =>
          navigate({ search: (s) => ({ ...s, q: e.target.value || undefined }), replace: true })
        }
        placeholder={m.search_hint()}
        aria-label={m.nav_search()}
        className={clsx(inputClass, 'h-12 sm:hidden')}
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 text-sm font-medium [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
        {[undefined, ...GENRES].map((g) => (
          <button
            key={g ?? 'all'}
            type="button"
            aria-pressed={genre === g}
            onClick={() => navigate({ search: (s) => ({ ...s, genre: g }), replace: true })}
            className={clsx(
              'press h-9 shrink-0 rounded-full px-4 transition-colors',
              genre === g ? 'bg-fg text-bg' : 'bg-raised text-fg-2 hover:text-fg',
            )}
          >
            {g ? genreLabel(g) : m.all_genres()}
          </button>
        ))}
      </div>

      {nothing && <EmptyState>{m.search_nothing({ q })}</EmptyState>}

      {matchedArtists.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{m.artists()}</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {matchedArtists.map((u) => (
              <Link
                key={u.id}
                to="/artist/$userId"
                params={{ userId: u.id }}
                className="flex w-28 shrink-0 flex-col items-center gap-2 text-center"
              >
                <Avatar user={u} size={96} />
                <span className="truncate text-sm font-semibold">{u.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedTracks.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="mb-1 text-lg font-semibold">{m.tracks()}</h2>
          {matchedTracks.map((t) => (
            <TrackRow key={t.id} track={t} queue={matchedTracks.map((x) => x.id)} />
          ))}
        </section>
      )}

      {matchedPlaylists.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{m.playlists()}</h2>
          <PlaylistGrid playlists={matchedPlaylists} />
        </section>
      )}
    </div>
  )
}
