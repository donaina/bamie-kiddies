'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Clock, XCircle, ShoppingBag, Truck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/formatCurrency'

interface OrderData {
  order_number: string
  customer_name: string
  delivery_type: string
  delivery_fee: number
  subtotal: number
  total_amount: number
  payment_status: string
  status: string
  created_at: string
  order_items: Array<{
    product_name: string; size: string; quantity: number;
    unit_price: number; subtotal: number; product_image_url: string | null
  }>
  delivery_regions: { name: string; state: string; estimated_days: string } | null
}

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [order,   setOrder]   = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [polls,   setPolls]   = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`)
        if (!res.ok) { setLoading(false); return }
        const data: OrderData = await res.json()
        setOrder(data)
        setLoading(false)

        // Poll until paid (webhook might arrive after redirect)
        if (data.payment_status === 'pending' && polls < 12) {
          timeout = setTimeout(() => setPolls((p) => p + 1), 5000)
        }
      } catch {
        setLoading(false)
      }
    }

    fetchOrder()
    return () => clearTimeout(timeout)
  }, [orderNumber, polls])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-10 w-10 border-4 border-gray-200 rounded-full mx-auto" style={{ borderTopColor: '#e45826' }} />
          <p className="text-gray-500">Verifying your payment…</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <XCircle className="h-14 w-14 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800">Order not found</h1>
          <Button asChild><Link href="/shop">Continue Shopping</Link></Button>
        </div>
      </div>
    )
  }

  const isPaid    = order.payment_status === 'paid'
  const isPending = order.payment_status === 'pending'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Status header */}
      <div className={`rounded-2xl p-8 text-center mb-8 ${isPaid ? 'bg-green-50' : isPending ? 'bg-yellow-50' : 'bg-red-50'}`}>
        {isPaid ? (
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
        ) : isPending ? (
          <Clock className="h-14 w-14 text-yellow-500 mx-auto mb-3 animate-pulse" />
        ) : (
          <XCircle className="h-14 w-14 text-red-400 mx-auto mb-3" />
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isPaid ? 'Order Confirmed!' : isPending ? 'Payment Processing…' : 'Payment Failed'}
        </h1>
        <p className="text-gray-600">
          {isPaid
            ? `Thank you, ${order.customer_name}! Your order has been confirmed.`
            : isPending
            ? 'Your payment is being verified. This page will update automatically.'
            : 'Something went wrong with your payment. Please try again.'}
        </p>
      </div>

      {/* Order number */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 text-center">
        <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider">Your Order Number</p>
        <p className="text-3xl font-black tracking-widest" style={{ color: '#e45826' }}>{order.order_number}</p>
        {isPaid && (
          <p className="text-xs text-gray-400 mt-2">A confirmation email has been sent to your inbox</p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Items Ordered</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.order_items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                {item.product_image_url
                  ? <Image src={item.product_image_url} alt={item.product_name} fill className="object-cover" sizes="48px" />
                  : <div className="flex items-center justify-center h-full text-xl">👟</div>
                }
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                <p className="text-xs text-gray-400">Size {item.size} × {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-800">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 bg-gray-50 space-y-2 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span>{order.delivery_fee === 0 ? 'Free (Pickup)' : formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-1 border-t border-gray-200">
            <span>Total</span><span style={{ color: '#e45826' }}>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 flex items-start gap-4">
        {order.delivery_type === 'pickup'
          ? <Store className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#e45826' }} />
          : <Truck className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#e45826' }} />
        }
        <div>
          <p className="font-semibold text-gray-800">
            {order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}
          </p>
          {order.delivery_type === 'delivery' && order.delivery_regions && (
            <>
              <p className="text-sm text-gray-500">{order.delivery_regions.name}</p>
              {order.delivery_regions.estimated_days && (
                <p className="text-xs text-gray-400">{order.delivery_regions.estimated_days}</p>
              )}
            </>
          )}
          {order.delivery_type === 'pickup' && (
            <p className="text-sm text-gray-500">We&apos;ll contact you with pickup details</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1 text-white" style={{ backgroundColor: '#e45826' }}>
          <Link href="/shop"><ShoppingBag className="h-4 w-4 mr-2" />Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
