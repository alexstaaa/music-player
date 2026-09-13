// Liquid glass refraction: a displacement map of a rounded rect, fed to an SVG
// feDisplacementMap that is applied as `filter` on an element with backdrop-filter.
// Approach adapted from rdev/liquid-glass-react (MIT), minus its per-channel
// chromatic aberration: splitting channels breaks semi-transparent (light) glass. Only Chromium renders the
// displaced backdrop; other engines keep the plain blur.

const SVG_NS = 'http://www.w3.org/2000/svg'

export const supportsLiquidGlass = (() => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Chrome\//.test(ua) && !/Firefox\//.test(ua)
})()

export type GlassShape = { width: number; height: number; radius: number; edge: number }

function displacementMap({ width: w, height: h, radius, edge }: GlassShape): string {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const img = ctx.createImageData(w, h)
  const d = img.data
  const r = Math.min(radius, w / 2, h / 2)
  const e = Math.min(edge, w / 2, h / 2)
  const hw = w / 2
  const hh = h / 2

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw
      const py = y + 0.5 - hh
      const qx = Math.abs(px) - (hw - r)
      const qy = Math.abs(py) - (hh - r)
      const sd = Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
      const dist = Math.max(-sd, 0)
      let nx = 0
      let ny = 0
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy) || 1
        nx = qx / len
        ny = qy / len
      } else if (qx > qy) {
        nx = 1
      } else {
        ny = 1
      }
      if (px < 0) nx = -nx
      if (py < 0) ny = -ny
      const k = dist < e ? (1 - dist / e) ** 2 : 0
      const o = (y * w + x) * 4
      d[o] = Math.round(127.5 - nx * k * 127)
      d[o + 1] = Math.round(127.5 - ny * k * 127)
      d[o + 2] = 128
      d[o + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}

function defsHost(): SVGSVGElement {
  let host = document.getElementById('liquid-glass-defs') as SVGSVGElement | null
  if (!host) {
    host = document.createElementNS(SVG_NS, 'svg')
    host.id = 'liquid-glass-defs'
    host.setAttribute('width', '0')
    host.setAttribute('height', '0')
    host.setAttribute('aria-hidden', 'true')
    host.style.position = 'absolute'
    document.body.appendChild(host)
  }
  return host
}

/** Creates or updates the filter `id` for the given shape. Returns the CSS filter value. */
export function upsertGlassFilter(id: string, shape: GlassShape, scale: number): string {
  const { width: w, height: h } = shape
  const host = defsHost()
  document.getElementById(id)?.remove()
  host.insertAdjacentHTML(
    'beforeend',
    `<filter id="${id}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage href="${displacementMap(shape)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${scale.toFixed(1)}" xChannelSelector="R" yChannelSelector="G" />
    </filter>`,
  )
  return `url(#${id})`
}

export function removeGlassFilter(id: string) {
  document.getElementById(id)?.remove()
}
