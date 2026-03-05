// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('admin_users').select('id').eq('id', user.id).eq('is_active', true).single()
  return data ? user : null
}

// GET /api/admin/analytics?period=30d
export async function GET(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') ?? '30d'
    const days = periodParam === '7d' ? 7 : periodParam === '90d' ? 90 : 30

    const supabase = createServiceClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [
      { data: dailyRevenue },
      { data: topProducts },
      { data: orderStats },
    ] = await Promise.all([
      // Daily revenue & profit
      supabase.rpc('get_revenue_by_day', { p_days: days }),

      // Top products by revenue
      supabase
        .from('order_items')
        .select('product_name, quantity, subtotal, unit_cost, orders!inner(payment_status, created_at)')
        .eq('orders.payment_status', 'paid')
        .gte('orders.created_at', since),

      // Aggregate order stats
      supabase
        .from('orders')
        .select('total_amount, subtotal, delivery_fee, payment_status, status, created_at')
        .gte('created_at', since),
    ])

    // Aggregate top products
    const productMap = new Map<string, { name: string; revenue: number; units: number; profit: number }>()
    for (const item of (topProducts ?? [])) {
      const existing = productMap.get(item.product_name) ?? { name: item.product_name, revenue: 0, units: 0, profit: 0 }
      existing.revenue += item.subtotal
      existing.units   += item.quantity
      existing.profit  += item.subtotal - (item.unit_cost ?? 0) * item.quantity
      productMap.set(item.product_name, existing)
    }
    const topProductsList = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Order summary stats
    const paid   = (orderStats ?? []).filter((o) => o.payment_status === 'paid')
    const totalRevenue  = paid.reduce((s, o) => s + o.total_amount, 0)
    const totalSubtotal = paid.reduce((s, o) => s + o.subtotal, 0)
    const deliveryRevenue = paid.reduce((s, o) => s + o.delivery_fee, 0)
    const totalProfit = (topProducts ?? []).reduce(
      (s, i) => s + i.subtotal - (i.unit_cost ?? 0) * i.quantity, 0
    )

    return NextResponse.json({
      period: periodParam,
      summary: {
        totalOrders:    (orderStats ?? []).length,
        paidOrders:     paid.length,
        totalRevenue,
        totalSubtotal,
        deliveryRevenue,
        totalProfit,
        avgOrderValue:  paid.length ? totalRevenue / paid.length : 0,
      },
      dailyRevenue: dailyRevenue ?? [],
      topProducts: topProductsList,
    })
  } catch (err) {
    console.error('[GET /api/admin/analytics]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
