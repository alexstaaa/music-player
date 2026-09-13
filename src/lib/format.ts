import { getLocale } from '../paraglide/runtime.js'

export function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function formatCount(n: number) {
  return new Intl.NumberFormat(getLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function formatAgo(daysAgo: number) {
  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' })
  return rtf.format(-daysAgo, 'day')
}

export function avatarStyle(hue: number) {
  return { background: `oklch(0.8 0.08 ${hue})`, color: `oklch(0.28 0.06 ${hue})` }
}
