import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, User, Search, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { FREE_SHIPPING_THRESHOLD } from '../lib/utils'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(112)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const headerWrapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { totalItems } = useCart()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fix: measure real header height instead of hardcoding it, so the
  // mobile menu never overlaps or leaves a gap if the announcement bar wraps.
  useEffect(() => {
    function updateHeight() {
      if (headerWrapRef.current) setHeaderHeight(headerWrapRef.current.offsetHeight)
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }, [location])

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus()
  }, [isSearchOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const navLinks = [
    { name: 'NEW ARRIVALS', path: '/category/leggings', highlight: true },
    { name: 'ACTIVE', path: '/category/leggings', children: [
      { name: 'Leggings', path: '/category/leggings' },
      { name: 'Sports Bras', path: '/category/sports-bras' },
      { name: 'Shorts', path: '/category/shorts' },
      { name: 'Tops', path: '/category/tanks-tops' },
    ]},
    { name: 'OFFICEWEAR', path: '/category/tanks-tops' },
    { name: 'ACCESSORIES', path: '/category/accessories' },
    { name: 'SALE', path: '/category/leggings', highlight: true },
  ]

  return (
    <>
      <div ref={headerWrapRef}>
        {/* Announcement Bar — kept as a black/white "emphasis" strip, matching
            the same inverted treatment used on primary buttons throughout. */}
        <div className="bg-black text-white text-center py-2.5 px-4 border-b border-black">
          <p className="text-[11px] tracking-[0.2em] font-medium uppercase">
            FREE SHIPPING ON ORDERS ABOVE ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')} |{' '}
            <Link to="/signup" className="underline hover:no-underline text-teal-400">
              SIGN UP FOR 15% OFF
            </Link>
          </p>
        </div>

        {/* Main Header */}
        <header className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
        }`}>
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center justify-between h-16 px-4 lg:px-8">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 -ml-2 text-black hover:text-gray-600 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/" className="flex-1 lg:flex-none text-center lg:text-left">
                <span className="text-2xl lg:text-3xl font-black tracking-[0.15em] text-black">
                  SOLÉAN
                </span>
              </Link>

              <nav className="hidden lg:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`text-[11px] font-bold tracking-[0.2em] uppercase relative group flex items-center gap-1 ${
                      link.highlight ? 'text-teal-600 hover:text-teal-700' : 'text-black hover:text-gray-600'
                    } transition-colors`}
                  >
                    {link.name}
                    {link.children && <ChevronDown className="w-3 h-3" />}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </nav>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label={isSearchOpen ? 'Close search' : 'Search products'}
                  className="p-3 text-black hover:text-gray-600 transition-colors"
                >
                  {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
                <Link to="/account" className="p-3 text-black hover:text-gray-600 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <Link to="/cart" className="p-3 text-black hover:text-gray-600 transition-colors relative">
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-teal-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Expanding search bar */}
            {isSearchOpen && (
              <div className="border-t border-black/10 px-4 lg:px-8 py-4">
                <form onSubmit={handleSearchSubmit} className="max-w-[1400px] mx-auto flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for leggings, sports bras, co-ords..."
                    className="flex-1 bg-transparent text-black placeholder:text-gray-400 text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-teal-600 transition-colors"
                  >
                    Search
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Mobile Navigation — offset now derived from measured header height */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 bg-white z-40 overflow-y-auto"
          style={{ top: headerHeight }}
        >
          <nav className="flex flex-col py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-6 py-4 text-sm font-bold tracking-[0.15em] text-black hover:bg-black/5 transition-colors ${
                  link.highlight ? 'text-teal-600' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
            <hr className="my-4 border-black/10" />
            {user ? (
              <>
                <Link to="/account" className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-black hover:bg-black/5 transition-colors">
                  MY ACCOUNT
                </Link>
                <Link to="/orders" className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-black hover:bg-black/5 transition-colors">
                  MY ORDERS
                </Link>
                <button
                  onClick={signOut}
                  className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-left text-black hover:bg-black/5 transition-colors"
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <Link to="/login" className="px-6 py-4 text-sm font-bold tracking-[0.15em] text-black hover:bg-black/5 transition-colors">
                SIGN IN / JOIN
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
