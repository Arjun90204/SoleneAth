import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  category_id: string
  image_url: string
  images: string[]
  sizes: string[]
  colors: string[]
  featured: boolean
  in_stock: boolean
  created_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  image_url: string
  created_at: string
}

export type ProductVariant = {
  id: string
  product_id: string
  size: string
  color: string
  sku: string
  inventory: number
  price_adjustment: number
}

export type CartItem = {
  id: string
  user_id: string
  product_id: string
  variant_id: string
  quantity: number
  product?: Product
  variant?: ProductVariant
}

export type Order = {
  id: string
  user_id: string
  order_number: string
  status: string
  subtotal: number
  tax: number
  shipping: number
  total: number
  shipping_address: {
    first_name: string
    last_name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  billing_address: {
    first_name: string
    last_name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  payment_intent_id: string | null
  payment_status: string
  created_at: string
  updated_at: string
}
