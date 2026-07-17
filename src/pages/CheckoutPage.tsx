import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase, Product, ProductVariant } from '../lib/supabase'
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../lib/utils'

export function CheckoutPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, subtotal, clearCart, loading: cartLoading } = useCart()
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

  // BUG FIX: the email field's initial value was `user?.email || ''`
  // evaluated once at mount — but on a direct/reloaded visit, AuthContext
  // hasn't resolved the session yet at that first render, so user is null
  // and the field permanently defaults to '' even after login state
  // arrives. Sync it in once user becomes available, without overwriting
  // anything the customer has already typed.
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => (prev.email ? prev : { ...prev, email: user.email! }))
    }
  }, [user])

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 149
  const tax = subtotal * 0.18 // 18% GST — confirm this rate against your actual HSN codes before launch
  const total = subtotal + shipping + tax

  // BUG FIX: previously checked `!user` and `items.length === 0` without
  // waiting for AuthContext/CartContext to finish their initial session and
  // cart fetches. On a direct/reloaded visit to /checkout, user starts out
  // null and items starts out [] before those async checks resolve, so this
  // effect bounced logged-in customers with items in their cart straight to
  // /login or /cart. Now waits for both loading flags to settle first.
  useEffect(() => {
    if (authLoading || cartLoading) return
    if (!user) {
      navigate('/login')
    } else if (items.length === 0) {
      navigate('/cart')
    }
  }, [user, items, authLoading, cartLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const orderNumber = `SL-${Date.now().toString().slice(-8)}`

      // ============================================================
      // TODO: REAL RAZORPAY — payment confirmation is still a MOCK.
      //
      // Real flow (see DEFERRED_TODO.md):
      //   1. Call an Edge Function to create a Razorpay order server-side
      //      (needs RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET, never expose
      //      the secret to the client).
      //   2. Open Razorpay's checkout.js widget with that order id.
      //   3. On success, Razorpay redirects/callbacks with a payment id +
      //      signature. Send those to another Edge Function that verifies
      //      the signature server-side and ONLY THEN calls place_order
      //      (or an equivalent RPC) to actually create the order.
      //   4. A separate Razorpay webhook (not just the client callback)
      //      should also confirm payment — client-only confirmation can
      //      be spoofed.
      //   5. On confirmed payment: send receipt email, store business-copy
      //      receipt.
      //
      // Inventory locking is real, though: place_order() (see
      // supabase/migrations/20260714000000_atomic_place_order.sql) decrements
      // product_variants.inventory atomically inside the same transaction
      // that creates the order, so two customers can never both "buy" the
      // last unit. It also sets payment_status: 'paid' immediately, which is
      // the mock part — a real integration would only reach that state after
      // step 3 above confirms.
      // ============================================================
      const { error: orderError } = await supabase.rpc('place_order', {
        p_order_number: orderNumber,
        p_subtotal: subtotal,
        p_tax: tax,
        p_shipping: shipping,
        p_total: total,
        p_shipping_address: formData,
        p_billing_address: formData,
        p_items: items.map((item) => {
          const product = item.product as Product
          const variant = item.variant as ProductVariant
          return {
            product_id: product.id,
            variant_id: variant?.id,
            quantity: item.quantity,
            price: product.price + (variant?.price_adjustment || 0),
            product_name: product.name,
            variant_info: { size: variant?.size, color: variant?.color },
          }
        }),
      })

      if (orderError) throw orderError

      // BUG FIX: navigate before clearing the cart. clearCart() updates
      // CartContext state, which re-triggers this page's own "redirect to
      // /cart if empty" effect — that redirect was winning the race against
      // this navigate() and bouncing paying customers to an empty-bag page
      // instead of their order confirmation. Once we've navigated away,
      // CheckoutPage unmounts and its effect can no longer fire.
      navigate(`/checkout/success?order=${orderNumber}`)
      await clearCart()
    } catch (err) {
      // BUG FIX: supabase.rpc()'s `error` is a PostgrestError — a plain
      // object with a `message` property, not a native Error instance — so
      // `err instanceof Error` was always false for it, silently swallowing
      // the real message (including the friendly out-of-stock one below)
      // and always falling back to "Failed to place order".
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to place order'
      if (message.includes('insufficient_inventory')) {
        const productName = message.split(':')[1]?.trim() || 'One of the items in your bag'
        setError(`${productName} just sold out in that size/color. Please update your bag and try again.`)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-[11px] text-gray-500 mb-8">
          <Link to="/cart" className="hover:text-black transition-colors uppercase tracking-[0.1em]">Cart</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black uppercase tracking-[0.1em]">Checkout</span>
        </nav>

        <h1 className="text-3xl font-black text-black tracking-tight uppercase mb-2">CHECKOUT</h1>
        <div className="mb-8 inline-block px-3 py-1 bg-yellow-100 border border-yellow-300 text-yellow-800 text-[11px] font-bold tracking-wider uppercase">
          Shell mode — payments are simulated, not real
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="border border-black/10 p-6">
                <h2 className="text-[11px] font-bold tracking-[0.2em] text-black uppercase mb-6">Shipping Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors placeholder:text-gray-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">PIN Code</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      required
                      placeholder="110001"
                      className="w-full px-4 py-3 bg-transparent border border-black/20 text-black rounded focus:border-teal-600 focus:outline-none transition-colors placeholder:text-gray-400"
                    />
                    {/* TODO: pincode serviceability check against courier partner — deferred */}
                  </div>
                </div>
              </div>

              <div className="border border-teal-600/20 bg-teal-600/5 p-6">
                <h2 className="text-[11px] font-bold tracking-[0.2em] text-teal-700 uppercase mb-4">Payment</h2>
                <p className="text-sm text-gray-600">
                  Shell mode: clicking below simulates a successful payment.
                  No real charge occurs. Real Razorpay integration is tracked
                  in DEFERRED_TODO.md.
                </p>
              </div>

              {error && (
                <div className="p-4 border border-red-300 bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'PROCESSING...' : `SIMULATE PAYMENT — ${formatPrice(total)}`}
              </button>
            </form>
          </div>

          <div>
            <div className="sticky top-24 border border-black/10 p-6">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-black uppercase mb-6">Order Summary</h2>

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
                        <p className="text-[11px] font-bold text-black uppercase">{product.name}</p>
                        <p className="text-xs text-gray-500">{item.variant?.size} / {item.variant?.color}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <hr className="my-4 border-black/10" />

              <div className="space-y-2 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-black font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={shipping === 0 ? 'text-teal-600 font-medium' : 'text-black font-medium'}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST (18%)</span>
                  <span className="text-black font-medium">{formatPrice(tax)}</span>
                </div>
              </div>

              <hr className="my-4 border-black/10" />

              <div className="flex justify-between text-lg">
                <span className="text-[11px] font-bold tracking-[0.2em] text-black uppercase">Total</span>
                <span className="font-bold text-black">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
