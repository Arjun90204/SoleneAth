import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, Order } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

export function AccountPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setOrders(data)
      setOrdersLoading(false)
    }
    fetchOrders()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-white/10 p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="w-14 h-14 bg-emerald-400/10 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">{user?.email?.split('@')[0]}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                <Link
                  to="/account"
                  className="flex items-center justify-between p-3 bg-white/5 text-white"
                >
                  <span className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span className="text-[11px] font-bold tracking-[0.15em] uppercase">My Account</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center justify-between p-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Package className="w-4 h-4" />
                    <span className="text-[11px] font-bold tracking-[0.15em] uppercase">Orders</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between p-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="w-4 h-4" />
                    <span className="text-[11px] font-bold tracking-[0.15em] uppercase">Sign Out</span>
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="border border-white/10 p-6">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase mb-6">Account Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-3">Email</h3>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-3">Password</h3>
                  <p className="text-white">••••••••</p>
                </div>
              </div>

              {ordersLoading ? (
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length > 0 ? (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Recent Orders</h3>
                    <Link to="/orders" className="text-emerald-400 text-[11px] font-bold tracking-[0.15em] uppercase hover:text-emerald-300 transition-colors">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {orders.slice(0, 3).map((order) => (
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="block p-4 border border-white/10 hover:border-emerald-400/50 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{order.order_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{formatPrice(order.total)}</p>
                            <p className="text-[11px] font-bold tracking-[0.1em] text-emerald-400 uppercase">{order.status}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-white/10 text-center py-8">
                  <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">No orders yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
