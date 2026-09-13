import { type PointerEvent, useId, useRef } from 'react'
import { formatTime } from '../lib/format'

type Props = {
  peaks: number[]
  duration: number
  position: number
  onSeek?: (seconds: number) => void
  height?: number
  /** Show time labels at both ends (design option A). */
  labels?: boolean
  playhead?: boolean
  className?: string
}

const BAR = 3
const GAP = 2

/** Bars drawn once in two colors; progress only moves a clip rect, so ticks are cheap. */
export function Waveform({
  peaks,
  duration,
  position,
  onSeek,
  height = 96,
  labels,
  playhead,
  className,
}: Props) {
  const clipId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const width = peaks.length * (BAR + GAP) - GAP
  const progress = duration > 0 ? Math.min(1, position / duration) : 0

  const seekFrom = (e: PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || !onSeek) return
    onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * duration)
  }

  const bars = peaks.map((p, i) => {
    const h = Math.max(3, Math.round(p * height))
    return <rect key={i} x={i * (BAR + GAP)} y={(height - h) / 2} width={BAR} height={h} rx={1.5} />
  })

  return (
    <div className={className}>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(position)}
        aria-valuetext={formatTime(position)}
        className="relative cursor-pointer touch-none select-none"
        style={{ height }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          seekFrom(e)
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) seekFrom(e)
        }}
        onKeyDown={(e) => {
          if (!onSeek) return
          if (e.key === 'ArrowRight') onSeek(Math.min(duration, position + 5))
          if (e.key === 'ArrowLeft') onSeek(Math.max(0, position - 5))
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
          <g className="fill-wave">{bars}</g>
          <g className="fill-accent-fg" clipPath={`url(#${clipId})`}>
            {bars}
          </g>
        </svg>
        {playhead && (
          <div
            className="pointer-events-none absolute -top-1 -bottom-1 w-0.5 rounded-full bg-fg"
            style={{ left: `${progress * 100}%` }}
          />
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
