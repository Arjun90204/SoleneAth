import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Product, ProductVariant } from '../lib/supabase'
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../lib/utils'

export function CartPage() {
  const { items, loading, updateQuantity, removeItem, subtotal, totalItems } = useCart()
  const { user } = useAuth()

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="text-center max-w-md px-4">
          <ShoppingBag className="w-16 h-16 text-gray-700 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-4">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Sign in to view and manage your cart.</p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-rose-400 transition-colors"
          >
            SIGN IN <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="text-center max-w-md px-4">
          <ShoppingBag className="w-16 h-16 text-gray-700 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-4">Your bag is empty</h2>
          <p className="text-gray-400 mb-8">Looks like you haven't added anything yet.</p>
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-rose-400 transition-colors"
          >
            START SHOPPING <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 149
  const tax = subtotal * 0.18 // 18% GST for India
  const total = subtotal + shipping + tax

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">
          YOUR BAG <span className="text-gray-500">({totalItems})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product as Product
              const variant = item.variant as ProductVariant
              const itemPrice = product.price + (variant?.price_adjustment || 0)

              return (
                <div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b border-white/10"
                >
                  <Link to={`/product/${product.slug}`} className="flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-24 h-32 object-cover grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <Link
                          to={`/product/${product.slug}`}
                          className="text-[11px] font-bold tracking-[0.1em] text-white uppercase hover:text-rose-400 transition-colors"
                        >
                          {product.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {variant?.color} / {variant?.size}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-600 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-white/20">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-white text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-white">{formatPrice(itemPrice * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div>
            <div className="sticky top-24 border border-white/10 p-6">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase mb-6">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-rose-400' : 'text-white'}`}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GST (18%)</span>
                  <span className="text-white font-medium">{formatPrice(tax)}</span>
                </div>
              </div>

              <hr className="my-4 border-white/10" />

              <div className="flex justify-between text-lg">
                <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Total</span>
                <span className="font-bold text-white">{formatPrice(total)}</span>
              </div>

              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="mt-4 text-xs text-rose-400 text-center">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping!
                </p>
              )}

              <Link
                to="/checkout"
                className="mt-6 block w-full py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase text-center hover:bg-rose-400 transition-colors"
              >
                CHECKOUT
              </Link>

              <Link
                to="/"
                className="mt-4 block w-full py-3 text-center text-[11px] font-bold tracking-[0.15em] text-gray-400 hover:text-white uppercase transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
