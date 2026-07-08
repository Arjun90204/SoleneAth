import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingBag, User, Search, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { FREE_SHIPPING_THRESHOLD } from '../lib/utils'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { totalItems } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  const navLinks = [
    { name: 'NEW ARRIVALS', path: '/category/leggings', highlight: true },
    { name: 'WOMEN', path: '/category/leggings', children: [
      { name: 'Leggings', path: '/category/leggings' },
      { name: 'Sports Bras', path: '/category/sports-bras' },
      { name: 'Shorts', path: '/category/shorts' },
      { name: 'Tops', path: '/category/tanks-tops' },
    ]},
    { name: 'MEN', path: '/category/shorts', children: [
      { name: 'Shorts', path: '/category/shorts' },
      { name: 'Hoodies', path: '/category/hoodies-jackets' },
      { name: 'Accessories', path: '/category/accessories' },
    ]},
    { name: 'ACCESSORIES', path: '/category/accessories' },
    { name: 'SALE', path: '/category/leggings', highlight: true },
  ]

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-black text-white text-center py-2.5 px-4 border-b border-white/10">
        <p className="text-[11px] tracking-[0.2em] font-medium uppercase">
          FREE SHIPPING ON ORDERS ABOVE ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')} |{' '}
          <Link to="/signup" className="underline hover:no-underline text-emerald-400">
            SIGN UP FOR 15% OFF
          </Link>
        </p>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black shadow-lg' : 'bg-black/95 backdrop-blur-sm'
      }`}>
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex-1 lg:flex-none text-center lg:text-left">
              <span className="text-2xl lg:text-3xl font-black tracking-[0.15em] text-white">
                VELOUR
                <span className="text-emerald-400">FLEX</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-[11px] font-bold tracking-[0.2em] uppercase relative group flex items-center gap-1 ${
                    link.highlight ? 'text-emerald-400 hover:text-emerald-300' : 'text-white hover:text-gray-300'
                  } transition-colors`}
                >
                  {link.name}
                  {link.children && <ChevronDown className="w-3 h-3" />}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center space-x-1">
              <button className="p-3 text-white hover:text-gray-300 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <Link to="/account" className="p-3 text-white hover:text-gray-300 transition-colors">
                <User className="w-5 h-5" />
              </Link>
              <Link to="/cart" className="p-3 text-white hover:text-gray-300 transition-colors relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-emerald-400 text-black text-[10px] rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[108px] bg-black z-40 overflow-y-auto">
          <nav className="flex flex-col py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-6 py-4 text-sm font-bold tracking-[0.15em] text-white hover:bg-white/10 transition-colors ${
                  link.highlight ? 'text-emerald-400' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
            <hr className="my-4 border-white/10" />
            {user ? (
              <>
                <Link
                  to="/account"
                  className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-white hover:bg-white/10 transition-colors"
                >
                  MY ACCOUNT
                </Link>
                <Link
                  to="/orders"
                  className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-white hover:bg-white/10 transition-colors"
                >
                  MY ORDERS
                </Link>
                <button
                  onClick={signOut}
                  className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-left text-white hover:bg-white/10 transition-colors"
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-white hover:bg-white/10 transition-colors"
              >
                SIGN IN / JOIN
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
