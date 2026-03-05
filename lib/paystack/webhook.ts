import crypto from 'crypto'

export function verifyPaystackWebhook(
  rawBody: string,
  signature: string
): boolean {
  if (!process.env.PAYSTACK_WEBHOOK_SECRET) return false
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  return hash === signature
}
