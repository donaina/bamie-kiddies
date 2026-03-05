'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Image from 'next/image'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { generateSlug } from '@/lib/utils/generateSlug'

// ── Types ────────────────────────────────────────────────────
interface ProductImage {
  id?: string
  cloudinary_url: string
  cloudinary_id: string
  is_primary: boolean
  display_order: number
  alt_text?: string
}

interface ProductVariant {
  id?: string
  size: string
  quantity: number
  sku?: string
}

interface ProductData {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  cost_price: number | null
  category: string | null
  gender: string | null
  age_group: string | null
  is_active: boolean
  is_featured: boolean
  product_images: ProductImage[]
  product_variants: ProductVariant[]
}

// ── Validation schema ────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(2, 'Name is required'),
  slug:        z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  description: z.string().optional(),
  price:       z.number().min(1, 'Price must be at least ₦1'),
  cost_price:  z.number().min(0).optional(),
  category:    z.string().optional(),
  gender:      z.string().optional(),
  age_group:   z.string().optional(),
  is_active:   z.boolean(),
  is_featured: z.boolean(),
})
type FormData = z.infer<typeof schema>

// ── Component ────────────────────────────────────────────────
export default function ProductForm({ product }: { product?: ProductData }) {
  const router = useRouter()
  const isEditing = !!product

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        product?.name ?? '',
      slug:        product?.slug ?? '',
      description: product?.description ?? '',
      price:       product?.price ?? 0,
      cost_price:  product?.cost_price ?? undefined,
      category:    product?.category ?? '',
      gender:      product?.gender ?? '',
      age_group:   product?.age_group ?? '',
      is_active:   product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
    },
  })

  const [images, setImages] = useState<ProductImage[]>(product?.product_images ?? [])
  const [variants, setVariants] = useState<ProductVariant[]>(product?.product_variants ?? [])
  const [newSize, setNewSize] = useState('')
  const [newQty, setNewQty] = useState(0)
  const [uploading, setUploading] = useState(false)

  // ── Auto-generate slug from name ────────────────────────────
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValue('name', name)
    if (!isEditing) {
      setValue('slug', generateSlug(name))
    }
  }, [setValue, isEditing])

  // ── Image upload ─────────────────────────────────────────────
  async function handleImageUpload(files: FileList) {
    setUploading(true)
    try {
      // Get signed upload params from server
      const paramsRes = await fetch('/api/admin/upload', { method: 'POST' })
      if (!paramsRes.ok) throw new Error('Failed to get upload params')
      const { timestamp, signature, cloudName, apiKey, folder } = await paramsRes.json()

      const uploaded: ProductImage[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); continue }

        const fd = new FormData()
        fd.append('file', file)
        fd.append('timestamp', String(timestamp))
        fd.append('signature', signature)
        fd.append('api_key', apiKey)
        fd.append('folder', folder)

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: fd,
        })
        if (!res.ok) throw new Error('Cloudinary upload failed')
        const data = await res.json()
        uploaded.push({
          cloudinary_url: data.secure_url,
          cloudinary_id:  data.public_id,
          is_primary:     images.length === 0 && uploaded.length === 0,
          display_order:  images.length + uploaded.length,
        })
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      toast.error('Image upload failed')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  async function removeImage(idx: number) {
    const img = images[idx]
    if (img.id && img.cloudinary_id) {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudinary_id: img.cloudinary_id }),
      })
    }
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (img.is_primary && next.length > 0) next[0].is_primary = true
      return next
    })
  }

  function setPrimary(idx: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_primary: i === idx })))
  }

  // ── Variants ─────────────────────────────────────────────────
  function addVariant() {
    if (!newSize.trim()) { toast.error('Enter a size'); return }
    if (variants.find((v) => v.size === newSize.trim())) { toast.error('Size already added'); return }
    setVariants((prev) => [...prev, { size: newSize.trim(), quantity: newQty }])
    setNewSize('')
    setNewQty(0)
  }

  function removeVariant(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateVariantQty(idx: number, qty: number) {
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, quantity: Math.max(0, qty) } : v))
  }

  // ── Submit ───────────────────────────────────────────────────
  async function onSubmit(data: FormData) {
    if (images.length === 0) { toast.error('Add at least one product image'); return }
    if (variants.length === 0) { toast.error('Add at least one size/variant'); return }

    const payload = { ...data, images, variants }
    const url    = isEditing ? `/api/admin/products/${product.id}` : '/api/admin/products'
    const method = isEditing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      toast.error(isEditing ? 'Failed to update product' : 'Failed to create product')
      return
    }

    toast.success(isEditing ? 'Product updated!' : 'Product created!')
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-800">Basic Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register('name')} onChange={handleNameChange} placeholder="e.g. Kids Air Runner Sneaker" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input id="slug" {...register('slug')} placeholder="kids-air-runner-sneaker" />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} rows={3} placeholder="Describe the product…" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="price">Selling Price (₦) *</Label>
            <Input id="price" type="number" min="0" step="50" {...register('price', { valueAsNumber: true })} />
            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="cost_price">Cost Price (₦)</Label>
            <Input id="cost_price" type="number" min="0" step="50" {...register('cost_price', { valueAsNumber: true })} placeholder="For profit tracking" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Category</Label>
            <Select defaultValue={product?.category ?? ''} onValueChange={(v) => setValue('category', v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {['sneakers','sandals','boots','slippers','school shoes','sports shoes','other'].map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <Select defaultValue={product?.gender ?? ''} onValueChange={(v) => setValue('gender', v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Age Group</Label>
            <Select defaultValue={product?.age_group ?? ''} onValueChange={(v) => setValue('age_group', v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {['0-2 years','3-5 years','6-9 years','10-14 years'].map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch id="is_active" checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} />
            <Label htmlFor="is_active">Active (visible in store)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="is_featured" checked={watch('is_featured')} onCheckedChange={(v) => setValue('is_featured', v)} />
            <Label htmlFor="is_featured">Featured on homepage</Label>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Product Images</h3>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-orange-400 transition-colors">
          <Upload className="h-6 w-6 text-gray-400" />
          <span className="text-sm text-gray-500">{uploading ? 'Uploading…' : 'Click or drag images here (max 5MB each)'}</span>
          <input type="file" className="hidden" accept="image/*" multiple disabled={uploading}
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)} />
        </label>
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className={`relative rounded-lg overflow-hidden border-2 ${img.is_primary ? 'border-orange-400' : 'border-gray-200'}`}>
                <div className="aspect-square relative">
                  <Image src={img.cloudinary_url} alt="" fill className="object-cover" sizes="120px" />
                </div>
                <div className="absolute top-1 right-1 flex gap-1">
                  <button type="button" onClick={() => removeImage(idx)} className="bg-red-500 text-white rounded p-0.5 hover:bg-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {!img.is_primary && (
                  <button type="button" onClick={() => setPrimary(idx)}
                    className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center hover:bg-black/70">
                    Set primary
                  </button>
                )}
                {img.is_primary && (
                  <div className="absolute bottom-0 left-0 right-0 text-xs py-1 text-center font-medium" style={{ backgroundColor: '#e45826', color: 'white' }}>
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Sizes & Stock</h3>
        <div className="flex gap-2 items-end">
          <div className="space-y-1 flex-1">
            <Label>Size</Label>
            <Input value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="e.g. EU 28, UK 3" />
          </div>
          <div className="space-y-1 w-24">
            <Label>Qty</Label>
            <Input type="number" min="0" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} />
          </div>
          <Button type="button" variant="outline" onClick={addVariant}><Plus className="h-4 w-4" /></Button>
        </div>
        {variants.length > 0 && (
          <div className="space-y-2">
            {variants.map((v, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <span className="flex-1 font-medium text-sm text-gray-800">{v.size}</span>
                <Input
                  type="number" min="0"
                  value={v.quantity}
                  onChange={(e) => updateVariantQty(idx, Number(e.target.value))}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-gray-400">units</span>
                {v.quantity === 0 && <span className="text-xs text-red-500 font-medium">Sold Out</span>}
                <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="text-white" style={{ backgroundColor: '#e45826' }}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
