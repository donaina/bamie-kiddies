import { z } from 'zod'

export const checkoutSchema = z
  .object({
    customerName: z.string().min(2, 'Full name is required').max(100),
    email: z.string().email('Please enter a valid email'),
    phone: z
      .string()
      .min(7, 'Phone number is too short')
      .max(20)
      .regex(/^[+\d\s\-()]+$/, 'Invalid phone number'),
    deliveryType: z.enum(['delivery', 'pickup']),
    regionId: z.string().uuid().optional(),
    deliveryAddress: z.string().max(300).optional(),
    customerNote: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === 'delivery') {
      if (!data.regionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a delivery region',
          path: ['regionId'],
        })
      }
      if (!data.deliveryAddress || data.deliveryAddress.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter your delivery address',
          path: ['deliveryAddress'],
        })
      }
    }
  })

export type CheckoutFormData = z.infer<typeof checkoutSchema>

export interface CheckoutRequestBody {
  customer: CheckoutFormData
  cartItems: Array<{
    variantId: string
    productId: string
    quantity: number
  }>
}

export interface CheckoutResponse {
  orderNumber: string
  authorizationUrl: string
}
