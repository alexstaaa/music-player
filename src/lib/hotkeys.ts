import { toggleLike } from '../db/api'
import { usePlayer } from '../stores/player'

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/** Global player shortcuts. Deliberately no animation on any of these (100+/day actions). */
export function installHotkeys() {
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
    const p = usePlayer.getState()
    switch (e.key) {
      case ' ':
        if (
          e.target instanceof HTMLButtonElement ||
          (e.target as HTMLElement).getAttribute?.('role') === 'slider'
        )
          return
        e.preventDefault()
        p.toggle()
        break
      case 'ArrowRight':
        e.preventDefault()
        e.shiftKey ? p.next() : p.seekBy(5)
        break
      case 'ArrowLeft':
        e.preventDefault()
        e.shiftKey ? p.prev() : p.seekBy(-5)
        break
      case 'm':
      case 'M':
      case 'ь':
        p.toggleMute()
        break
      case 'l':
      case 'L':
      case 'д':
        if (p.trackId) toggleLike(p.trackId)
        break
      case '/':
        e.preventDefault()
        window.dispatchEvent(new Event('focus-search'))
        break
    }
  })
}
