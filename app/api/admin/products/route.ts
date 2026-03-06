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

const imageSchema = z.object({
  cloudinary_url: z.string().url(),
  cloudinary_id:  z.string().min(1),
  is_primary:     z.boolean(),
  display_order:  z.number(),
  alt_text:       z.string().optional().nullable(),
})

const variantSchema = z.object({
  id:       z.string().uuid().optional().nullable(),
  size:     z.string().min(1),
  quantity: z.number().min(0),
  sku:      z.string().optional().nullable(),
})

const productSchema = z.object({
  name:        z.string().min(2),
  slug:        z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price:            z.number().min(0),
  cost_price:       z.number().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  category:    z.string().optional(),
  gender:      z.enum(['boys','girls','unisex']).optional(),
  age_group:   z.string().optional(),
  is_active:   z.boolean(),
  is_featured: z.boolean(),
  images:      z.array(imageSchema).min(1),
  variants:    z.array(variantSchema).min(1),
})

// GET /api/admin/products
export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, category, is_active, is_featured, created_at,
        product_images(cloudinary_url, is_primary),
        product_variants(quantity)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/admin/products]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST /api/admin/products
export async function POST(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const { images, variants, ...productData } = parsed.data
    const supabase = createServiceClient()

    // Insert product
    const { data: product, error: productErr } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()
    if (productErr) throw productErr

    // Insert images
    if (images.length > 0) {
      const { error: imgErr } = await supabase
        .from('product_images')
        .insert(images.map((img, i) => ({ ...img, product_id: product.id, display_order: i })))
      if (imgErr) throw imgErr
    }

    // Insert variants
    const { error: varErr } = await supabase
      .from('product_variants')
      .insert(variants.map((v) => ({ ...v, product_id: product.id })))
    if (varErr) throw varErr

    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/products]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
