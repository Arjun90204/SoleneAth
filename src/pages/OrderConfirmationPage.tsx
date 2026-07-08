import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'

export function OrderConfirmationPage() {
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="min-h-screen bg-black flex items-center justify-center pt-16 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Order Confirmed!</h1>
        <p className="text-gray-400 mb-8">
          Thank you for your purchase. We've received your order and will ship it within 3-5 business days.
        </p>

        {orderNumber && (
          <div className="border border-white/10 p-4 mb-6">
            <p className="text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">Order Number</p>
            <p className="text-xl font-bold text-white">{orderNumber}</p>
          </div>
        )}

        <div className="space-y-4 text-left mb-8">
          <div className="flex items-start gap-3 p-4 border border-white/10">
            <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Confirmation Email</p>
              <p className="text-sm text-gray-400">You'll receive an email with your order details shortly.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 border border-white/10">
            <Package className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Shipping Updates</p>
              <p className="text-sm text-gray-400">We'll notify you when your order ships via WhatsApp and email.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/orders"
            className="block w-full py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase text-center hover:bg-emerald-400 transition-colors"
          >
            VIEW ORDERS
          </Link>
          <Link
            to="/"
            className="block w-full py-3 text-center text-[11px] font-bold tracking-[0.15em] text-gray-400 hover:text-white uppercase transition-colors"
          >
            Continue Shopping <ArrowRight className="inline w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
