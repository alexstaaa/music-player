import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/ComingSoon'
import { m } from '../paraglide/messages.js'

export const Route = createFileRoute('/library')({ component: () => <ComingSoon title={m.nav_library()} /> })
