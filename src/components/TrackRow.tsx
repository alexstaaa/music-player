import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useUsers } from '../db/api'
import type { Track } from '../db/schema'
import { formatCount, formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'
import { Icon } from './Icon'
import { LikeButton } from './TrackActions'
import { TrackMenu } from './TrackMenu'
import { ArtistLink, Cover } from './ui'

/** Compact list row used by playlists, library, search and artist pages. */
export function TrackRow({
  track,
  index,
  queue,
  playlistId,
}: {
  track: Track
  index?: number
  queue: string[]
  playlistId?: string
}) {
  const users = useUsers()
  const current = usePlayer((s) => s.trackId === track.id)
  const playing = usePlayer((s) => s.trackId === track.id && s.playing)

  return (
    <div
      className={clsx(
        'group flex h-16 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-raised/60',
        current && 'bg-raised/60',
      )}
    >
      {index !== undefined && (
        <span
          className={clsx(
            'w-6 text-center text-[13px] font-semibold',
            current ? 'text-accent-fg' : 'text-fg-3',
          )}
        >
          {index + 1}
        </span>
      )}
      <Cover cover={track.cover} className="size-12 rounded-[10px]">
        <button
          type="button"
          aria-label={playing ? m.pause() : m.play()}
          onClick={() => usePlayer.getState().playTrack(track.id, queue)}
          className={clsx(
            'absolute inset-0 flex items-center justify-center bg-black/35 text-white transition-opacity',
            playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          )}
        >
          <Icon name={playing ? 'pause' : 'play'} size={18} />
        </button>
      </Cover>
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <Link
          to="/track/$trackId"
          params={{ trackId: track.id }}
          className={clsx('truncate text-[15px] font-semibold hover:underline', current && 'text-accent-fg')}
        >
          {track.title}
        </Link>
        <ArtistLink user={users.get(track.userId)} className="truncate text-[13px] text-fg-2" />
      </div>
      <span className="hidden text-xs text-fg-3 sm:block">{formatCount(track.plays)}</span>
      <LikeButton track={track} variant="icon" />
      <span className="w-10 text-right text-[13px] text-fg-3">{formatTime(track.duration)}</span>
      <TrackMenu track={track} playlistId={playlistId} size="sm" />
    </div>
  )
}
