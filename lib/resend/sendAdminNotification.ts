import { getResend } from './client'
import type { OrderWithItems } from '@/types/order'
import { formatCurrency } from '@/lib/utils/formatCurrency'

export async function sendAdminOrderNotification(order: OrderWithItems) {
  const resend = getResend()
  const adminEmail = process.env.RESEND_ADMIN_EMAIL
  if (!adminEmail) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    await resend.emails.send({
      from: `Bamie Kiddies <${process.env.RESEND_FROM_EMAIL}>`,
      to: adminEmail,
      subject: `🛍️ New Order ${order.order_number} — ${formatCurrency(order.total_amount)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2>New Order Received!</h2>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
          <p><strong>Phone:</strong> ${order.customer_phone}</p>
          <p><strong>Total:</strong> ${formatCurrency(order.total_amount)}</p>
          <p><strong>Delivery:</strong> ${order.delivery_type === 'pickup' ? 'Pickup' : `Delivery — ${order.delivery_regions?.name || 'N/A'}`}</p>
          <p style="margin-top: 24px;">
            <a href="${siteUrl}/admin/orders/${order.id}"
               style="background: #e45826; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              View Order in Dashboard
            </a>
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Resend] Failed to send admin notification:', error)
  }
}
