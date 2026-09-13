import { Link } from '@tanstack/react-router'
import { m } from '../paraglide/messages.js'
import { usePrefs } from '../stores/prefs'
import { Icon } from './Icon'

export function TopBar() {
  const theme = usePrefs((s) => s.theme)
  const toggleTheme = usePrefs((s) => s.toggleTheme)

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/search"
        className="flex h-10 w-[380px] items-center gap-2.5 rounded-xl bg-raised px-3 text-sm text-fg-3"
      >
        <Icon name="search" size={18} />
        <span className="grow">{m.search_placeholder()}</span>
        <kbd className="rounded-md border border-line px-[7px] text-xs">/</kbd>
      </Link>
      <div className="grow" />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={m.theme_toggle()}
        className="press flex size-10 items-center justify-center rounded-full bg-raised text-fg-2"
      >
        <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
      </button>
      <Link
        to="/upload"
        className="press flex h-10 items-center gap-2 rounded-full bg-raised pr-4 pl-3 text-sm font-semibold"
      >
        <Icon name="upload" size={18} />
        {m.nav_upload()}
      </Link>
    </div>
  )
}
