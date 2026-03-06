// Auto-maintain this file when schema changes.
// Reflects supabase/migrations/001_initial_schema.sql

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          cost_price: number | null
          discount_percent: number
          category: string | null
          gender: 'boys' | 'girls' | 'unisex' | null
          age_group: string | null
          is_active: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          cloudinary_url: string
          cloudinary_id: string
          alt_text: string | null
          is_primary: boolean
          display_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          size: string
          quantity: number
          sku: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
      }
      delivery_regions: {
        Row: {
          id: string
          name: string
          state: string | null
          delivery_fee: number
          estimated_days: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['delivery_regions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['delivery_regions']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          delivery_type: 'delivery' | 'pickup'
          delivery_region_id: string | null
          delivery_address: string | null
          delivery_fee: number
          subtotal: number
          total_amount: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          paystack_reference: string | null
          paystack_txn_id: string | null
          paid_at: string | null
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          customer_note: string | null
          admin_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string
          product_name: string
          product_image_url: string | null
          size: string
          quantity: number
          unit_price: number
          unit_cost: number | null
          subtotal: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      admin_users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'super_admin' | 'admin'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>
      }
      webhook_events: {
        Row: {
          id: string
          event_type: string
          paystack_ref: string
          payload: Json
          processed: boolean
          processed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['webhook_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['webhook_events']['Insert']>
      }
      site_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: Database['public']['Tables']['site_settings']['Row']
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>
      }
    }
  }
}
