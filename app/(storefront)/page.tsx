// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/storefront/ProductGrid'
import { ShoppingBag, Truck, Star, Shield } from 'lucide-react'

const CATEGORIES = [
  { label: 'Sneakers',      emoji: '👟', value: 'sneakers' },
  { label: 'Sandals',       emoji: '🩴', value: 'sandals' },
  { label: 'School Shoes',  emoji: '🎒', value: 'school shoes' },
  { label: 'Boots',         emoji: '🥾', value: 'boots' },
  { label: 'Slippers',      emoji: '🩷', value: 'slippers' },
  { label: 'Sports',        emoji: '⚽', value: 'sports shoes' },
]

export default async function HomePage() {
  const supabase = createServiceClient()
  const { data: featuredRaw } = await supabase
    .from('products')
    .select(`
      id, name, slug, price, category,
      product_images(cloudinary_url, is_primary),
      product_variants(quantity)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(8)

  const featured = (featuredRaw ?? []).map((p) => {
    const imgs = p.product_images as { cloudinary_url: string; is_primary: boolean }[]
    const primaryImage = imgs?.find((i) => i.is_primary)?.cloudinary_url ?? imgs?.[0]?.cloudinary_url ?? null
    const totalStock = (p.product_variants as { quantity: number }[])?.reduce((s, v) => s + v.quantity, 0) ?? 0
    return { ...p, primaryImage, totalStock }
  })

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff7f4 0%, #ffeedd 50%, #ffe0cc 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6"
              style={{ backgroundColor: '#fde8dc', color: '#e45826' }}>
              <Star className="h-3.5 w-3.5" />
              Premium Quality Footwear
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Every Step
              <br />
              <span style={{ color: '#e45826' }}>Starts Here</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Discover our collection of premium kids&apos; footwear — crafted for comfort, built for adventure, designed to be loved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#e45826' }}
              >
                <ShoppingBag className="h-4 w-4" /> Shop Now
              </Link>
              <Link
                href="/shop?category=school shoes"
                className="inline-flex items-center px-6 py-3 rounded-full font-semibold text-sm border-2 border-gray-300 text-gray-700 hover:border-orange-400 transition-colors"
              >
                School Shoes →
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: '#e45826' }} />
        <div className="absolute right-32 bottom-0 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: '#e45826' }} />
      </section>

      {/* ── Trust badges ────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Truck,      label: 'Fast Delivery',       sub: 'Nationwide shipping' },
            { icon: Shield,     label: 'Secure Payments',      sub: 'Powered by Paystack' },
            { icon: Star,       label: 'Quality Guaranteed',   sub: 'Premium materials' },
            { icon: ShoppingBag,label: 'Easy Returns',         sub: 'Hassle-free policy' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#fde8dc' }}>
                <Icon className="h-5 w-5" style={{ color: '#e45826' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(({ label, emoji, value }) => (
            <Link
              key={value}
              href={`/shop?category=${encodeURIComponent(value)}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-300 hover:bg-orange-50 transition-all group"
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured products ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Collection</h2>
          <Link href="/shop" className="text-sm font-medium hover:underline" style={{ color: '#e45826' }}>
            View all →
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
    </div>
  )
}
