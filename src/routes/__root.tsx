import { createRootRoute, Outlet } from '@tanstack/react-router'
import { PlayerBar } from '../components/PlayerBar'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { m } from '../paraglide/messages.js'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <p className="py-24 text-center text-fg-2">{m.not_found()}</p>,
})

function RootLayout() {
  return (
    <div className="grid min-h-dvh grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
      <Sidebar />
      <main className="flex min-w-0 flex-col gap-7 px-10 pt-6 pb-32">
        <TopBar />
        <Outlet />
      </main>
      <PlayerBar />
    </div>
  )
}
