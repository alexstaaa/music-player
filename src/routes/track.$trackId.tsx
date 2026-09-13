import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Icon } from '../components/Icon'
import { Waveform } from '../components/Waveform'
import { artistById, coverGradient, fakePeaks, trackById, tracks } from '../data/demo'
import { avatarStyle, formatAgo, formatCount, formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'

export const Route = createFileRoute('/track/$trackId')({
  loader: ({ params }) => {
    const track = trackById(params.trackId)
    if (!track) throw notFound()
    return track
  },
  component: TrackPage,
})

function TrackPage() {
  const track = Route.useLoaderData()
  const artist = artistById(track.artistId)
  const current = usePlayer((s) => s.trackId === track.id)
  const playing = usePlayer((s) => s.trackId === track.id && s.playing)
  const position = usePlayer((s) => (s.trackId === track.id ? s.position : 0))
  const play = usePlayer((s) => s.play)
  const seek = usePlayer((s) => s.seek)
  const related = tracks.filter((t) => t.id !== track.id).slice(0, 4)

  return (
    <div className="flex flex-col gap-7">
      <section className="flex items-end gap-8">
        <div
          className="size-[200px] shrink-0 rounded-[20px] shadow-cover [view-transition-name:cover]"
          style={{ background: coverGradient(track.cover) }}
        />
        <div className="flex min-w-0 grow flex-col gap-3.5">
          <div className="overline">{m.track_kicker({ genre: track.genre })}</div>
          <h1 className="display-tight text-5xl font-semibold">{track.title}</h1>
          <div className="flex items-center gap-2.5 text-[15px] text-fg-2">
            <span
              className="flex size-[26px] items-center justify-center rounded-full text-[11px] font-bold"
              style={avatarStyle(artist?.hue ?? 0)}
            >
              {artist?.name[0]}
            </span>
            <span className="font-semibold text-fg">{artist?.name}</span>·
            <span>{formatAgo(track.daysAgo)}</span>·
            <span>{m.plays({ count: formatCount(track.plays) })}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => play(track.id)}
              aria-label={playing ? m.pause() : m.play()}
              className="press flex size-14 items-center justify-center rounded-full bg-accent text-on-accent"
            >
              <Icon name={playing ? 'pause' : 'play'} size={22} />
            </button>
            <button
              type="button"
              className="press flex h-10 items-center gap-2 rounded-full bg-accent-soft pr-4 pl-3 text-sm font-semibold text-accent-fg"
            >
              <Icon name="heartFilled" size={18} />
              {formatCount(track.likes)}
            </button>
            <button
              type="button"
              className="press flex h-10 items-center gap-2 rounded-full bg-raised pr-4 pl-3 text-sm font-semibold"
            >
              <Icon name="repeat" size={18} />
              {formatCount(track.reposts)}
            </button>
            <button
              type="button"
              className="press flex h-10 items-center gap-2 rounded-full bg-raised pr-4 pl-3 text-sm font-semibold"
            >
              <Icon name="share" size={18} />
              {m.share()}
            </button>
            <button
              type="button"
              aria-label={m.more()}
              className="press flex size-10 items-center justify-center rounded-full bg-raised"
            >
              <Icon name="more" size={18} />
            </button>
          </div>
        </div>
      </section>

      <Waveform
        peaks={fakePeaks(track.seed, 190)}
        duration={track.duration}
        position={position}
        height={96}
        labels
        playhead={current}
        onSeek={(s) => {
          if (!current) play(track.id)
          seek(s)
        }}
      />

      <section className="grid grid-cols-[minmax(0,1fr)_360px] gap-14">
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">
            {m.comments()} <span className="font-normal text-fg-3">{track.comments}</span>
          </h2>
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-full text-[13px] font-bold"
              style={avatarStyle(250)}
            >
              В
            </span>
            <input
              placeholder={m.comment_at({ time: formatTime(position) })}
              className="h-11 grow rounded-xl bg-raised px-3.5 text-sm outline-none placeholder:text-fg-3"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <h2 className="text-lg font-semibold">{m.similar_tracks()}</h2>
          {related.map((t) => (
            <Link
              key={t.id}
              to="/track/$trackId"
              params={{ trackId: t.id }}
              className="flex h-14 items-center gap-3"
            >
              <span
                className="size-12 shrink-0 rounded-[10px]"
                style={{ background: coverGradient(t.cover) }}
              />
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">{t.title}</span>
                <span className="truncate text-[13px] text-fg-2">{artistById(t.artistId)?.name}</span>
              </span>
              <span className="text-xs text-fg-3">{formatCount(t.plays)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
