// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ShoppingBag, TrendingUp, Package, AlertTriangle } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
}

export default async function AdminDashboardPage() {
  const supabase = createServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { count: todayOrderCount },
    { data: todayRevenue },
    { count: activeProductCount },
    { data: lowStockItems },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),

    supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', todayStart.toISOString()),

    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    supabase
      .from('product_variants')
      .select('id, size, quantity, products(name)')
      .lte('quantity', 5)
      .gt('quantity', 0)
      .eq('is_active', true)
      .order('quantity', { ascending: true })
      .limit(10),

    supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, status, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const todayRevenueTotal = todayRevenue?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today's Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayOrderCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#e45826' }}>
              {formatCurrency(todayRevenueTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Products</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProductCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{lowStockItems?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <Link href="/admin/orders" className="text-sm font-medium" style={{ color: '#e45826' }}>
                View all →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(order.total_amount)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low stock */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-yellow-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems && lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-800 truncate max-w-[140px]">
                          {(item.products as { name: string } | null)?.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">Size {item.size}</p>
                      </div>
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                        {item.quantity} left
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">All stocked up!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
