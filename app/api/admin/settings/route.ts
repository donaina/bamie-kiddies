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

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data, error } = await supabase.from('site_settings').select('*')
    if (error) throw error

    // Convert to key-value object
    const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
    return NextResponse.json(settings)
  } catch (err) {
    console.error('[GET /api/admin/settings]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

const schema = z.record(z.string(), z.string())

export async function PUT(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const supabase = createServiceClient()
    const upserts = Object.entries(parsed.data).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/admin/settings]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
