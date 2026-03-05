'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { Button } from '@/components/ui/button'
import { Trash2, ShoppingBag, Minus, Plus } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven&apos;t added any shoes yet.</p>
        <Button asChild className="text-white" style={{ backgroundColor: '#e45826' }}>
          <Link href="/shop">Start Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              {/* Image */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl">👟</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.slug}`} className="font-semibold text-gray-900 hover:underline line-clamp-1">
                  {item.productName}
                </Link>
                <p className="text-sm text-gray-500 mt-0.5">Size: {item.size}</p>
                <p className="font-bold mt-1" style={{ color: '#e45826' }}>{formatCurrency(item.price)}</p>

                {/* Qty stepper */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, Math.min(item.maxQuantity, item.quantity + 1))}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Remove + line total */}
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <p className="font-bold text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 sticky top-20">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal())}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span style={{ color: '#e45826' }}>{formatCurrency(subtotal())}</span>
            </div>
            <Button asChild size="lg" className="w-full text-white font-semibold" style={{ backgroundColor: '#e45826' }}>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <Link href="/shop" className="block text-center text-sm text-gray-400 hover:text-gray-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
