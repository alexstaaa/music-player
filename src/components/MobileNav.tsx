import { Link } from '@tanstack/react-router'
import { Icon } from './Icon'
import { LiquidGlass } from './LiquidGlass'
import { NAV } from './Sidebar'

export function MobileNav() {
  return (
    <LiquidGlass
      radius={22}
      edge={16}
      refraction={30}
      className="fixed inset-x-2 bottom-2 z-30 grid h-[60px] grid-cols-4 rounded-[22px] px-1 shadow-float lg:hidden"
    >
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === '/', includeSearch: false }}
          className="press flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-fg-3 data-[status=active]:text-fg"
        >
          <Icon name={item.icon} size={22} />
          {item.label()}
        </Link>
      ))}
    </LiquidGlass>
  )
}
