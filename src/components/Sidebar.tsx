import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useMe, usePlaylists } from '../db/api'
import { ME } from '../db/schema'
import { m } from '../paraglide/messages.js'
import { usePrefs } from '../stores/prefs'
import { useUi } from '../stores/ui'
import { Icon, type IconName } from './Icon'
import { Avatar, Cover } from './ui'

export const NAV: { to: '/' | '/search' | '/library' | '/upload'; icon: IconName; label: () => string }[] = [
  { to: '/', icon: 'home', label: m.nav_feed },
  { to: '/search', icon: 'search', label: m.nav_search },
  { to: '/library', icon: 'library', label: m.nav_library },
  { to: '/upload', icon: 'upload', label: m.nav_upload },
]

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-3 py-1.5">
      <span className="flex h-6 items-center gap-[3px]" aria-hidden="true">
        {[10, 18, 24, 14, 20].map((h, i) => (
          <span key={i} className="w-1 rounded-sm bg-accent" style={{ height: h }} />
        ))}
      </span>
      <span className="font-display text-base font-semibold tracking-[-0.02em]">{m.app_name()}</span>
    </Link>
  )
}

export function Sidebar() {
  const locale = usePrefs((s) => s.locale)
  const setLocale = usePrefs((s) => s.setLocale)
  const playlists = usePlaylists(ME)
  const me = useMe()
  const openNewPlaylist = useUi((s) => s.openNewPlaylist)

  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-7 border-r border-line bg-side px-3.5 py-6 lg:flex">
      <Logo />

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/', includeSearch: false }}
            className="press flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-fg-2 transition-colors hover:text-fg data-[status=active]:bg-raised data-[status=active]:text-fg"
          >
            <Icon name={item.icon} />
            {item.label()}
          </Link>
        ))}
      </nav>

      <div className="flex min-h-0 flex-col gap-1">
        <div className="flex items-center justify-between pr-1 pb-1 pl-3">
          <span className="overline">{m.playlists()}</span>
          <button
            type="button"
            aria-label={m.new_playlist()}
            onClick={() => openNewPlaylist()}
            className="press flex size-7 items-center justify-center rounded-full text-fg-3 hover:bg-raised hover:text-fg"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
        <div className="-mr-2 flex flex-col gap-0.5 overflow-y-auto pr-2">
          {playlists.map((p) => (
            <Link
              key={p.id}
              to="/playlist/$playlistId"
              params={{ playlistId: p.id }}
              className="flex h-10 shrink-0 items-center gap-3 rounded-[10px] px-3 text-sm text-fg-2 transition-colors hover:text-fg data-[status=active]:bg-raised data-[status=active]:text-fg"
            >
              <Cover cover={p.cover} className="size-6 rounded-md" />
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grow" />

      <div className="flex items-center gap-2.5 px-3 py-2">
        <Link to="/artist/$userId" params={{ userId: ME }} className="flex min-w-0 grow items-center gap-2.5">
          <Avatar user={me} size={32} />
          <span className="truncate text-sm font-medium hover:underline">{m.my_profile()}</span>
        </Link>
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
