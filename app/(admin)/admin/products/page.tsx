// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import ProductsSearch from '@/components/admin/ProductsSearch'

export default async function AdminProductsPage() {
  const supabase = createServiceClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, slug, price, category, is_active, is_featured, created_at,
      product_images(cloudinary_url, is_primary),
      product_variants(quantity)
    `)
    .order('created_at', { ascending: false })

  const productsWithStock = (products ?? []).map((p) => {
    const images = p.product_images as { cloudinary_url: string; is_primary: boolean }[]
    const primaryImage = images?.find((img) => img.is_primary)?.cloudinary_url ?? images?.[0]?.cloudinary_url ?? null
    const totalStock = (p.product_variants as { quantity: number }[])?.reduce((sum, v) => sum + v.quantity, 0) ?? 0
    return { ...p, primaryImage, totalStock }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <Button asChild style={{ backgroundColor: '#e45826' }} className="text-white">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Link>
        </Button>
      </div>

      <ProductsSearch products={productsWithStock} />
    </div>
  )
}
