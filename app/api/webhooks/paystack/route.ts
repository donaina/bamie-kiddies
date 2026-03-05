// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPaystackWebhook } from '@/lib/paystack/webhook'
import { verifyPaystackTransaction } from '@/lib/paystack/verify'
import { sendOrderConfirmation } from '@/lib/resend/sendOrderConfirmation'
import { sendAdminOrderNotification } from '@/lib/resend/sendAdminNotification'
import { notifyAdmin } from '@/lib/onesignal/notify'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import type { OrderWithItems } from '@/types/order'

export async function POST(request: Request) {
  const rawBody  = await request.text()
  const signature = request.headers.get('x-paystack-signature') ?? ''

  // ── 1. Verify HMAC signature ─────────────────────────────
  if (!verifyPaystackWebhook(rawBody, signature)) {
    console.warn('[Webhook] Invalid Paystack signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; data: { reference: string; amount: number; status: string; id: number } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase   = createServiceClient()
  const reference  = event.data?.reference

  // ── 2. Idempotency check ─────────────────────────────────
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id, processed')
    .eq('paystack_ref', reference)
    .eq('event_type', event.event)
    .single()

  if (existing?.processed) {
    // Already fully processed — acknowledge and exit
    return NextResponse.json({ received: true })
  }

  // ── 3. Log webhook event ─────────────────────────────────
  if (!existing) {
    await supabase.from('webhook_events').insert({
      event_type:   event.event,
      paystack_ref: reference,
      payload:      JSON.parse(rawBody),
      processed:    false,
    })
  }

  // ── 4. Handle charge.success ─────────────────────────────
  if (event.event === 'charge.success') {
    try {
      // Double-verify with Paystack API
      const verification = await verifyPaystackTransaction(reference)
      if (verification.data.status !== 'success') {
        console.warn('[Webhook] Transaction not successful:', reference)
        return NextResponse.json({ received: true })
      }

      // Fetch order
      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*), delivery_regions(name, state, estimated_days)')
        .eq('paystack_reference', reference)
        .single()

      if (!order) {
        console.error('[Webhook] Order not found for reference:', reference)
        return NextResponse.json({ received: true })
      }

      // Guard: only process pending orders
      if (order.payment_status === 'paid') {
        await markProcessed(supabase, reference, event.event)
        return NextResponse.json({ received: true })
      }

      // Verify amount (kobo → NGN)
      const expectedKobo = Math.round(order.total_amount * 100)
      if (verification.data.amount !== expectedKobo) {
        console.error('[Webhook] Amount mismatch! Expected:', expectedKobo, 'Got:', verification.data.amount)
        // Flag for manual review — don't fulfill
        await supabase.from('orders').update({ admin_note: 'AMOUNT MISMATCH — manual review required' })
          .eq('id', order.id)
        return NextResponse.json({ received: true })
      }

      // ── 5. Update order status ────────────────────────────
      await supabase.from('orders').update({
        payment_status:  'paid',
        status:          'confirmed',
        paystack_txn_id: String(verification.data.id),
        paid_at:         verification.data.paid_at,
      }).eq('id', order.id)

      // ── 6. Decrement inventory ────────────────────────────
      const items = order.order_items as Array<{ variant_id: string; quantity: number }>
      for (const item of items) {
        await supabase.rpc('decrement_inventory', {
          p_variant_id: item.variant_id,
          p_quantity:   item.quantity,
        })
      }

      // ── 7. Build enriched order for notifications ─────────
      const enrichedOrder: OrderWithItems = {
        ...order,
        order_items:      order.order_items,
        delivery_regions: order.delivery_regions as OrderWithItems['delivery_regions'],
      }

      // ── 8. Send customer email ───────────────────────────
      await sendOrderConfirmation(enrichedOrder)

      // ── 9. Send admin email ───────────────────────────────
      await sendAdminOrderNotification(enrichedOrder)

      // ── 10. Push notification to admin ────────────────────
      await notifyAdmin({
        title: '🛍️ New Order!',
        body:  `Order ${order.order_number} — ${formatCurrency(order.total_amount)}`,
        url:   `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`,
      })

      // ── 11. Mark webhook processed ────────────────────────
      await markProcessed(supabase, reference, event.event)

    } catch (err) {
      console.error('[Webhook] Processing error:', err)
      // Don't return 500 — acknowledge Paystack so it doesn't keep retrying
      // The idempotency check will handle re-delivery
    }
  }

  return NextResponse.json({ received: true })
}

async function markProcessed(
  supabase: ReturnType<typeof createServiceClient>,
  reference: string,
  eventType: string
) {
  await supabase.from('webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('paystack_ref', reference)
    .eq('event_type', eventType)
}
