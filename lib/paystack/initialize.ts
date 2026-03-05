interface InitializeParams {
  email: string
  amount: number       // in kobo (NGN * 100)
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

interface InitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export async function initializePaystackTransaction(
  params: InitializeParams
): Promise<InitializeResponse> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  })

  if (!response.ok) {
    throw new Error(`Paystack initialize failed: ${response.status}`)
  }

  return response.json()
}
