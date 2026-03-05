'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

const CATEGORIES = ['all','sneakers','sandals','boots','slippers','school shoes','sports shoes']
const GENDERS    = ['all','boys','girls','unisex']

export default function FilterBar() {
  const router     = useRouter()
  const params     = useSearchParams()
  const [, startTransition] = useTransition()

  const push = useCallback((updates: Record<string, string>) => {
    const p = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v && v !== 'all') p.set(k, v)
      else p.delete(k)
    }
    startTransition(() => router.push(`/shop?${p.toString()}`, { scroll: false }))
  }, [params, router])

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search shoes…"
          defaultValue={params.get('search') ?? ''}
          className="pl-9"
          onChange={(e) => push({ search: e.target.value })}
        />
      </div>

      {/* Category */}
      <Select defaultValue={params.get('category') ?? 'all'} onValueChange={(v) => push({ category: v })}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} className="capitalize">
              {c === 'all' ? 'All Categories' : c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Gender */}
      <Select defaultValue={params.get('gender') ?? 'all'} onValueChange={(v) => push({ gender: v })}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          {GENDERS.map((g) => (
            <SelectItem key={g} value={g} className="capitalize">
              {g === 'all' ? 'All' : g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
