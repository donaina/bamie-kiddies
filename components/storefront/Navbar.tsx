'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const totalItems = useCartStore((s) => s.totalItems())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.jpeg"
              alt="Bamie Kiddies"
              width={120}
              height={48}
              className="h-12 w-auto object-contain rounded-md"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/shop" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Shop
            </Link>
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#e45826' }}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <Link href="/cart" className="relative p-2 text-gray-600">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#e45826' }}>
                  {totalItems}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen((o) => !o)} className="p-2 text-gray-600">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link href="/shop" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">Shop</Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-700">Cart ({totalItems})</Link>
        </div>
      )}
    </header>
  )
}
