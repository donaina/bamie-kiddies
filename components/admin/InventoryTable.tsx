'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, AlertTriangle } from 'lucide-react'

interface VariantRow {
  id: string
  size: string
  quantity: number
  sku: string | null
  is_active: boolean
  productId: string
  productName: string
  productActive: boolean
}

export default function InventoryTable({ variants }: { variants: VariantRow[] }) {
  const [rows, setRows]     = useState<VariantRow[]>(variants)
  const [query, setQuery]   = useState('')
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const filtered = rows.filter((r) =>
    r.productName.toLowerCase().includes(query.toLowerCase()) ||
    r.size.toLowerCase().includes(query.toLowerCase())
  )

  const updateQty = useCallback(async (id: string, qty: number) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, quantity: qty } : r))
    setSaving((s) => new Set(s).add(id))
    try {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ quantity: qty }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Stock updated')
    } catch {
      toast.error('Failed to update stock')
    } finally {
      setSaving((s) => { const n = new Set(s); n.delete(id); return n })
    }
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search product or size…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} variants</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Size</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row) => (
              <tr key={row.id} className={row.quantity === 0 ? 'bg-red-50' : row.quantity <= 5 ? 'bg-yellow-50' : ''}>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${row.productId}`} className="font-medium text-gray-900 hover:underline">
                    {row.productName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.size}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{row.sku ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min="0"
                      value={row.quantity}
                      onChange={(e) => updateQty(row.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 h-8 text-sm"
                      disabled={saving.has(row.id)}
                    />
                    {row.quantity <= 5 && row.quantity > 0 && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {row.quantity === 0
                    ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Sold Out</Badge>
                    : row.quantity <= 5
                    ? <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Low Stock</Badge>
                    : <Badge className="bg-green-100 text-green-700 hover:bg-green-100">In Stock</Badge>
                  }
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No variants found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
