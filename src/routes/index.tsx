import { createFileRoute, Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useState } from 'react'
import { TrackCard } from '../components/TrackCard'
import { artists, coverGradient, tracks } from '../data/demo'
import { avatarStyle, formatCount } from '../lib/format'
import { m } from '../paraglide/messages.js'

export const Route = createFileRoute('/')({ component: Feed })

const filters = [m.filter_all, m.filter_tracks, m.filter_reposts, m.filter_playlists]

function Feed() {
  const [filter, setFilter] = useState(0)
  const trending = [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 5)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-12">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.03em]">
            {m.feed_title()}
          </h1>
          <div className="flex gap-2 text-sm font-medium">
            {filters.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFilter(i)}
                aria-pressed={filter === i}
                className={clsx(
                  'press h-9 rounded-full px-4 transition-colors',
                  filter === i ? 'bg-fg text-bg' : 'bg-raised text-fg-2 hover:text-fg',
                )}
              >
                {label()}
              </button>
            ))}
          </div>
        </div>
        {tracks.slice(0, 4).map((t) => (
          <TrackCard key={t.id} track={t} />
        ))}
      </section>

      <aside className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5 rounded-[20px] border border-line bg-panel p-5">
          <h2 className="mb-2 text-[17px] font-semibold">{m.trending()}</h2>
          {trending.map((t, i) => (
            <Link
              key={t.id}
              to="/track/$trackId"
              params={{ trackId: t.id }}
              className="flex h-[52px] items-center gap-3"
            >
              <span className="w-4 text-[13px] font-semibold text-fg-3">{i + 1}</span>
              <span className="size-10 shrink-0 rounded-lg" style={{ background: coverGradient(t.cover) }} />
              <span className="flex min-w-0 grow flex-col">
                <span className="truncate text-sm font-semibold">{t.title}</span>
                <span className="truncate text-xs text-fg-2">
                  {artists.find((a) => a.id === t.artistId)?.name}
                </span>
              </span>
              <span className="text-xs text-fg-3">{formatCount(t.plays)}</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 rounded-[20px] border border-line bg-panel p-5">
          <h2 className="mb-2 text-[17px] font-semibold">{m.who_to_follow()}</h2>
          {artists.slice(1, 4).map((a, i) => (
            <div key={a.id} className="flex h-14 items-center gap-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
                style={avatarStyle(a.hue)}
              >
                {a.name[0]}
              </span>
              <span className="flex min-w-0 grow flex-col">
                <span className="truncate text-sm font-semibold">{a.name}</span>
                <span className="truncate text-xs text-fg-2">
                  {m.followers({ count: formatCount(a.followers) })}
                </span>
              </span>
              <button
                type="button"
                className={clsx(
                  'press h-8 rounded-full px-3 text-[13px] font-semibold',
                  i === 2 ? 'bg-raised text-fg-2' : 'bg-fg text-bg',
                )}
              >
                {i === 2 ? m.following() : m.follow()}
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
