// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/storefront/ProductGrid'
import FilterBar from '@/components/storefront/FilterBar'

interface SearchParams {
  category?: string
  gender?: string
  search?: string
}

export const metadata = { title: 'Shop' }

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { category, gender, search } = await searchParams
  const supabase = createServiceClient()

  let query = supabase
    .from('products')
    .select(`
      id, name, slug, price, discount_percent, category, gender,
      product_images(cloudinary_url, is_primary),
      product_variants(quantity)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (category && category !== 'all') query = query.eq('category', category)
  if (gender   && gender   !== 'all') query = query.eq('gender', gender)
  if (search)                         query = query.ilike('name', `%${search}%`)

  const { data: raw } = await query

  const products = (raw ?? []).map((p) => {
    const imgs = p.product_images as { cloudinary_url: string; is_primary: boolean }[]
    const primaryImage = imgs?.find((i) => i.is_primary)?.cloudinary_url ?? imgs?.[0]?.cloudinary_url ?? null
    const totalStock = (p.product_variants as { quantity: number }[])?.reduce((s, v) => s + v.quantity, 0) ?? 0
    return { ...p, primaryImage, totalStock }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
        <p className="text-gray-500 mt-1">{products.length} products</p>
      </div>
      <Suspense>
        <FilterBar />
      </Suspense>
      <ProductGrid products={products} />
    </div>
  )
}
