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
  name:           z.string().min(2),
  state:          z.string().optional(),
  delivery_fee:   z.number().min(0),
  estimated_days: z.string().optional(),
  is_active:      z.boolean().default(true),
})

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('delivery_regions')
      .select('*')
      .order('name')
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/admin/delivery-regions]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase.from('delivery_regions').insert(parsed.data).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/delivery-regions]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
