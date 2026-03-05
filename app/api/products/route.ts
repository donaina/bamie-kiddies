import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const gender   = searchParams.get('gender')
    const search   = searchParams.get('search')

    const supabase = createServiceClient()
    let query = supabase
      .from('products')
      .select(`
        id, name, slug, price, category, gender, age_group,
        product_images(cloudinary_url, is_primary),
        product_variants(quantity)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category && category !== 'all') query = query.eq('category', category)
    if (gender   && gender   !== 'all') query = query.eq('gender', gender)
    if (search)                         query = query.ilike('name', `%${search}%`)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/products]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
