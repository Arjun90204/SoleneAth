import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, Order } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const

type VariantRow = {
  id: string
  size: string
  color: string
  sku: string
  inventory: number
  product: { name: string; slug: string } | { name: string; slug: string }[] | null
}

// Real admin actions, not a read-only shell anymore: order status/payment
// updates and inventory edits go through admin_update_order() /
// admin_update_inventory() — SECURITY DEFINER functions that check
// is_admin server-side on every call (see
// supabase/migrations/20260729000000_admin_order_and_inventory_actions.sql).
// Deliberately NOT a blanket "admins can UPDATE orders" RLS policy — see
// that migration's comment for why, given what the profiles
// privilege-escalation bug taught us.
export function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'orders' | 'inventory'>('orders')

  const [orders, setOrders] = useState<Order[]>([])
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  const [variants, setVariants] = useState<VariantRow[]>([])
  const [variantFilter, setVariantFilter] = useState('')
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null)
  const [variantError, setVariantError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminAndLoad() {
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      const admin = profile?.is_admin === true
      setIsAdmin(admin)

      if (admin) {
        const [ordersRes, variantsRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase
            .from('product_variants')
            .select('id, size, color, sku, inventory, product:products(name, slug)'),
        ])
        if (ordersRes.data) setOrders(ordersRes.data)
        if (variantsRes.data) {
          // Same embedded-join typing quirk as CartContext/OrdersPage:
          // Postgrest can't confirm cardinality from the select string
          // alone, so cast to the shape we know is actually returned.
          const typedVariants = variantsRes.data as unknown as VariantRow[]
          const sorted = [...typedVariants].sort((a, b) => {
            const nameA = (Array.isArray(a.product) ? a.product[0]?.name : a.product?.name) || ''
            const nameB = (Array.isArray(b.product) ? b.product[0]?.name : b.product?.name) || ''
            return nameA.localeCompare(nameB) || a.size.localeCompare(b.size) || a.color.localeCompare(b.color)
          })
          setVariants(sorted)
        }
      }
      setLoading(false)
    }
    if (user) checkAdminAndLoad()
  }, [user])

  const updateOrder = async (orderId: string, changes: { status?: string; payment_status?: string }) => {
    setSavingOrderId(orderId)
    setOrderError(null)
    const { error } = await supabase.rpc('admin_update_order', {
      p_order_id: orderId,
      p_status: changes.status ?? null,
      p_payment_status: changes.payment_status ?? null,
    })
    if (error) {
      setOrderError(error.message)
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...changes } : o)))
    }
    setSavingOrderId(null)
  }

  const updateInventory = async (variantId: string, newInventory: number) => {
    setSavingVariantId(variantId)
    setVariantError(null)
    const { error } = await supabase.rpc('admin_update_inventory', {
      p_variant_id: variantId,
      p_inventory: newInventory,
    })
    if (error) {
      setVariantError(error.message)
    } else {
      setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, inventory: newInventory } : v)))
    }
    setSavingVariantId(null)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (isAdmin === false) return <Navigate to="/" replace />

  const filteredVariants = variants.filter((v) => {
    const name = (Array.isArray(v.product) ? v.product[0]?.name : v.product?.name) || ''
    return name.toLowerCase().includes(variantFilter.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-black tracking-tight uppercase">Admin</h1>
          <p className="text-gray-500 text-sm mt-2">
            Order status/payment updates and inventory are live. Refunds here only change the
            status flag — no real gateway is connected yet, see DEFERRED_TODO.md.
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-black/10">
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border-b-2 transition-colors ${
              tab === 'orders' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setTab('inventory')}
            className={`px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border-b-2 transition-colors ${
              tab === 'inventory' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Inventory
          </button>
        </div>

        {tab === 'orders' && (
          <div>
            {orderError && (
              <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 text-sm">{orderError}</div>
            )}
            <div className="border border-black/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-gray-500 uppercase text-[11px] tracking-wider">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-black/5 text-black">
                      <td className="p-4 font-bold">{order.order_number}</td>
                      <td className="p-4 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          disabled={savingOrderId === order.id}
                          onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                          className="border border-black/20 text-black text-[11px] font-bold uppercase px-2 py-1.5 focus:outline-none focus:border-teal-600 disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.payment_status}
                          disabled={savingOrderId === order.id}
                          onChange={(e) => updateOrder(order.id, { payment_status: e.target.value })}
                          className="border border-black/20 text-black text-[11px] font-bold uppercase px-2 py-1.5 focus:outline-none focus:border-teal-600 disabled:opacity-50"
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right font-bold">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No orders yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div>
            {variantError && (
              <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 text-sm">{variantError}</div>
            )}
            <input
              type="text"
              value={variantFilter}
              onChange={(e) => setVariantFilter(e.target.value)}
              placeholder="Filter by product name..."
              className="w-full max-w-sm mb-4 px-4 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
            />
            <div className="border border-black/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-gray-500 uppercase text-[11px] tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Color</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4 text-right">Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariants.map((variant) => {
                    const productName = (Array.isArray(variant.product) ? variant.product[0]?.name : variant.product?.name) || 'Unknown'
                    return (
                      <tr key={variant.id} className="border-b border-black/5 text-black">
                        <td className="p-4 font-bold">{productName}</td>
                        <td className="p-4">{variant.size}</td>
                        <td className="p-4">{variant.color}</td>
                        <td className="p-4 text-gray-500">{variant.sku}</td>
                        <td className="p-4 text-right">
                          <input
                            type="number"
                            min={0}
                            defaultValue={variant.inventory}
                            disabled={savingVariantId === variant.id}
                            onBlur={(e) => {
                              const next = Math.max(0, parseInt(e.target.value, 10) || 0)
                              if (next !== variant.inventory) updateInventory(variant.id, next)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            }}
                            className="w-20 text-right border border-black/20 px-2 py-1.5 focus:outline-none focus:border-teal-600 disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {filteredVariants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No variants match.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
