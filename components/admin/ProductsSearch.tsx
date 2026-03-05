'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface ProductRow {
  id: string
  name: string
  slug: string
  price: number
  category: string | null
  is_active: boolean
  created_at: string
  primaryImage: string | null
  totalStock: number
}

export default function ProductsSearch({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length > 0 ? (
              filtered.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => window.location.assign(`/admin/products/${product.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.primaryImage ? (
                          <Image src={product.primaryImage} alt={product.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <span className="flex items-center justify-center h-full text-lg">👟</span>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{product.category ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3">
                    <span className={product.totalStock === 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {product.totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.is_active ? 'default' : 'secondary'} className={product.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  {query ? 'No products match your search.' : 'No products yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
