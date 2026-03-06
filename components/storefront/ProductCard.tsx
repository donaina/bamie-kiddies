import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/formatCurrency'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  discount_percent?: number | null
  primaryImage: string | null
  totalStock: number
  category?: string | null
}

export default function ProductCard({ name, slug, price, discount_percent, primaryImage, totalStock, category }: ProductCardProps) {
  const soldOut = totalStock === 0
  const hasDiscount = !!discount_percent && discount_percent > 0
  const discountedPrice = hasDiscount ? price * (1 - discount_percent! / 100) : price

  return (
    <Link
      href={`/shop/${slug}`}
      className="group block rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">👟</div>
        )}

        {/* Sold Out overlay */}
        {soldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}

        {/* Category tag */}
        {category && !soldOut && (
          <div className="absolute top-2 left-2">
            <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full capitalize"
              style={{ backgroundColor: '#e45826' }}>
              {category}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && !soldOut && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount_percent}%
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors">
          {name}
        </h3>
        {hasDiscount ? (
          <div className="mt-1 flex items-center gap-1.5">
            <p className="font-bold text-gray-900">{formatCurrency(discountedPrice)}</p>
            <p className="text-xs text-gray-400 line-through">{formatCurrency(price)}</p>
          </div>
        ) : (
          <p className="mt-1 font-bold text-gray-900">{formatCurrency(price)}</p>
        )}
      </div>
    </Link>
  )
}
