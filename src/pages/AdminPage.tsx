import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, Order } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

// SHELL ONLY. This is intentionally minimal — a read-only order list.
// Everything a real admin needs (status updates, refunds, inventory
// editing, coupon management, CSV/Excel export) is tracked as a BLOCKER
// / IMPORTANT item in DEFERRED_TODO.md. Do not treat this as done.
export function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

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
        const { data } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (data) setOrders(data)
      }
      setLoading(false)
    }
    if (user) checkAdminAndLoad()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (isAdmin === false) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Admin — Orders</h1>
          <p className="text-yellow-400 text-sm mt-2">
            Shell mode: read-only. No status updates, refunds, or exports yet — see DEFERRED_TODO.md.
          </p>
        </div>

        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400 uppercase text-[11px] tracking-wider">
                <th className="p-4">Order #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 text-white">
                  <td className="p-4 font-bold">{order.order_number}</td>
                  <td className="p-4 text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-4">{order.status}</td>
                  <td className="p-4">{order.payment_status}</td>
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
    </div>
  )
}
