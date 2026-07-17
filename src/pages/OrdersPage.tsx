import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, Order } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

type OrderWithItems = Order & {
  items: Array<{
    id: string
    product_name: string
    quantity: number
    price: number
    variant_info: { size: string; color: string } | null
  }>
}

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return

      // BUG FIX: previously fetched orders, then fetched each order's items
      // in a separate query inside a loop (N+1: one query becomes 1+N as
      // order history grows). Embedding order_items in the same query lets
      // Postgres do the join in a single round-trip instead.
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!ordersData) return

      setOrders(ordersData as unknown as OrderWithItems[])
      setLoading(false)
    }
    fetchOrders()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <h1 className="text-3xl font-black text-black tracking-tight uppercase mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-black/10">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-black tracking-tight uppercase mb-4">No orders yet</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't placed any orders.</p>
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-teal-600 transition-colors"
            >
              START SHOPPING <ChevronRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-black/10">
                {/* Order Header */}
                <div className="flex items-center justify-between p-6 border-b border-black/10">
                  <div>
                    <p className="font-bold text-black">{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-[10px] font-bold tracking-[0.1em] uppercase ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      'bg-teal-100 text-teal-800'
                    }`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-black">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-black/5">
                        <div className="w-16 h-20 bg-gray-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-black uppercase tracking-[0.05em]">{item.product_name}</p>
                          {item.variant_info && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.variant_info.size} / {item.variant_info.color}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-black/10">
                    <p className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Payment: <span className="text-black">{order.payment_status || 'Pending'}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
