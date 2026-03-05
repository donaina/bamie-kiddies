export interface CartItem {
  id: string           // variant id
  productId: string
  productName: string
  slug: string
  size: string
  price: number
  imageUrl: string | null
  quantity: number
  maxQuantity: number  // current stock
}

export interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}
