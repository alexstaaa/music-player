import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useUsers } from '../db/api'
import type { Track } from '../db/schema'
import { formatAgo, formatCount, formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'
import { Icon } from './Icon'
import { LikeButton, RepostButton } from './TrackActions'
import { TrackMenu } from './TrackMenu'
import { ArtistLink, Avatar, Cover } from './ui'
import { Waveform } from './Waveform'

export function TrackCard({ track, queue, repostBy }: { track: Track; queue: string[]; repostBy?: string }) {
  const users = useUsers()
  const artist = users.get(track.userId)
  const current = usePlayer((s) => s.trackId === track.id)
  const playing = usePlayer((s) => s.trackId === track.id && s.playing)
  const loading = usePlayer((s) => s.trackId === track.id && s.loading)
  const position = usePlayer((s) => (s.trackId === track.id ? s.position : 0))
  const reposter = repostBy ? users.get(repostBy) : undefined

  return (
    <article
      className={clsx(
        'flex gap-4 rounded-[20px] p-3 transition-colors sm:gap-5 sm:p-4',
        current && 'bg-panel',
      )}
    >
      <Cover cover={track.cover} className="size-24 rounded-[14px] sm:size-[132px]">
        <button
          type="button"
          onClick={() => usePlayer.getState().playTrack(track.id, queue)}
          aria-label={playing ? m.pause() : m.play()}
          className={clsx(
            'press absolute bottom-2 left-2 flex size-10 items-center justify-center rounded-full sm:bottom-2.5 sm:left-2.5 sm:size-11',
            current ? 'bg-accent text-on-accent' : 'bg-black/35 text-white backdrop-blur-md',
          )}
        >
          {loading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Icon name={playing ? 'pause' : 'play'} size={playing ? 16 : 18} />
          )}
        </button>
      </Cover>
      <div className="flex min-w-0 grow flex-col gap-2 sm:gap-2.5">
        <div className="flex flex-col gap-0.5">
          {reposter && (
            <div className="flex items-center gap-1.5 text-xs text-fg-3">
              <Icon name="repeat" size={14} />
              <Link to="/artist/$userId" params={{ userId: reposter.id }} className="hover:underline">
                {m.reposted_by({ name: reposter.name })}
              </Link>
            </div>
          )}
          <div className="flex items-center gap-2 text-[13px] text-fg-2">
            <Avatar user={artist} size={18} />
            <ArtistLink user={artist} className="truncate" />
            <span className="shrink-0 text-fg-3">· {formatAgo(track.createdAt)}</span>
          </div>
          <Link
            to="/track/$trackId"
            params={{ trackId: track.id }}
            className="truncate text-base font-semibold tracking-[-0.01em] hover:underline sm:text-lg"
          >
            {track.title}
          </Link>
        </div>
        <Waveform
          peaks={track.peaks}
          bars={120}
          duration={track.duration}
          position={position}
          height={44}
          onSeek={(s) => {
            if (!current) usePlayer.getState().playTrack(track.id, queue)
            usePlayer.getState().seek(s)
          }}
          className="max-sm:hidden"
        />
        <div className="flex items-center gap-2 text-[13px] font-medium text-fg-2">
          <LikeButton track={track} variant="outline" />
          <RepostButton track={track} variant="outline" />
          <TrackMenu track={track} size="sm" />
          <div className="grow" />
          <span className="hidden text-fg-3 sm:inline">
            {formatCount(track.plays)} · {formatTime(track.duration)}
          </span>
        </div>
      </div>
    </article>
  )
}
