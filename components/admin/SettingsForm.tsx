'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [form, setForm] = useState({
    store_name:     settings.store_name ?? 'Bamie Kiddies',
    pickup_address: settings.pickup_address ?? '',
    support_email:  settings.support_email ?? '',
    support_phone:  settings.support_phone ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, label: string, placeholder?: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {field('store_name',     'Store Name',      'Bamie Kiddies')}
      {field('support_email',  'Support Email',   'support@bamiekiddies.com')}
      {field('support_phone',  'Support Phone',   '+234 000 000 0000')}
      {field('pickup_address', 'Pickup Address',  'Full address for in-store pickup')}
      <Button onClick={save} disabled={saving} className="text-white" style={{ backgroundColor: '#e45826' }}>
        {saving ? 'Saving…' : 'Save Settings'}
      </Button>
    </div>
  )
}
