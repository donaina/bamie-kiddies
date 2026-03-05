'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingBag, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SizeSelector from './SizeSelector'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'

interface Props {
  product: {
    id: string; name: string; description: string | null; price: number
    slug: string; category: string | null; gender: string | null; age_group: string | null
  }
  images: Array<{ id: string; cloudinary_url: string; is_primary: boolean; alt_text: string | null }>
  variants: Array<{ id: string; size: string; quantity: number }>
}

export default function ProductDetailClient({ product, images, variants }: Props) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)

  const [selectedImg,       setSelectedImg]       = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.find((v) => v.quantity > 0)?.id ?? null
  )
  const [qty, setQty] = useState(1)

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
  const primaryImage    = images.find((i) => i.is_primary) ?? images[0]

  function handleAddToCart() {
    if (!selectedVariant) { toast.error('Please select a size'); return }
    if (selectedVariant.quantity === 0) { toast.error('This size is sold out'); return }
    if (qty > selectedVariant.quantity) { toast.error(`Only ${selectedVariant.quantity} in stock`); return }

    addItem({
      id:          selectedVariant.id,
      productId:   product.id,
      productName: product.name,
      slug:        product.slug,
      size:        selectedVariant.size,
      price:       product.price,
      imageUrl:    primaryImage?.cloudinary_url ?? null,
      quantity:    qty,
      maxQuantity: selectedVariant.quantity,
    })
    toast.success(`${product.name} (${selectedVariant.size}) added to cart!`, {
      action: { label: 'View Cart', onClick: () => router.push('/cart') },
    })
  }

  const allSoldOut = variants.every((v) => v.quantity === 0)

  return (
    <div>
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
            {images[selectedImg] ? (
              <Image
                src={images[selectedImg].cloudinary_url}
                alt={images[selectedImg].alt_text ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-8xl">👟</div>
            )}
            {allSoldOut && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded-full">Sold Out</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImg(i)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    i === selectedImg ? 'border-orange-500' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image src={img.cloudinary_url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#e45826' }}>
                {product.category}
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
            <p className="text-3xl font-bold mt-2" style={{ color: '#e45826' }}>
              {formatCurrency(product.price)}
            </p>
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {product.gender && (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium capitalize">
                {product.gender}
              </span>
            )}
            {product.age_group && (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                {product.age_group}
              </span>
            )}
          </div>

          {/* Size selector */}
          <SizeSelector
            variants={variants}
            selectedVariantId={selectedVariantId}
            onChange={setSelectedVariantId}
          />

          {/* Quantity */}
          {selectedVariant && selectedVariant.quantity > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-orange-400"
                >−</button>
                <span className="w-8 text-center font-semibold text-lg">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(selectedVariant.quantity, q + 1))}
                  className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-orange-400"
                >+</button>
                <span className="text-xs text-gray-400 ml-1">({selectedVariant.quantity} available)</span>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={allSoldOut || !selectedVariant}
            className="w-full text-white font-semibold text-base py-3 rounded-xl"
            style={{ backgroundColor: allSoldOut ? undefined : '#e45826' }}
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            {allSoldOut ? 'Sold Out' : 'Add to Cart'}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Secure checkout powered by Paystack 🔒
          </p>
        </div>
      </div>
    </div>
  )
}
