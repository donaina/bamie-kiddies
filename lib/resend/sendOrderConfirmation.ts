import { getResend } from './client'
import type { OrderWithItems } from '@/types/order'
import { formatCurrency } from '@/lib/utils/formatCurrency'

export async function sendOrderConfirmation(order: OrderWithItems) {
  const resend = getResend()
  const itemsList = order.order_items
    .map(
      (item) =>
        `• ${item.product_name} (Size: ${item.size}) x${item.quantity} — ${formatCurrency(item.subtotal)}`
    )
    .join('\n')

  const deliveryInfo =
    order.delivery_type === 'pickup'
      ? 'Pickup (you will be contacted with pickup details)'
      : `Delivery to: ${order.delivery_address || 'N/A'}\nRegion: ${order.delivery_regions?.name || 'N/A'}`

  try {
    await resend.emails.send({
      from: `Bamie Kiddies <${process.env.RESEND_FROM_EMAIL}>`,
      to: order.customer_email,
      subject: `Order Confirmed! Your order ${order.order_number} is on its way 🎉`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h1 style="color: #e45826; margin-bottom: 8px;">Bamie Kiddies</h1>
          <h2 style="margin-bottom: 4px;">Order Confirmed!</h2>
          <p style="color: #555;">Hi ${order.customer_name}, thank you for shopping with us!</p>

          <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #888; text-transform: uppercase;">Order Number</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #e45826;">${order.order_number}</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Keep this number to track your order</p>
          </div>

          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 8px;">Order Summary</h3>
          <pre style="font-family: sans-serif; white-space: pre-wrap; line-height: 1.8;">${itemsList}</pre>

          <table style="width: 100%; margin-top: 16px;">
            <tr><td>Subtotal</td><td style="text-align: right;">${formatCurrency(order.subtotal)}</td></tr>
            <tr><td>Delivery</td><td style="text-align: right;">${order.delivery_fee === 0 ? 'Free (Pickup)' : formatCurrency(order.delivery_fee)}</td></tr>
            <tr style="font-weight: 700; font-size: 18px;">
              <td>Total</td><td style="text-align: right; color: #e45826;">${formatCurrency(order.total_amount)}</td>
            </tr>
          </table>

          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px;">Delivery Info</h3>
          <pre style="font-family: sans-serif; white-space: pre-wrap; line-height: 1.8;">${deliveryInfo}</pre>

          <p style="margin-top: 24px; color: #555;">
            Questions? Contact us at <a href="mailto:support@bamiekiddies.com">support@bamiekiddies.com</a>
          </p>
          <p style="font-size: 12px; color: #aaa; margin-top: 32px;">© ${new Date().getFullYear()} Bamie Kiddies. All rights reserved.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Resend] Failed to send order confirmation:', error)
    // Non-fatal — don't throw
  }
}
