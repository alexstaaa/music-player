import clsx from 'clsx'
import { type ComponentProps, useEffect, useId, useRef } from 'react'
import { removeGlassFilter, supportsLiquidGlass, upsertGlassFilter } from '../lib/glass'

type Props = ComponentProps<'div'> & {
  /** Corner radius in px used for the refraction map; CSS radius comes from className. */
  radius: number
  /** Width of the refracting edge band, px. */
  edge?: number
  /** Displacement strength, px. */
  refraction?: number
}

/** Floating translucent layer with edge refraction. Content stays sharp above it. */
export function LiquidGlass({ radius, edge = 16, refraction = 36, className, children, ...rest }: Props) {
  const layerRef = useRef<HTMLSpanElement>(null)
  const filterId = `lg${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    const layer = layerRef.current
    if (!layer || !supportsLiquidGlass) return
    if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return

    let frame = 0
    let lastKey = ''
    const update = () => {
      frame = 0
      const width = Math.round(layer.offsetWidth)
      const height = Math.round(layer.offsetHeight)
      const key = `${width}x${height}`
      if (!width || !height || key === lastKey) return
      lastKey = key
      layer.style.filter = upsertGlassFilter(filterId, { width, height, radius, edge }, refraction)
    }
    const observer = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(update)
    })
    observer.observe(layer)
    update()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      removeGlassFilter(filterId)
    }
  }, [filterId, radius, edge, refraction])

  return (
    <div className={clsx('glass', className)} {...rest}>
      {/* clip-path runs after filter, so the displaced backdrop keeps the rounded shape. */}
      <span ref={layerRef} className="glass__layer" style={{ clipPath: `inset(0 round ${radius}px)` }} />
      <span className="glass__rim" />
      {children}
    </div>
  )
}
