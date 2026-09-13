import { getLocale } from '../paraglide/runtime.js'

export function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function formatCount(n: number) {
  return new Intl.NumberFormat(getLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

export function formatAgo(timestamp: number) {
  const diff = Date.now() - timestamp
  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' })
  for (const [unit, ms] of UNITS) {
    if (diff >= ms) return rtf.format(-Math.floor(diff / ms), unit)
  }
  return rtf.format(0, 'minute')
}

const pluralRules = new Map<string, Intl.PluralRules>()
/** Picks the plural form for the current locale: forms keyed by Intl plural category. */
export function plural(n: number, forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }) {
  const locale = getLocale()
  let rules = pluralRules.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(locale)
    pluralRules.set(locale, rules)
  }
  return forms[rules.select(n)] ?? forms.other
}

export const tracksLabel = (n: number) =>
  `${n} ${getLocale() === 'ru' ? plural(n, { one: 'трек', few: 'трека', many: 'треков', other: 'трека' }) : plural(n, { one: 'track', other: 'tracks' })}`

export const followersLabel = (n: number) =>
  `${formatCount(n)} ${getLocale() === 'ru' ? plural(n, { one: 'подписчик', few: 'подписчика', many: 'подписчиков', other: 'подписчика' }) : plural(n, { one: 'follower', other: 'followers' })}`
