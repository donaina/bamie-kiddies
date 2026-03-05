import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/ProductForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      product_variants(*)
    `)
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h2>
      <ProductForm product={product} />
    </div>
  )
}
