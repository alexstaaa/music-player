import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { NotFound } from '../components/lists'
import { MobileNav } from '../components/MobileNav'
import { NewPlaylistDialog } from '../components/NewPlaylistDialog'
import { PlayerBar } from '../components/PlayerBar'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { usePrefs } from '../stores/prefs'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const theme = usePrefs((s) => s.theme)
  return (
    <div className="grid min-h-dvh lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
      <Sidebar />
      <main className="flex min-w-0 flex-col gap-6 px-4 pt-4 pb-44 lg:gap-7 lg:px-10 lg:pt-6 lg:pb-32">
        <TopBar />
        <Outlet />
      </main>
      <PlayerBar />
      <MobileNav />
      <NewPlaylistDialog />
      <Toaster
        theme={theme}
        position="top-center"
        toastOptions={{
          className: '!rounded-2xl !border-line !bg-panel !text-fg !shadow-float !font-sans',
        }}
      />
    </div>
  )
}
