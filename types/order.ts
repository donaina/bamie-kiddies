import type { Database } from './database'

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type DeliveryRegion = Database['public']['Tables']['delivery_regions']['Row']

export type OrderWithItems = Order & {
  order_items: OrderItem[]
  delivery_regions: DeliveryRegion | null
}

export type OrderStatus = Order['status']
export type PaymentStatus = Order['payment_status']
