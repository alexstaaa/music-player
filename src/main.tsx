import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startAudioEngine } from './audio/engine'
import { seedIfEmpty } from './db/seed'
import { installHotkeys } from './lib/hotkeys'
import { routeTree } from './routeTree.gen'
import { usePrefs } from './stores/prefs'
import './styles.css'

const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  // Re-render translated UI on locale change without reloading (keeps playback alive).
  const locale = usePrefs((s) => s.locale)
  return <RouterProvider key={locale} router={router} />
}

await seedIfEmpty()
startAudioEngine()
installHotkeys()

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
