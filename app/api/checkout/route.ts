// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { initializePaystackTransaction } from '@/lib/paystack/initialize'

// Simple rate limiter (upgrade to Upstash Redis in production)
const checkoutAttempts = new Map<string, { count: number; resetAt: number }>()
function isRateLimited(ip: string) {
  const now = Date.now()
  const entry = checkoutAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    checkoutAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count++
  return entry.count > 5  // max 5 checkout attempts per minute
}

const cartItemSchema = z.object({
  variantId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity:  z.number().int().min(1).max(100),
})

const customerSchema = z.object({
  customerName:    z.string().min(2).max(100),
  email:           z.string().email(),
  phone:           z.string().min(7).max(20),
  deliveryType:    z.enum(['delivery', 'pickup']),
  regionId:        z.string().uuid().optional(),
  deliveryAddress: z.string().max(300).optional(),
  customerNote:    z.string().max(500).optional(),
})

const bodySchema = z.object({
  customer:  customerSchema,
  cartItems: z.array(cartItemSchema).min(1).max(20),
})

export async function POST(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const body   = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const { customer, cartItems } = parsed.data
    const supabase = createServiceClient()

    // ── 1. Validate delivery ─────────────────────────────────
    let deliveryFee = 0
    let deliveryRegionId: string | null = null

    if (customer.deliveryType === 'delivery') {
      if (!customer.regionId) {
        return NextResponse.json({ error: 'Please select a delivery region' }, { status: 400 })
      }
      if (!customer.deliveryAddress?.trim()) {
        return NextResponse.json({ error: 'Please enter your delivery address' }, { status: 400 })
      }
      // Fetch fee from DB — never trust client-sent value
      const { data: region } = await supabase
        .from('delivery_regions')
        .select('id, delivery_fee')
        .eq('id', customer.regionId)
        .eq('is_active', true)
        .single()

      if (!region) return NextResponse.json({ error: 'Invalid delivery region' }, { status: 400 })
      deliveryFee      = region.delivery_fee
      deliveryRegionId = region.id
    }

    // ── 2. Re-validate stock & prices ────────────────────────
    const variantIds = cartItems.map((i) => i.variantId)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, quantity, products(id, name, price, cost_price, product_images(cloudinary_url, is_primary))')
      .in('id', variantIds)

    if (!variants || variants.length !== cartItems.length) {
      return NextResponse.json({ error: 'Some items are no longer available' }, { status: 400 })
    }

    // Check stock
    for (const cartItem of cartItems) {
      const variant = variants.find((v) => v.id === cartItem.variantId)
      if (!variant) return NextResponse.json({ error: 'Item not found' }, { status: 400 })
      if (variant.quantity < cartItem.quantity) {
        const product = variant.products as { name: string } | null
        return NextResponse.json({
          error: `"${product?.name ?? 'Item'}" only has ${variant.quantity} in stock for this size`,
        }, { status: 400 })
      }
    }

    // ── 3. Calculate totals server-side ─────────────────────
    let subtotal = 0
    const orderItemsData: Array<{
      variant_id: string; product_id: string; product_name: string;
      product_image_url: string | null; size: string; quantity: number;
      unit_price: number; unit_cost: number | null; subtotal: number
    }> = []

    for (const cartItem of cartItems) {
      const variant = variants.find((v) => v.id === cartItem.variantId)!
      const product = variant.products as {
        id: string; name: string; price: number; cost_price: number | null;
        product_images: Array<{ cloudinary_url: string; is_primary: boolean }>
      } | null

      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 400 })

      const images   = product.product_images ?? []
      const imgUrl   = images.find((i) => i.is_primary)?.cloudinary_url ?? images[0]?.cloudinary_url ?? null
      const lineTotal = product.price * cartItem.quantity
      subtotal += lineTotal

      // Get the actual size from DB
      const { data: variantFull } = await supabase
        .from('product_variants').select('size').eq('id', cartItem.variantId).single()

      orderItemsData.push({
        variant_id:        cartItem.variantId,
        product_id:        product.id,
        product_name:      product.name,
        product_image_url: imgUrl,
        size:              variantFull?.size ?? '',
        quantity:          cartItem.quantity,
        unit_price:        product.price,
        unit_cost:         product.cost_price,
        subtotal:          lineTotal,
      })
    }

    const totalAmount = subtotal + deliveryFee

    // ── 4. Generate order number ─────────────────────────────
    const { data: orderNumberData } = await supabase.rpc('generate_order_number')
    const orderNumber = orderNumberData as string

    // ── 5. Create order ──────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number:       orderNumber,
        customer_name:      customer.customerName,
        customer_email:     customer.email,
        customer_phone:     customer.phone,
        delivery_type:      customer.deliveryType,
        delivery_region_id: deliveryRegionId,
        delivery_address:   customer.deliveryAddress ?? null,
        delivery_fee:       deliveryFee,
        subtotal,
        total_amount:       totalAmount,
        payment_status:     'pending',
        status:             'pending',
        customer_note:      customer.customerNote ?? null,
        paystack_reference: orderNumber,   // use order number as Paystack reference
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('[/api/checkout] Order insert failed:', orderErr)
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    // ── 6. Create order items ────────────────────────────────
    await supabase.from('order_items').insert(
      orderItemsData.map((item) => ({ ...item, order_id: order.id }))
    )

    // ── 7. Initialize Paystack ───────────────────────────────
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const callbackUrl = `${siteUrl}/order-confirmation/${orderNumber}`

    const paystackRes = await initializePaystackTransaction({
      email:       customer.email,
      amount:      Math.round(totalAmount * 100),   // kobo
      reference:   orderNumber,
      callbackUrl,
      metadata: {
        order_id:     order.id,
        order_number: orderNumber,
        customer_name: customer.customerName,
      },
    })

    if (!paystackRes.status) {
      console.error('[/api/checkout] Paystack init failed:', paystackRes.message)
      return NextResponse.json({ error: 'Payment gateway error. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({
      orderNumber,
      authorizationUrl: paystackRes.data.authorization_url,
    })
  } catch (err) {
    console.error('[POST /api/checkout]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
