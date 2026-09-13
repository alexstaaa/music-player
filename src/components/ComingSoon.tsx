import { m } from '../paraglide/messages.js'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="text-fg-2">{m.coming_soon()}</p>
    </div>
  )
}
