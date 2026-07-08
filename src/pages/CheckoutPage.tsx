import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase, Product, ProductVariant } from '../lib/supabase'
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../lib/utils'

export function CheckoutPage() {
  const { user } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 149
  const tax = subtotal * 0.18 // 18% GST
  const total = subtotal + shipping + tax

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (items.length === 0) {
      navigate('/cart')
    }
  }, [user, items, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const orderNumber = `VF-${Date.now().toString().slice(-8)}`

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          tax,
          shipping,
          total,
          shipping_address: formData,
          billing_address: formData,
          payment_status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      for (const item of items) {
        const product = item.product as Product
        const variant = item.variant as ProductVariant

        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: product.id,
          variant_id: variant?.id,
          quantity: item.quantity,
          price: product.price + (variant?.price_adjustment || 0),
          product_name: product.name,
          variant_info: { size: variant?.size, color: variant?.color }
        })
      }

      await clearCart()
      navigate(`/checkout/success?order=${orderNumber}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] text-gray-400 mb-8">
          <Link to="/cart" className="hover:text-white transition-colors uppercase tracking-[0.1em]">Cart</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white uppercase tracking-[0.1em]">Checkout</span>
        </nav>

        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping */}
              <div className="border border-white/10 p-6">
                <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase mb-6">Shipping Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors placeholder:text-gray-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">PIN Code</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      required
                      placeholder="110001"
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-emerald-400 focus:outline-none transition-colors placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="border border-emerald-400/20 bg-emerald-400/5 p-6">
                <h2 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400 uppercase mb-4">Payment</h2>
                <p className="text-sm text-gray-400">
                  After placing your order, you will receive a confirmation email. Complete payment securely via Razorpay.
                </p>
              </div>

              {error && (
                <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'PROCESSING...' : `PAY ${formatPrice(total)}`}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div>
            <div className="sticky top-24 border border-white/10 p-6">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase mb-6">Order Summary</h2>

              <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const product = item.product as Product
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-20 object-cover grayscale"
                      />
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-white uppercase">{product.name}</p>
                        <p className="text-xs text-gray-500">{item.variant?.size} / {item.variant?.color}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <hr className="my-4 border-white/10" />

              <div className="space-y-2 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-400 font-medium' : 'text-white font-medium'}>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
