import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'New Product' }

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
      <ProductForm />
    </div>
  )
}
