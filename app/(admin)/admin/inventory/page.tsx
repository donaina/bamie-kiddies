// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { createServiceClient } from '@/lib/supabase/server'
import InventoryTable from '@/components/admin/InventoryTable'

export const metadata = { title: 'Inventory' }

export default async function InventoryPage() {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('product_variants')
    .select(`
      id, size, quantity, sku, is_active,
      products(id, name, is_active)
    `)
    .order('quantity', { ascending: true })

  const variants = (data ?? []).map((v) => ({
    id:          v.id,
    size:        v.size,
    quantity:    v.quantity,
    sku:         v.sku,
    is_active:   v.is_active,
    productId:   (v.products as { id: string; name: string; is_active: boolean } | null)?.id ?? '',
    productName: (v.products as { id: string; name: string; is_active: boolean } | null)?.name ?? 'Unknown',
    productActive: (v.products as { id: string; name: string; is_active: boolean } | null)?.is_active ?? false,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
        <p className="text-sm text-gray-500 mt-1">Manage stock levels for all sizes across all products.</p>
      </div>
      <InventoryTable variants={variants} />
    </div>
  )
}
