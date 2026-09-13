import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useMe } from '../db/api'
import { ME } from '../db/schema'
import { m } from '../paraglide/messages.js'
import { usePrefs } from '../stores/prefs'
import { Icon } from './Icon'
import { Logo } from './Sidebar'
import { Avatar, btn } from './ui'

export function TopBar() {
  const theme = usePrefs((s) => s.theme)
  const toggleTheme = usePrefs((s) => s.toggleTheme)
  const locale = usePrefs((s) => s.locale)
  const setLocale = usePrefs((s) => s.setLocale)
  const navigate = useNavigate()
  const me = useMe()
  const search = useRouterState({ select: (s) => s.location.search as { q?: string } })
  const onSearchPage = useRouterState({ select: (s) => s.location.pathname === '/search' })
  const [q, setQ] = useState(search.q ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (onSearchPage) setQ(search.q ?? '')
  }, [onSearchPage, search.q])

  useEffect(() => {
    const focus = () => inputRef.current?.focus()
    window.addEventListener('focus-search', focus)
    return () => window.removeEventListener('focus-search', focus)
  }, [])

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <div className="lg:hidden">
        <Logo />
      </div>
      <form
        role="search"
        className="relative hidden w-full max-w-[380px] sm:block"
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ to: '/search', search: { q: q.trim() || undefined } })
        }}
      >
        <Icon
          name="search"
          size={18}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-3"
        />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            navigate({ to: '/search', search: { q: e.target.value || undefined }, replace: onSearchPage })
          }}
          placeholder={m.search_placeholder()}
          aria-label={m.nav_search()}
          className="h-10 w-full rounded-xl bg-raised pr-9 pl-10 text-sm text-fg outline-none placeholder:text-fg-3 focus-visible:ring-2 focus-visible:ring-accent-fg"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-line px-[7px] text-xs text-fg-3">
          /
        </kbd>
      </form>
      <div className="grow" />
      <button
        type="button"
        onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
        className={clsx(btn.base, btn.soft, 'size-10 text-xs uppercase lg:hidden')}
      >
        {locale}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={m.theme_toggle()}
        className={clsx(btn.base, btn.soft, 'size-10 text-fg-2')}
      >
        <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
      </button>
      <Link to="/upload" className={clsx(btn.base, btn.soft, 'h-10 pr-4 pl-3 text-sm max-sm:hidden')}>
        <Icon name="upload" size={18} />
        {m.nav_upload()}
      </Link>
      <Link to="/artist/$userId" params={{ userId: ME }} aria-label={m.my_profile()} className="lg:hidden">
        <Avatar user={me} size={36} />
      </Link>
    </div>
  )
}
