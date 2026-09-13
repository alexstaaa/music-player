import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { artistById, coverGradient, trackById } from '../data/demo'
import { formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'
import { Icon } from './Icon'
import { LiquidGlass } from './LiquidGlass'

export function PlayerBar() {
  const p = usePlayer()
  const track = p.trackId ? trackById(p.trackId) : undefined
  if (!track) return null
  const artist = artistById(track.artistId)
  const progress = Math.min(1, p.position / track.duration)

  return (
    <LiquidGlass
      radius={20}
      edge={18}
      refraction={40}
      className="fixed right-4 bottom-4 left-[calc(var(--sidebar-w)+16px)] z-20 grid h-[76px] grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] items-center gap-6 rounded-[20px] px-4 shadow-float"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/track/$trackId"
          params={{ trackId: track.id }}
          className="size-12 shrink-0 rounded-[10px]"
          style={{ background: coverGradient(track.cover) }}
          aria-label={track.title}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to="/track/$trackId"
            params={{ trackId: track.id }}
            className="truncate text-sm font-semibold hover:underline"
          >
            {track.title}
          </Link>
          <span className="truncate text-[13px] text-fg-2">{artist?.name}</span>
        </div>
        <button
          type="button"
          aria-label={m.like()}
          className="press flex size-9 items-center justify-center text-accent-fg"
        >
          <Icon name="heartFilled" size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-[18px]">
          <button
            type="button"
            aria-label={m.shuffle()}
            aria-pressed={p.shuffle}
            onClick={p.toggleShuffle}
            className={clsx('press', p.shuffle ? 'text-accent-fg' : 'text-fg-2')}
          >
            <Icon name="shuffle" size={18} />
          </button>
          <button type="button" aria-label={m.previous()} onClick={p.prev} className="press">
            <Icon name="prev" />
          </button>
          <button
            type="button"
            aria-label={p.playing ? m.pause() : m.play()}
            onClick={p.toggle}
            className="press flex size-10 items-center justify-center rounded-full bg-fg text-bg"
          >
            <Icon name={p.playing ? 'pause' : 'play'} size={16} />
          </button>
          <button type="button" aria-label={m.next()} onClick={p.next} className="press">
            <Icon name="next" />
          </button>
          <button
            type="button"
            aria-label={m.repeat()}
            aria-pressed={p.repeat}
            onClick={p.toggleRepeat}
            className={clsx('press', p.repeat ? 'text-accent-fg' : 'text-fg-2')}
          >
            <Icon name="repeat" size={18} />
          </button>
        </div>
        <div className="flex w-full items-center gap-2.5 text-[11px] text-fg-3">
          <span>{formatTime(p.position)}</span>
          <input
            type="range"
            min={0}
            max={track.duration}
            step={1}
            value={p.position}
            onChange={(e) => p.seek(Number(e.target.value))}
            aria-label={formatTime(p.position)}
            className="h-1 grow cursor-pointer appearance-none rounded-full bg-track [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fg [&::-webkit-slider-thumb]:opacity-0 hover:[&::-webkit-slider-thumb]:opacity-100"
            style={{
              background: `linear-gradient(to right, var(--accent-fg) ${progress * 100}%, var(--track) ${progress * 100}%)`,
            }}
          />
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3.5 text-fg-2">
        <Icon name="queue" size={18} />
        <Icon name="volume" size={18} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={p.volume}
          onChange={(e) => p.setVolume(Number(e.target.value))}
          aria-label={m.volume()}
          className="h-1 w-24 cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fg"
          style={{
            background: `linear-gradient(to right, var(--fg-2) ${p.volume * 100}%, var(--track) ${p.volume * 100}%)`,
          }}
        />
      </div>
    </LiquidGlass>
  )
}
