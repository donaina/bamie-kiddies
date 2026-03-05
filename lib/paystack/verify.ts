interface VerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number    // in kobo
    paid_at: string
    channel: string
    currency: string
    customer: {
      email: string
      customer_code: string
    }
    metadata: Record<string, unknown>
  }
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<VerifyResponse> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Paystack verify failed: ${response.status}`)
  }

  return response.json()
}
