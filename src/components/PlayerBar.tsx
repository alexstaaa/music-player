import { Popover } from '@base-ui/react/popover'
import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useTrack, useTracksByIds, useUsers } from '../db/api'
import { formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'
import { Icon } from './Icon'
import { LiquidGlass } from './LiquidGlass'
import { popupMotion } from './overlay'
import { LikeButton } from './TrackActions'
import { ArtistLink, Cover } from './ui'

export function PlayerBar() {
  const trackId = usePlayer((s) => s.trackId)
  const track = useTrack(trackId ?? undefined)
  const users = useUsers()
  const p = usePlayer()
  if (!trackId || !track) return null
  const duration = p.duration || track.duration
  const progress = duration ? Math.min(1, p.position / duration) : 0

  return (
    <LiquidGlass
      radius={20}
      edge={18}
      refraction={40}
      className="fixed inset-x-2 bottom-[76px] z-30 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] px-2.5 shadow-float lg:right-4 lg:bottom-4 lg:left-[calc(var(--sidebar-w)+16px)] lg:h-[76px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-6 lg:px-4"
    >
      {/* Mobile progress hairline */}
      <div className="absolute! inset-x-4 bottom-0 h-0.5 overflow-hidden rounded-full bg-track lg:hidden">
        <div className="h-full bg-accent-fg" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Link to="/track/$trackId" params={{ trackId: track.id }} aria-label={track.title}>
          <Cover cover={track.cover} className="size-11 rounded-[10px] lg:size-12" />
        </Link>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to="/track/$trackId"
            params={{ trackId: track.id }}
            className="truncate text-sm font-semibold hover:underline"
          >
            {track.title}
          </Link>
          <ArtistLink user={users.get(track.userId)} className="truncate text-[13px] text-fg-2" />
        </div>
        <span className="max-lg:hidden">
          <LikeButton track={track} variant="icon" />
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1 lg:gap-3">
          <button
            type="button"
            aria-label={m.shuffle()}
            aria-pressed={p.shuffle}
            onClick={p.toggleShuffle}
            className={clsx(
              'press size-9 max-lg:hidden',
              p.shuffle ? 'text-accent-fg' : 'text-fg-2 hover:text-fg',
            )}
          >
            <Icon name="shuffle" size={18} className="mx-auto" />
          </button>
          <button
            type="button"
            aria-label={m.previous()}
            onClick={p.prev}
            className="press size-9 max-lg:hidden"
          >
            <Icon name="prev" className="mx-auto" />
          </button>
          <button
            type="button"
            aria-label={p.playing ? m.pause() : m.play()}
            onClick={p.toggle}
            className="press flex size-10 items-center justify-center rounded-full bg-fg text-bg"
          >
            {p.loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Icon name={p.playing ? 'pause' : 'play'} size={16} />
            )}
          </button>
          <button type="button" aria-label={m.next()} onClick={() => p.next()} className="press size-9">
            <Icon name="next" className="mx-auto" />
          </button>
          <button
            type="button"
            aria-label={p.repeat === 'one' ? m.repeat_one() : m.repeat()}
            aria-pressed={p.repeat !== 'off'}
            onClick={p.cycleRepeat}
            className={clsx(
              'press relative size-9 max-lg:hidden',
              p.repeat !== 'off' ? 'text-accent-fg' : 'text-fg-2 hover:text-fg',
            )}
          >
            <Icon name="repeat" size={18} className="mx-auto" />
            {p.repeat === 'one' && (
              <span className="absolute top-0.5 right-0.5 text-[9px] leading-none font-bold">1</span>
            )}
          </button>
        </div>
        <div className="flex w-full items-center gap-2.5 text-[11px] text-fg-3 max-lg:hidden">
          <span className="w-8 text-right">{formatTime(p.position)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={p.position}
            onChange={(e) => p.seek(Number(e.target.value))}
            aria-label={formatTime(p.position)}
            className="range grow"
            style={
              { '--fill': `${progress * 100}%`, '--fill-color': 'var(--accent-fg)' } as React.CSSProperties
            }
          />
          <span className="w-8">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-fg-2 max-lg:hidden">
        <QueueButton />
        <button
          type="button"
          aria-label={m.mute()}
          aria-pressed={p.muted}
          onClick={p.toggleMute}
          className="press size-9 hover:text-fg"
        >
          <Icon name={p.muted || p.volume === 0 ? 'mute' : 'volume'} size={18} className="mx-auto" />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={p.muted ? 0 : p.volume}
          onChange={(e) => {
            p.setVolume(Number(e.target.value))
            if (p.muted) p.toggleMute()
          }}
          aria-label={m.volume()}
          className="range w-24"
          style={
            {
              '--fill': `${(p.muted ? 0 : p.volume) * 100}%`,
              '--fill-color': 'var(--fg-2)',
            } as React.CSSProperties
          }
        />
      </div>
    </LiquidGlass>
  )
}

function QueueButton() {
  const queue = usePlayer((s) => s.queue)
  const trackId = usePlayer((s) => s.trackId)
  const tracks = useTracksByIds(queue)
  const users = useUsers()
  const index = queue.indexOf(trackId ?? '')
  const upNext = [
    ...tracks.slice(index + 1),
    ...(usePlayer.getState().repeat === 'all' ? tracks.slice(0, index) : []),
  ]
  const current = tracks[index]

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={m.queue()}
        className="press size-9 hover:text-fg data-[popup-open]:text-accent-fg"
      >
        <Icon name="queue" size={18} className="mx-auto" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="end" sideOffset={14} className="z-50">
          <Popover.Popup
            className={clsx(
              'flex max-h-[min(520px,70vh)] w-[360px] flex-col rounded-3xl border border-line bg-panel p-2 shadow-float outline-none',
              popupMotion,
            )}
          >
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <Popover.Title className="text-[15px] font-semibold">{m.queue()}</Popover.Title>
              <button
                type="button"
                onClick={() => usePlayer.getState().clearQueue()}
                className="rounded-full px-2 py-1 text-[13px] text-fg-2 hover:bg-raised hover:text-fg"
              >
                {m.queue_clear()}
              </button>
            </div>
            <div className="overflow-y-auto">
              {current && (
                <>
                  <div className="overline px-3 pt-2 pb-1">{m.queue_now()}</div>
                  <QueueItem
                    id={current.id}
                    title={current.title}
                    artist={users.get(current.userId)?.name}
                    cover={current.cover}
                    active
                  />
                </>
              )}
              <div className="overline px-3 pt-3 pb-1">{m.queue_next()}</div>
              {upNext.length === 0 && <p className="px-3 py-4 text-sm text-fg-3">{m.queue_empty()}</p>}
              {upNext.map((t) => (
                <QueueItem
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  artist={users.get(t.userId)?.name}
                  cover={t.cover}
                />
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function QueueItem({
  id,
  title,
  artist,
  cover,
  active,
}: {
  id: string
  title: string
  artist?: string
  cover: [number, number]
  active?: boolean
}) {
  return (
    <div className="group flex h-14 items-center gap-3 rounded-xl px-2 hover:bg-raised">
      <button
        type="button"
        onClick={() => usePlayer.getState().playTrack(id)}
        className="flex min-w-0 grow items-center gap-3 text-left"
      >
        <Cover cover={cover} className="size-10 rounded-lg" />
        <span className="flex min-w-0 flex-col">
          <span className={clsx('truncate text-sm font-semibold', active && 'text-accent-fg')}>{title}</span>
          <span className="truncate text-xs text-fg-2">{artist}</span>
        </span>
      </button>
      {!active && (
        <button
          type="button"
          aria-label={m.delete()}
          onClick={() => usePlayer.getState().removeFromQueue(id)}
          className="flex size-8 items-center justify-center rounded-full text-fg-3 opacity-0 group-hover:opacity-100 hover:text-fg focus-visible:opacity-100"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}
