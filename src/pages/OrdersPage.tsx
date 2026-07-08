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

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!ordersData) return

      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          return { ...order, items: items || [] }
        })
      )

      setOrders(ordersWithItems)
      setLoading(false)
    }
    fetchOrders()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-white/10">
            <Package className="w-16 h-16 text-gray-700 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-4">No orders yet</h2>
            <p className="text-gray-400 mb-8">Looks like you haven't placed any orders.</p>
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-emerald-400 transition-colors"
            >
              START SHOPPING <ChevronRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-white/10">
                {/* Order Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <p className="font-bold text-white">{order.order_number}</p>
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
                      order.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                      order.status === 'processing' ? 'bg-blue-400/10 text-blue-400' :
                      order.status === 'shipped' ? 'bg-purple-400/10 text-purple-400' :
                      'bg-emerald-400/10 text-emerald-400'
                    }`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-white">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5">
                        <div className="w-16 h-20 bg-gray-800 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-white uppercase tracking-[0.05em]">{item.product_name}</p>
                          {item.variant_info && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.variant_info.size} / {item.variant_info.color}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Payment: <span className="text-white">{order.payment_status || 'Pending'}</span>
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
