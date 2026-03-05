import { createServiceClient } from '@/lib/supabase/server'
import DeliveryRegionManager from '@/components/admin/DeliveryRegionManager'

export const metadata = { title: 'Delivery Regions' }

export default async function DeliverySettingsPage() {
  const supabase = createServiceClient()
  const { data: regions } = await supabase
    .from('delivery_regions').select('*').order('name')

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Delivery Regions</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add regions and set delivery fees. Customers select a region at checkout and the fee is added to their total.
        </p>
      </div>
      <DeliveryRegionManager regions={regions ?? []} />
    </div>
  )
}
