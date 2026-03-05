import type { Database } from './database'

export type Product = Database['public']['Tables']['products']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']

export type ProductWithDetails = Product & {
  product_images: ProductImage[]
  product_variants: ProductVariant[]
}

export type ProductWithPrimary = Product & {
  primary_image: string | null
  min_price: number
  total_stock: number
}
