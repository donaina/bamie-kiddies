import ProductCard from './ProductCard'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discount_percent?: number | null
  primaryImage: string | null
  totalStock: number
  category?: string | null
}

interface Props {
  products: Product[]
  isLoading?: boolean
}

export default function ProductGrid({ products, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">👟</p>
        <p className="text-gray-500 text-lg font-medium">No products found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
