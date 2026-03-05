// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatCurrency'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import { TrendingUp, ShoppingBag, DollarSign, BarChart2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period = '30d' } = await searchParams
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createServiceClient()

  const [{ data: dailyRevenue }, { data: paidOrders }, { data: orderItems }] = await Promise.all([
    supabase.rpc('get_revenue_by_day', { p_days: days }),
    supabase.from('orders').select('total_amount, subtotal, delivery_fee')
      .eq('payment_status', 'paid').gte('created_at', since),
    supabase.from('order_items')
      .select('product_name, quantity, subtotal, unit_cost, orders!inner(payment_status, created_at)')
      .eq('orders.payment_status', 'paid').gte('orders.created_at', since),
  ])

  const totalRevenue  = (paidOrders ?? []).reduce((s, o) => s + o.total_amount, 0)
  const totalProfit   = (orderItems ?? []).reduce((s, i) => s + i.subtotal - (i.unit_cost ?? 0) * i.quantity, 0)
  const totalOrders   = (paidOrders ?? []).length
  const avgOrder      = totalOrders ? totalRevenue / totalOrders : 0

  // Top products
  const productMap = new Map<string, { name: string; revenue: number; units: number }>()
  for (const item of (orderItems ?? [])) {
    const ex = productMap.get(item.product_name) ?? { name: item.product_name, revenue: 0, units: 0 }
    ex.revenue += item.subtotal
    ex.units   += item.quantity
    productMap.set(item.product_name, ex)
  }
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <div className="flex gap-1">
          {(['7d','30d','90d'] as const).map((p) => (
            <a
              key={p}
              href={`/admin/analytics?period=${p}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={period === p ? { backgroundColor: '#e45826' } : {}}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </a>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',  value: formatCurrencyCompact(totalRevenue),  icon: DollarSign,  color: '#e45826' },
          { label: 'Total Profit',   value: formatCurrencyCompact(totalProfit),   icon: TrendingUp,  color: '#16a34a' },
          { label: 'Paid Orders',    value: totalOrders.toString(),               icon: ShoppingBag, color: '#3b82f6' },
          { label: 'Avg Order Value',value: formatCurrencyCompact(avgOrder),      icon: BarChart2,   color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
              <Icon className="h-4 w-4" style={{ color }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts dailyRevenue={dailyRevenue ?? []} topProducts={topProducts} />
    </div>
  )
}
