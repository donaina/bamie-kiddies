'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'] as const

export default function OrderStatusUpdater({
  orderId, currentStatus, currentNote,
}: {
  orderId: string
  currentStatus: string
  currentNote: string
}) {
  const router  = useRouter()
  const [status, setStatus]   = useState(currentStatus)
  const [note, setNote]       = useState(currentNote)
  const [saving, setSaving]   = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status, admin_note: note }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Order updated')
      router.refresh()
    } catch {
      toast.error('Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">Update Order</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Order Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Admin Note (internal)</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Internal notes about this order…"
          rows={3}
        />
      </div>
      <Button onClick={save} disabled={saving} className="text-white" style={{ backgroundColor: '#e45826' }}>
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  )
}
