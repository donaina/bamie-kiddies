import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase  = createServiceClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, price, cost_price,
        category, gender, age_group, is_active,
        product_images(id, cloudinary_url, cloudinary_id, is_primary, display_order, alt_text),
        product_variants(id, size, quantity, sku, is_active)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/products/[slug]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
