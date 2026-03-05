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

// GET /api/admin/orders?status=&page=&limit=
export async function GET(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status  = searchParams.get('status')
    const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit   = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
    const offset  = (page - 1) * limit

    const supabase = createServiceClient()
    let query = supabase
      .from('orders')
      .select(`
        id, order_number, customer_name, customer_email, customer_phone,
        delivery_type, delivery_fee, subtotal, total_amount,
        payment_status, status, created_at,
        delivery_regions(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ orders: data, total: count, page, limit })
  } catch (err) {
    console.error('[GET /api/admin/orders]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
