'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/formatCurrency'

interface DailyRevenue {
  sale_date: string
  order_count: number
  revenue: number
  profit: number
}

interface TopProduct {
  name: string
  revenue: number
  units: number
}

const formatK = (v: number | undefined) =>
  v === undefined ? '₦0' : v >= 1000 ? `₦${(v / 1000).toFixed(0)}K` : `₦${v}`

export default function AnalyticsCharts({
  dailyRevenue,
  topProducts,
}: {
  dailyRevenue: DailyRevenue[]
  topProducts: TopProduct[]
}) {
  const revenueData = dailyRevenue.map((d) => ({
    date: new Date(d.sale_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
    Revenue: d.revenue,
    Profit:  d.profit,
    Orders:  d.order_count,
  }))

  return (
    <div className="space-y-6">
      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Revenue & Profit</h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={formatK} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} />
              <Legend />
              <Bar dataKey="Revenue" fill="#e45826" radius={[3,3,0,0]} />
              <Bar dataKey="Profit"  fill="#16a34a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No paid orders in this period
          </div>
        )}
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Top Products by Revenue</h3>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{p.name}</span>
                    <span className="text-sm font-semibold" style={{ color: '#e45826' }}>{formatCurrency(p.revenue)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(5, (p.revenue / topProducts[0].revenue) * 100)}%`,
                        backgroundColor: '#e45826',
                        opacity: 1 - i * 0.15,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{p.units} units sold</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No sales data yet</p>
        )}
      </div>
    </div>
  )
}
