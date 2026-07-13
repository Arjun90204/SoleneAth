import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'

export function OrderConfirmationPage() {
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-16 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-teal-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-700" />
        </div>
        <h1 className="text-3xl font-black text-black tracking-tight uppercase mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-8">
          Thank you for your purchase. We've received your order and will ship it within 3-5 business days.
        </p>

        {orderNumber && (
          <div className="border border-black/10 p-4 mb-6">
            <p className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-1">Order Number</p>
            <p className="text-xl font-bold text-black">{orderNumber}</p>
          </div>
        )}

        <div className="space-y-4 text-left mb-8">
          <div className="flex items-start gap-3 p-4 border border-black/10">
            <Mail className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-black text-sm">Confirmation Email</p>
              <p className="text-sm text-gray-500">You'll receive an email with your order details shortly.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 border border-black/10">
            <Package className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-black text-sm">Shipping Updates</p>
              <p className="text-sm text-gray-500">We'll notify you when your order ships via WhatsApp and email.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/orders"
            className="block w-full py-4 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase text-center hover:bg-teal-600 transition-colors"
          >
            VIEW ORDERS
          </Link>
          <Link
            to="/"
            className="block w-full py-3 text-center text-[11px] font-bold tracking-[0.15em] text-gray-500 hover:text-black uppercase transition-colors"
          >
            Continue Shopping <ArrowRight className="inline w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
