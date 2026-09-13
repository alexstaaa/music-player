import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/ComingSoon'
import { m } from '../paraglide/messages.js'

export const Route = createFileRoute('/upload')({ component: () => <ComingSoon title={m.nav_upload()} /> })
