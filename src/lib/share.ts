import { toast } from 'sonner'
import { m } from '../paraglide/messages.js'

export async function copyTrackLink(trackId: string) {
  const url = `${location.origin}${location.pathname}#/track/${trackId}`
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ url })
      return
    } catch {
      // cancelled: fall back to copying
    }
  }
  await navigator.clipboard.writeText(url)
  toast.success(m.link_copied())
}
