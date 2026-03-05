// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import OrderStatusUpdater from '@/components/admin/OrderStatusUpdater'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Props { params: Promise<{ id: string }> }

const STATUS_STYLES: Record<string, string> = {
  pending:'bg-yellow-100 text-yellow-800', confirmed:'bg-blue-100 text-blue-800',
  processing:'bg-purple-100 text-purple-800', shipped:'bg-indigo-100 text-indigo-800',
  delivered:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800',
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`*, order_items(*), delivery_regions(name, state, estimated_days)`)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const region = order.delivery_regions as { name: string; state: string; estimated_days: string } | null

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{order.order_number}</h2>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] ?? ''}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Customer</h3>
          <p className="font-medium text-gray-900">{order.customer_name}</p>
          <p className="text-sm text-gray-500">{order.customer_email}</p>
          <p className="text-sm text-gray-500">{order.customer_phone}</p>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Delivery</h3>
          {order.delivery_type === 'pickup' ? (
            <p className="text-sm font-medium text-gray-900">Pickup</p>
          ) : (
            <>
              <p className="font-medium text-gray-900">{region?.name}</p>
              <p className="text-sm text-gray-500">{order.delivery_address}</p>
              <p className="text-xs text-gray-400">{region?.estimated_days}</p>
            </>
          )}
        </div>

        {/* Payment info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Payment</h3>
          <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
            {order.payment_status}
          </Badge>
          {order.paystack_reference && (
            <p className="text-xs text-gray-400 font-mono">{order.paystack_reference}</p>
          )}
          {order.paid_at && (
            <p className="text-xs text-gray-400">Paid: {new Date(order.paid_at).toLocaleString('en-NG')}</p>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Items Ordered</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {(order.order_items as Array<{
            id: string; product_name: string; size: string; quantity: number;
            unit_price: number; subtotal: number; product_image_url: string | null
          }>).map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product_image_url ? (
                  <Image src={item.product_image_url} alt={item.product_name} fill className="object-cover" sizes="48px" />
                ) : <span className="flex items-center justify-center h-full text-xl">👟</span>}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product_name}</p>
                <p className="text-sm text-gray-500">Size: {item.size} × {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-800">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span>{order.delivery_fee === 0 ? 'Free (Pickup)' : formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span><span style={{ color: '#e45826' }}>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Status updater + notes */}
      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} currentNote={order.admin_note ?? ''} />
    </div>
  )
}
