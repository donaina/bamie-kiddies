// @ts-nocheck — remove after running: supabase gen types typescript > types/database.ts
import { createServiceClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/admin/SettingsForm'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('site_settings').select('*')
  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
      <SettingsForm settings={settings} />
    </div>
  )
}
