import type { SVGProps } from 'react'

const stroke = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  library: <path d="M5 4v16M9.5 4v16M14 5l5 14.5" />,
  upload: (
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" />
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
  ),
  repeat: (
    <path d="M17 3.5 20 6.5l-3 3M20 6.5H8a4 4 0 0 0-4 4V12M7 20.5l-3-3 3-3M4 17.5h12a4 4 0 0 0 4-4V12" />
  ),
  share: (
    <path d="M12 14.5V4M8 7.5 12 3.5l4 4M7 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" />
  ),
  shuffle: (
    <path d="M3.5 7h3.2a4 4 0 0 1 3.3 1.8l4 6.4a4 4 0 0 0 3.3 1.8h3.2M18 14.5l2.5 2.5-2.5 2.5M3.5 17h3.2a4 4 0 0 0 3.3-1.8M14 8.8A4 4 0 0 1 17.3 7h3.2M18 4.5 20.5 7 18 9.5" />
  ),
  queue: <path d="M4 6h16M4 12h10M4 18h10M17.5 14.5v6l3.5-3z" />,
  volume: <path d="M4 9.5h3l4.5-4v13L7 14.5H4zM15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />,
  comment: <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z" />,
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
}

const fill = {
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />,
  pause: (
    <>
      <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
      <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
    </>
  ),
  prev: (
    <>
      <path d="M18 6.2v11.6a.8.8 0 0 1-1.2.7L8.5 13a1.1 1.1 0 0 1 0-2l8.3-5.5a.8.8 0 0 1 1.2.7z" />
      <rect x="5" y="5.5" width="2.2" height="13" rx="1.1" />
    </>
  ),
  next: (
    <>
      <path d="M6 6.2v11.6a.8.8 0 0 0 1.2.7l8.3-5.5a1.1 1.1 0 0 0 0-2L7.2 5.5A.8.8 0 0 0 6 6.2z" />
      <rect x="16.8" y="5.5" width="2.2" height="13" rx="1.1" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18.5" cy="12" r="1.5" />
    </>
  ),
  heartFilled: stroke.heart,
}

export type IconName = keyof typeof stroke | keyof typeof fill

export function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const isFill = name in fill
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
      fill={isFill ? 'currentColor' : 'none'}
      stroke={isFill && name !== 'heartFilled' ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {isFill ? fill[name as keyof typeof fill] : stroke[name as keyof typeof stroke]}
    </svg>
  )
}
