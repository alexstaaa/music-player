import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { artistById, coverGradient, fakePeaks, type Track, tracks } from '../data/demo'
import { formatAgo, formatCount, formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'
import { Icon } from './Icon'
import { Waveform } from './Waveform'

export function TrackCard({ track }: { track: Track }) {
  const artist = artistById(track.artistId)
  const current = usePlayer((s) => s.trackId === track.id)
  const playing = usePlayer((s) => s.trackId === track.id && s.playing)
  const position = usePlayer((s) => (s.trackId === track.id ? s.position : 0))
  const play = usePlayer((s) => s.play)
  const seek = usePlayer((s) => s.seek)

  return (
    <article className={clsx('flex gap-5 rounded-[20px] p-4 transition-colors', current && 'bg-panel')}>
      <div
        className="relative size-[132px] shrink-0 rounded-[14px]"
        style={{ background: coverGradient(track.cover) }}
      >
        <button
          type="button"
          onClick={() =>
            play(
              track.id,
              tracks.map((t) => t.id),
            )
          }
          aria-label={playing ? m.pause() : m.play()}
          className={clsx(
            'press absolute bottom-2.5 left-2.5 flex size-11 items-center justify-center rounded-full',
            current ? 'bg-accent text-on-accent' : 'bg-bg/60 text-fg backdrop-blur-md',
          )}
        >
          <Icon name={playing ? 'pause' : 'play'} size={playing ? 16 : 18} />
        </button>
      </div>
      <div className="flex min-w-0 grow flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-[13px] text-fg-2">
            <span>{artist?.name}</span>
            <span className="text-fg-3">· {formatAgo(track.daysAgo)}</span>
          </div>
          <Link
            to="/track/$trackId"
            params={{ trackId: track.id }}
            className="truncate text-lg font-semibold tracking-[-0.01em] hover:underline"
          >
            {track.title}
          </Link>
        </div>
        <Waveform
          peaks={fakePeaks(track.seed, 120)}
          duration={track.duration}
          position={position}
          height={44}
          onSeek={(s) => {
            if (!current) play(track.id)
            seek(s)
          }}
        />
        <div className="flex items-center gap-2 text-[13px] font-medium text-fg-2">
          {(
            [
              ['heart', track.likes, m.like()],
              ['repeat', track.reposts, m.repost()],
              ['comment', track.comments, m.comments()],
            ] as const
          ).map(([icon, count, label]) => (
            <button
              key={icon}
              type="button"
              aria-label={label}
              className="press flex h-[30px] items-center gap-1.5 rounded-full border border-line pr-3 pl-2.5"
            >
              <Icon name={icon} size={15} />
              {formatCount(count)}
            </button>
          ))}
          <div className="grow" />
          <span className="text-fg-3">
            {formatCount(track.plays)} · {formatTime(track.duration)}
          </span>
        </div>
      </div>
    </article>
  )
}
