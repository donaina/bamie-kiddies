// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import type { Metadata } from 'next'
import ProductDetailClient from '@/components/storefront/ProductDetailClient'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data } = await supabase.from('products').select('name, description').eq('slug', slug).single()
  if (!data) return {}
  return { title: data.name, description: data.description ?? undefined }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase  = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name, slug, description, price, discount_percent, category, gender, age_group,
      product_images(id, cloudinary_url, is_primary, display_order, alt_text),
      product_variants(id, size, quantity, is_active)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const images = (product.product_images as Array<{
    id: string; cloudinary_url: string; is_primary: boolean; display_order: number; alt_text: string | null
  }>).sort((a, b) => a.display_order - b.display_order)

  const variants = (product.product_variants as Array<{
    id: string; size: string; quantity: number; is_active: boolean
  }>).filter((v) => v.is_active)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProductDetailClient
        product={{
          id:               product.id,
          name:             product.name,
          description:      product.description,
          price:            product.price,
          discount_percent: product.discount_percent ?? null,
          slug:             product.slug,
          category:         product.category,
          gender:           product.gender,
          age_group:        product.age_group,
        }}
        images={images}
        variants={variants}
      />
    </div>
  )
}
