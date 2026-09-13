import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import type { Genre, Playlist, Track, User } from '../db/schema'
import { m } from '../paraglide/messages.js'

export function coverGradient([h1, h2]: [number, number]) {
  return `radial-gradient(110% 90% at 18% 12%, oklch(0.82 0.13 ${h1}) 0%, transparent 60%), radial-gradient(90% 100% at 90% 95%, oklch(0.5 0.17 ${h2}) 0%, transparent 65%), oklch(0.3 0.08 ${h2})`
}

export const genreLabel = (g: Genre) =>
  ({
    electronic: m.genre_electronic,
    ambient: m.genre_ambient,
    techno: m.genre_techno,
    indie: m.genre_indie,
    lofi: m.genre_lofi,
    synthwave: m.genre_synthwave,
  })[g]()

export const GENRES: Genre[] = ['electronic', 'synthwave', 'techno', 'ambient', 'lofi', 'indie']

export function Cover({
  cover,
  className,
  children,
  style,
  ...rest
}: { cover: [number, number] } & ComponentProps<'div'>) {
  return (
    <div
      className={clsx('relative shrink-0 overflow-hidden', className)}
      style={{ background: coverGradient(cover), ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}

export function PlaylistCover({
  playlist,
  tracks,
  className,
}: {
  playlist: Playlist
  tracks: Track[]
  className?: string
}) {
  const covers = tracks.slice(0, 4)
  if (covers.length < 4) return <Cover cover={playlist.cover} className={className} />
  return (
    <div className={clsx('grid shrink-0 grid-cols-2 overflow-hidden', className)}>
      {covers.map((t) => (
        <div key={t.id} style={{ background: coverGradient(t.cover) }} />
      ))}
    </div>
  )
}

export function Avatar({ user, size = 32, className }: { user?: User; size?: number; className?: string }) {
  const hue = user?.hue ?? 0
  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full font-bold select-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `oklch(0.8 0.08 ${hue})`,
        color: `oklch(0.28 0.06 ${hue})`,
      }}
      aria-hidden="true"
    >
      {user?.name.slice(0, 1).toUpperCase()}
    </span>
  )
}

export function ArtistLink({ user, className }: { user?: User; className?: string }) {
  if (!user) return <span className={className}>…</span>
  return (
    <Link to="/artist/$userId" params={{ userId: user.id }} className={clsx('hover:underline', className)}>
      {user.name}
    </Link>
  )
}

export const btn = {
  base: 'press inline-flex shrink-0 items-center justify-center gap-2 rounded-full whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  primary: 'bg-accent text-on-accent',
  solid: 'bg-fg text-bg',
  soft: 'bg-raised text-fg hover:bg-[color-mix(in_oklch,var(--raised),var(--fg)_6%)]',
  ghost: 'text-fg-2 hover:bg-raised hover:text-fg',
  md: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-[13px]',
  icon: 'size-10',
}

export function PageTitle({ children, kicker }: { children: ReactNode; kicker?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {kicker && <div className="overline">{kicker}</div>}
      <h1 className="font-display text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] lg:text-[32px]">
        {children}
      </h1>
    </div>
  )
}

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[20px] border border-dashed border-line px-6 py-14 text-center text-fg-2">
      <p className="max-w-sm text-[15px] text-pretty">{children}</p>
      {action}
    </div>
  )
}

export function Tabs<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T
  items: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 text-sm font-medium [scrollbar-width:none] lg:mx-0 lg:px-0"
      role="tablist"
    >
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={clsx(
            'press h-9 shrink-0 rounded-full px-4 whitespace-nowrap transition-colors',
            value === it.value ? 'bg-fg text-bg' : 'bg-raised text-fg-2 hover:text-fg',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export const inputClass =
  'h-11 w-full rounded-xl bg-raised px-3.5 text-[15px] text-fg outline-none placeholder:text-fg-3 focus-visible:ring-2 focus-visible:ring-accent-fg'
