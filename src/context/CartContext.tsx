import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase, CartItem, Product, ProductVariant } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface CartContextType {
  items: CartItem[]
  loading: boolean
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        variant_id,
        quantity,
        product:products(id, name, slug, price, image_url, sizes, colors),
        variant:product_variants(id, size, color, sku, inventory, price_adjustment)
      `)
      .eq('user_id', user.id)

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchCart()
  }, [user, fetchCart])

  const addToCart = async (productId: string, variantId: string, quantity = 1) => {
    if (!user) throw new Error('Please sign in to add items to cart')

    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: user.id, product_id: productId, variant_id: variantId, quantity },
        { onConflict: 'user_id,variant_id' }
      )

    if (error) throw error
    await fetchCart()
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId)
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)

    if (error) throw error
    await fetchCart()
  }

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
    await fetchCart()
  }

  const clearCart = async () => {
    if (!user) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
    await fetchCart()
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => {
    const product = item.product as Product
    const variant = item.variant as ProductVariant
    const price = product.price + (variant?.price_adjustment || 0)
    return sum + price * item.quantity
  }, 0)

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      subtotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
