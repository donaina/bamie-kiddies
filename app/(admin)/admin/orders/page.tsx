// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Orders' }

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
}

const PAYMENT_STYLES: Record<string, string> = {
  pending:  'bg-gray-100 text-gray-600',
  paid:     'bg-green-100 text-green-700',
  failed:   'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_email,
      total_amount, delivery_type, payment_status, status, created_at,
      delivery_regions(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: orders } = await query

  const tabs = ['all','pending','confirmed','processing','shipped','delivered','cancelled']

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Orders</h2>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={tab === 'all' ? '/admin/orders' : `/admin/orders?status=${tab}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              (status ?? 'all') === tab
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={(status ?? 'all') === tab ? { backgroundColor: '#e45826' } : {}}
          >
            {tab}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Delivery</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(orders ?? []).length > 0 ? (
                (orders ?? []).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold hover:underline" style={{ color: '#e45826' }}>
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.delivery_type === 'pickup'
                        ? 'Pickup'
                        : (order.delivery_regions as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STYLES[order.payment_status] ?? ''}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
