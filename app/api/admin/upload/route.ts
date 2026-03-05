// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSignedUploadParams, cloudinary } from '@/lib/cloudinary/config'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('admin_users').select('id').eq('id', user.id).eq('is_active', true).single()
  return data ? user : null
}

export async function POST() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const params = generateSignedUploadParams('bamie-products')
    return NextResponse.json(params)
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { cloudinary_id } = body
    if (!cloudinary_id || typeof cloudinary_id !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    await cloudinary.uploader.destroy(cloudinary_id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
