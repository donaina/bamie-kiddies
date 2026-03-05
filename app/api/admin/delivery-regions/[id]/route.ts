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

const updateSchema = z.object({
  name:           z.string().min(2).optional(),
  state:          z.string().optional(),
  delivery_fee:   z.number().min(0).optional(),
  estimated_days: z.string().optional(),
  is_active:      z.boolean().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('delivery_regions').update(parsed.data).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[PUT /api/admin/delivery-regions/[id]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const supabase = createServiceClient()
    const { error } = await supabase.from('delivery_regions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/delivery-regions/[id]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
