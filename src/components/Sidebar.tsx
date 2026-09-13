import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { avatarStyle } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePrefs } from '../stores/prefs'
import { Icon, type IconName } from './Icon'

const nav: { to: string; icon: IconName; label: () => string }[] = [
  { to: '/', icon: 'home', label: m.nav_feed },
  { to: '/search', icon: 'search', label: m.nav_search },
  { to: '/library', icon: 'library', label: m.nav_library },
  { to: '/upload', icon: 'upload', label: m.nav_upload },
]

const playlists: [string, number, number][] = [
  ['Для дороги', 60, 20],
  ['Ночной фокус', 240, 280],
  ['Любимое', 340, 10],
]

export function Sidebar() {
  const locale = usePrefs((s) => s.locale)
  const setLocale = usePrefs((s) => s.setLocale)

  return (
    <aside className="sticky top-0 flex h-dvh flex-col gap-7 border-r border-line bg-side px-3.5 py-6">
      <Link to="/" className="flex items-center gap-2.5 px-3 py-1.5">
        <span className="flex h-6 items-center gap-[3px]" aria-hidden="true">
          {[10, 18, 24, 14, 20].map((h, i) => (
            <span key={i} className="w-1 rounded-sm bg-accent" style={{ height: h }} />
          ))}
        </span>
        <span className="font-display text-base font-semibold tracking-[-0.02em]">{m.app_name()}</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/' }}
            className="press flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-fg-2 transition-colors hover:text-fg data-[status=active]:bg-raised data-[status=active]:text-fg"
          >
            <Icon name={item.icon} />
            {item.label()}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-1">
        <div className="overline px-3 pb-2">{m.playlists()}</div>
        {playlists.map(([name, h1, h2]) => (
          <div key={name} className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm text-fg-2">
            <span
              className="size-6 rounded-md"
              style={{
                background: `radial-gradient(110% 90% at 18% 12%, oklch(0.82 0.13 ${h1}) 0%, transparent 60%), oklch(0.3 0.08 ${h2})`,
              }}
            />
            {name}
          </div>
        ))}
      </div>

      <div className="grow" />

      <div className="flex items-center gap-2.5 px-3 py-2">
        <span
          className="flex size-8 items-center justify-center rounded-full text-[13px] font-bold"
          style={avatarStyle(250)}
        >
          В
        </span>
        <span className="grow truncate text-sm font-medium">{m.my_profile()}</span>
        <div className="flex gap-0.5 rounded-lg bg-raised p-0.5 text-[11px] font-semibold">
          {(['ru', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={clsx(
                'rounded-md px-1.5 py-[3px] uppercase',
                locale === l ? 'bg-panel text-fg' : 'text-fg-3',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
