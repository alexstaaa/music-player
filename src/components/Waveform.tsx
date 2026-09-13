import { type PointerEvent, useId, useRef, useState } from 'react'
import { resamplePeaks } from '../audio/buffers'
import type { Comment, User } from '../db/schema'
import { formatTime } from '../lib/format'
import { Avatar } from './ui'

type Props = {
  peaks: number[]
  bars: number
  duration: number
  position: number
  onSeek?: (seconds: number) => void
  height?: number
  /** Time labels at both ends (design option A). */
  labels?: boolean
  playhead?: boolean
  comments?: Comment[]
  users?: Map<string, User>
  className?: string
}

const BAR = 3
const GAP = 2

/** Bars are drawn twice (rest + played) and progress only moves a clip rect, so playback ticks stay cheap. */
export function Waveform({
  peaks,
  bars,
  duration,
  position,
  onSeek,
  height = 96,
  labels,
  playhead,
  comments,
  users,
  className,
}: Props) {
  const clipId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [openComment, setOpenComment] = useState<string | null>(null)
  const values = peaks.length ? resamplePeaks(peaks, bars) : Array.from({ length: bars }, () => 0.06)
  const width = bars * (BAR + GAP) - GAP
  const progress = duration > 0 ? Math.min(1, position / duration) : 0

  const fraction = (e: PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    return rect ? Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) : 0
  }

  const rects = values.map((p, i) => {
    const h = Math.max(3, Math.round(p * height))
    return <rect key={i} x={i * (BAR + GAP)} y={(height - h) / 2} width={BAR} height={h} rx={1.5} />
  })

  const active = comments?.find((c) => c.id === openComment)

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(position)}
          aria-valuetext={formatTime(position)}
          className="group relative cursor-pointer touch-none select-none"
          style={{ height }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            onSeek?.(fraction(e) * duration)
          }}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse') setHover(fraction(e))
            if (e.currentTarget.hasPointerCapture(e.pointerId)) onSeek?.(fraction(e) * duration)
          }}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (!onSeek) return
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              e.stopPropagation()
              onSeek(Math.min(duration, position + 5))
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              e.stopPropagation()
              onSeek(Math.max(0, position - 5))
            }
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                <rect width={width * progress} height={height} />
              </clipPath>
            </defs>
            <g className="fill-wave">{rects}</g>
            <g className="fill-accent-fg" clipPath={`url(#${clipId})`}>
              {rects}
            </g>
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-fg/40"
              style={{ left: `${hover * 100}%` }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-fg px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-bg">
                {formatTime(hover * duration)}
              </span>
            </div>
          )}
          {playhead && (
            <div
              className="pointer-events-none absolute -top-1 -bottom-1 w-0.5 rounded-full bg-fg"
              style={{ left: `${progress * 100}%` }}
            />
          )}
        </div>

        {comments && comments.length > 0 && duration > 0 && (
          <div className="relative mt-1.5 h-[22px]">
            {comments.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseEnter={() => setOpenComment(c.id)}
                onMouseLeave={() => setOpenComment((id) => (id === c.id ? null : id))}
                onFocus={() => setOpenComment(c.id)}
                onBlur={() => setOpenComment(null)}
                onClick={() => onSeek?.(c.at)}
                aria-label={`${formatTime(c.at)} ${users?.get(c.userId)?.name ?? ''}: ${c.text}`}
                className="absolute top-0 -translate-x-1/2 rounded-full ring-2 ring-bg transition-transform duration-150 ease-snap hover:z-10 hover:scale-125"
                style={{ left: `${Math.min(100, (c.at / duration) * 100)}%` }}
              >
                <Avatar user={users?.get(c.userId)} size={22} />
              </button>
            ))}
            {active && (
              <div
                className="pointer-events-none absolute top-7 z-20 flex max-w-[360px] items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] whitespace-nowrap shadow-float"
                style={{
                  left: `${Math.min(100, (active.at / duration) * 100)}%`,
                  transform: `translateX(${active.at / duration > 0.6 ? '-100%' : '-12px'})`,
                }}
              >
                <span className="font-semibold">{users?.get(active.userId)?.name}</span>
                <span className="text-accent-fg">{formatTime(active.at)}</span>
                <span className="truncate text-fg-2">{active.text}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {labels && (
        <div className="mt-2 flex justify-between text-xs font-medium text-fg-3">
          <span className="text-accent-fg">{formatTime(position)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  )
}
