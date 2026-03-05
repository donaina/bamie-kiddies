import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('delivery_regions')
      .select('id, name, state, delivery_fee, estimated_days')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/delivery-regions]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
