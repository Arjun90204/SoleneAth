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

  // BUG FIX: flipping `loading` back to true only inside fetchCart (which
  // runs in a useEffect) leaves a real one-render gap. When AuthContext
  // resolves and `user` goes from null to a real user, React re-renders
  // this whole subtree — including consumers like CheckoutPage — in that
  // SAME commit, before this component's own useEffect(fetchCart) has had
  // a chance to run. Any consumer reading `loading` on that render sees the
  // stale value left over from the earlier "no user" fetch (false), even
  // though the real fetch for this user hasn't started. Resetting loading
  // synchronously during render (React's documented pattern for "reset
  // state when a prop changes") closes that gap entirely.
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null)
  if (loadedForUserId !== (user?.id ?? null)) {
    setLoadedForUserId(user?.id ?? null)
    setLoading(true)
  }

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
      // Supabase's embedded-resource typing can't confirm cardinality from
      // the select string alone, so product/variant type as arrays even
      // though the FK is many-to-one. Normalize to single objects here.
      const normalized = data.map((row) => ({
        ...row,
        product: Array.isArray(row.product) ? row.product[0] : row.product,
        variant: Array.isArray(row.variant) ? row.variant[0] : row.variant,
      })) as unknown as CartItem[]
      setItems(normalized)
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
