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
  name:        z.string().min(2).optional(),
  slug:        z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  price:            z.number().min(0).optional(),
  cost_price:       z.number().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  category:    z.string().optional(),
  gender:      z.enum(['boys','girls','unisex']).optional(),
  age_group:   z.string().optional(),
  is_active:   z.boolean().optional(),
  is_featured: z.boolean().optional(),
  images: z.array(z.object({
    id:             z.string().uuid().optional().nullable(),
    cloudinary_url: z.string().url(),
    cloudinary_id:  z.string(),
    is_primary:     z.boolean(),
    display_order:  z.number(),
    alt_text:       z.string().optional().nullable(),
  })).optional(),
  variants: z.array(z.object({
    id:       z.string().uuid().optional().nullable(),
    size:     z.string().min(1),
    quantity: z.number().min(0),
    sku:      z.string().optional().nullable(),
  })).optional(),
})

// GET /api/admin/products/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_variants(*)')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/admin/products/[id]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PUT /api/admin/products/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const { images, variants, ...productData } = parsed.data
    const supabase = createServiceClient()

    // Update product fields
    if (Object.keys(productData).length > 0) {
      const { error } = await supabase.from('products').update(productData).eq('id', id)
      if (error) throw error
    }

    // Replace images if provided
    if (images !== undefined) {
      await supabase.from('product_images').delete().eq('product_id', id)
      if (images.length > 0) {
        await supabase.from('product_images').insert(
          images.map((img, i) => ({ ...img, product_id: id, display_order: i }))
        )
      }
    }

    // Upsert variants if provided
    if (variants !== undefined) {
      // Delete variants not in the new list
      const keepIds = variants.filter((v) => v.id).map((v) => v.id!)
      if (keepIds.length > 0) {
        await supabase.from('product_variants')
          .delete().eq('product_id', id).not('id', 'in', `(${keepIds.join(',')})`)
      } else {
        await supabase.from('product_variants').delete().eq('product_id', id)
      }

      for (const v of variants) {
        if (v.id) {
          await supabase.from('product_variants').update({ size: v.size, quantity: v.quantity, sku: v.sku }).eq('id', v.id)
        } else {
          await supabase.from('product_variants').insert({ ...v, product_id: id })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/admin/products/[id]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id]  — soft delete
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const supabase = createServiceClient()
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/products/[id]]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
