// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Public: customer checks their own order status by order number
export async function GET(_req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params
    // Basic sanitization — order numbers are BME-YYYYMMDD-XXXX format
    if (!/^BME-\d{8}-\d{4}$/.test(orderNumber)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, customer_name, customer_email,
        delivery_type, delivery_fee, subtotal, total_amount,
        payment_status, status, created_at, paid_at,
        order_items(product_name, size, quantity, unit_price, subtotal, product_image_url),
        delivery_regions(name, state, estimated_days)
      `)
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/orders/[orderNumber]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
