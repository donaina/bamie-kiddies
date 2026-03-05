'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Archive, ShoppingBag,
  BarChart2, Settings, Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin',                    label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/products',           label: 'Products',        icon: Package },
  { href: '/admin/inventory',          label: 'Inventory',       icon: Archive },
  { href: '/admin/orders',             label: 'Orders',          icon: ShoppingBag },
  { href: '/admin/analytics',          label: 'Analytics',       icon: BarChart2 },
  { href: '/admin/settings/delivery',  label: 'Delivery Regions',icon: Truck },
  { href: '/admin/settings',           label: 'Settings',        icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <Link href="/admin" className="flex items-center justify-center">
          <Image
            src="/logo.jpeg"
            alt="Bamie Kiddies"
            width={140}
            height={56}
            className="h-14 w-auto object-contain rounded-md"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
              style={isActive ? { backgroundColor: '#e45826' } : {}}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          View Store ↗
        </Link>
      </div>
    </aside>
  )
}
