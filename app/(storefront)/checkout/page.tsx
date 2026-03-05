'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { checkoutSchema, type CheckoutFormData } from '@/types/checkout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Lock, Truck, Store } from 'lucide-react'
import type { DeliveryRegion } from '@/types/order'

export default function CheckoutPage() {
  const router  = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const [regions,       setRegions]       = useState<DeliveryRegion[]>([])
  const [deliveryFee,   setDeliveryFee]   = useState(0)
  const [submitting,    setSubmitting]    = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryType: 'delivery' },
  })

  const deliveryType = watch('deliveryType')
  const regionId     = watch('regionId')

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) router.replace('/cart')
  }, [items.length, router])

  // Fetch delivery regions
  useEffect(() => {
    fetch('/api/delivery-regions')
      .then((r) => r.json())
      .then(setRegions)
      .catch(() => toast.error('Could not load delivery regions'))
  }, [])

  // Update delivery fee when region changes
  useEffect(() => {
    if (deliveryType === 'pickup') { setDeliveryFee(0); return }
    const region = regions.find((r) => r.id === regionId)
    setDeliveryFee(region?.delivery_fee ?? 0)
  }, [regionId, regions, deliveryType])

  const total = subtotal() + deliveryFee

  async function onSubmit(data: CheckoutFormData) {
    if (items.length === 0) { router.replace('/cart'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: data,
          cartItems: items.map((i) => ({
            variantId: i.id,
            productId: i.productId,
            quantity:  i.quantity,
          })),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Checkout failed')
        return
      }

      clearCart()
      // Redirect to Paystack
      window.location.href = json.authorizationUrl
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input id="customerName" {...register('customerName')} placeholder="Jane Doe" />
                  {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" {...register('phone')} placeholder="+234 800 000 0000" />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" {...register('email')} placeholder="jane@example.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            {/* Delivery type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Delivery Method</h2>
              <RadioGroup
                defaultValue="delivery"
                onValueChange={(v) => setValue('deliveryType', v as 'delivery' | 'pickup')}
                className="grid grid-cols-2 gap-3"
              >
                <label className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-colors ${deliveryType === 'delivery' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <RadioGroupItem value="delivery" id="delivery" />
                  <div>
                    <Truck className="h-5 w-5 mb-0.5" style={{ color: '#e45826' }} />
                    <p className="font-semibold text-sm">Delivery</p>
                    <p className="text-xs text-gray-400">Ship to your address</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-colors ${deliveryType === 'pickup' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <RadioGroupItem value="pickup" id="pickup" />
                  <div>
                    <Store className="h-5 w-5 mb-0.5" style={{ color: '#e45826' }} />
                    <p className="font-semibold text-sm">Pickup</p>
                    <p className="text-xs text-gray-400">Collect in person</p>
                  </div>
                </label>
              </RadioGroup>

              {/* Delivery fields */}
              {deliveryType === 'delivery' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label>Delivery Region *</Label>
                    <Select onValueChange={(v) => setValue('regionId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your region…" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}{r.state ? ` (${r.state})` : ''} — {formatCurrency(r.delivery_fee)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.regionId && <p className="text-xs text-red-500">{errors.regionId.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Textarea
                      id="deliveryAddress"
                      {...register('deliveryAddress')}
                      placeholder="House number, street name, nearest landmark…"
                      rows={3}
                    />
                    {errors.deliveryAddress && <p className="text-xs text-red-500">{errors.deliveryAddress.message}</p>}
                  </div>
                </div>
              )}

              {deliveryType === 'pickup' && (
                <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-700">
                  You will be contacted with pickup location details after your order is confirmed.
                </div>
              )}
            </div>

            {/* Note */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-bold text-gray-900">Order Note (optional)</h2>
              <Textarea
                {...register('customerNote')}
                placeholder="Any special instructions for your order…"
                rows={3}
              />
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 sticky top-20">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 flex-1 line-clamp-1">
                      {item.productName} <span className="text-gray-400">({item.size})</span> ×{item.quantity}
                    </span>
                    <span className="font-medium ml-3">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatCurrency(subtotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{deliveryType === 'pickup' ? 'Free (Pickup)' : deliveryFee > 0 ? formatCurrency(deliveryFee) : '—'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span style={{ color: '#e45826' }}>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-white font-semibold"
                style={{ backgroundColor: '#e45826' }}
                disabled={submitting}
              >
                <Lock className="h-4 w-4 mr-2" />
                {submitting ? 'Processing…' : `Pay ${formatCurrency(total)}`}
              </Button>

              <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Secured by Paystack
              </p>

              <Link href="/cart" className="block text-center text-xs text-gray-400 hover:text-gray-600">
                ← Back to cart
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
