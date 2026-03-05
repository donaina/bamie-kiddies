// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('admin_users').select('id').eq('id', user.id).eq('is_active', true).single()
  return data ? user : null
}

const schema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  sku:      z.string().optional(),
})

// PUT /api/admin/inventory/[variantId]
export async function PUT(request: Request, { params }: { params: Promise<{ variantId: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { variantId } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('product_variants')
      .update({ quantity: parsed.data.quantity, ...(parsed.data.sku ? { sku: parsed.data.sku } : {}) })
      .eq('id', variantId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/admin/inventory/[variantId]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
