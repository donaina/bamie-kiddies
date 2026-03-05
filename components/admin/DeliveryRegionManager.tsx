'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import type { DeliveryRegion } from '@/types/order'

const emptyForm = { name: '', state: '', delivery_fee: 0, estimated_days: '', is_active: true }

export default function DeliveryRegionManager({ regions }: { regions: DeliveryRegion[] }) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState<DeliveryRegion | null>(null)
  const [form,    setForm]    = useState(emptyForm)
  const [saving,  setSaving]  = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(region: DeliveryRegion) {
    setEditing(region)
    setForm({
      name:           region.name,
      state:          region.state ?? '',
      delivery_fee:   region.delivery_fee,
      estimated_days: region.estimated_days ?? '',
      is_active:      region.is_active,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) { toast.error('Region name is required'); return }
    setSaving(true)
    try {
      const url    = editing ? `/api/admin/delivery-regions/${editing.id}` : '/api/admin/delivery-regions'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, delivery_fee: Number(form.delivery_fee) }),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Region updated' : 'Region added')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Failed to save region')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/delivery-regions/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Region deleted'); router.refresh() }
    else toast.error('Failed to delete region')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">{regions.length} regions</span>
          <Button onClick={openCreate} className="text-white" style={{ backgroundColor: '#e45826' }}>
            <Plus className="h-4 w-4 mr-1" /> Add Region
          </Button>
        </div>

        <div className="divide-y divide-gray-100">
          {regions.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-4 py-4">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{r.name}</p>
                  {!r.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </div>
                {r.state && <p className="text-xs text-gray-400">{r.state}</p>}
                {r.estimated_days && <p className="text-xs text-gray-400">{r.estimated_days}</p>}
              </div>
              <span className="font-semibold text-gray-800">{formatCurrency(r.delivery_fee)}</span>
              <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-blue-600 transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(r.id, r.name)} className="text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {regions.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-sm">No delivery regions yet. Add one above.</p>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Region' : 'Add Delivery Region'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Region Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Lagos Island" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="e.g. Lagos" />
              </div>
              <div className="space-y-1">
                <Label>Delivery Fee (₦) *</Label>
                <Input type="number" min="0" step="100" value={form.delivery_fee}
                  onChange={(e) => setForm((f) => ({ ...f, delivery_fee: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Estimated Delivery Time</Label>
              <Input value={form.estimated_days} onChange={(e) => setForm((f) => ({ ...f, estimated_days: e.target.value }))} placeholder="e.g. 1-2 business days" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label htmlFor="active">Active (visible to customers)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="text-white" style={{ backgroundColor: '#e45826' }}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Add Region'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
