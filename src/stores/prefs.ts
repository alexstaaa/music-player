import { create } from 'zustand'
import { getLocale, type Locale, setLocale } from '../paraglide/runtime.js'

type Theme = 'light' | 'dark'

const readTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

type Prefs = {
  theme: Theme
  locale: Locale
  toggleTheme: () => void
  setLocale: (locale: Locale) => void
}

export const usePrefs = create<Prefs>((set, get) => ({
  theme: readTheme(),
  locale: getLocale(),
  toggleTheme: () => {
    const theme: Theme = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {}
    set({ theme })
  },
  setLocale: (locale) => {
    // No reload: a reload would stop playback. The app root re-keys on `locale` instead.
    setLocale(locale, { reload: false })
    document.documentElement.lang = locale
    set({ locale })
  },
}))
