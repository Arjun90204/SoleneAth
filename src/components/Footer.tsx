import { Link } from 'react-router-dom'
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react'
import { FREE_SHIPPING_THRESHOLD } from '../lib/utils'

export function Footer() {
  return (
    <footer className="bg-white border-t border-black/10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-black uppercase mb-6">Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/category/leggings" className="text-sm text-gray-500 hover:text-black transition-colors">Leggings</Link></li>
              <li><Link to="/category/sports-bras" className="text-sm text-gray-500 hover:text-black transition-colors">Sports Bras</Link></li>
              <li><Link to="/category/shorts" className="text-sm text-gray-500 hover:text-black transition-colors">Shorts</Link></li>
              <li><Link to="/category/tanks-tops" className="text-sm text-gray-500 hover:text-black transition-colors">Officewear</Link></li>
              <li><Link to="/category/hoodies-jackets" className="text-sm text-gray-500 hover:text-black transition-colors">Hoodies</Link></li>
              <li><Link to="/category/accessories" className="text-sm text-gray-500 hover:text-black transition-colors">Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-black uppercase mb-6">Help</h3>
            <ul className="space-y-3">
              {/* TODO: these are placeholder links — real policy pages required before launch, see DEFERRED_TODO.md */}
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">FAQs</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Size Guide</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Track Order</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-black uppercase mb-6">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Our Story</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Stores</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-black uppercase mb-6">Connect</h3>
            <div className="flex flex-wrap gap-4 mb-6">
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-black transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
            <div className="space-y-3 text-sm text-gray-500">
              <p>Customer Support</p>
              {/* TODO: placeholder contact — replace before launch */}
              <p className="text-black font-medium">+91 00000 00000</p>
              <p className="text-xs">Mon-Sat: 10AM - 7PM IST</p>
            </div>
          </div>
        </div>

        <hr className="border-black/10 my-12" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Free Shipping</p>
            <p className="text-sm text-gray-500">On orders above ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Easy Returns</p>
            <p className="text-sm text-gray-500">15-day hassle-free returns</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[11px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Secure Payment</p>
            <p className="text-sm text-gray-500">100% secure via Razorpay</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-block">
              <span className="text-xl font-black tracking-[0.15em] text-black">SOLÉAN</span>
            </Link>
            <p className="text-xs text-gray-500 mt-2">© 2026 Soléan India. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
            {/* TODO: these must link to real, DPDP-Act-compliant pages before launch */}
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
