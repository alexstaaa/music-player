import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import clsx from 'clsx'
import type { ReactNode } from 'react'

// Shared popup styling: scale from the trigger (menus) or center (dialogs), 150–200ms strong ease-out.
export const popupMotion =
  'origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 ease-snap data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0'

export const menuPopup = clsx(
  'min-w-[220px] rounded-2xl border border-line bg-panel p-1.5 text-sm shadow-float outline-none',
  popupMotion,
)

export const menuItem =
  'flex h-10 cursor-default items-center gap-3 rounded-[10px] px-3 text-fg outline-none select-none data-[highlighted]:bg-raised data-[disabled]:opacity-40'

export function MenuContent({
  children,
  align = 'end',
}: {
  children: ReactNode
  align?: 'start' | 'end' | 'center'
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={6} align={align} className="z-50">
        <Menu.Popup className={menuPopup}>{children}</Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={clsx(
            'fixed top-1/2 left-1/2 z-50 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-panel p-6 shadow-float outline-none',
            'transition-[scale,opacity] duration-200 ease-snap data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          )}
        >
          <Dialog.Title className="mb-5 font-display text-xl font-semibold tracking-[-0.02em]">
            {title}
          </Dialog.Title>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
