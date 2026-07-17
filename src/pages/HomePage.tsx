import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase, Product, Category } from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').eq('featured', true).limit(8),
        supabase.from('categories').select('*')
      ])

      if (productsRes.data) setFeaturedProducts(productsRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Full Width with Text Overlay. Text sits on a photo
          with a dark gradient behind it, so it stays white/light-teal
          regardless of the site's white theme elsewhere. */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/9995084/pexels-photo-9995084.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Hero"
            className="w-full h-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        <div className="relative h-full flex flex-col justify-end pb-20 md:pb-32 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="max-w-xl">
              <span className="inline-block text-[11px] font-bold tracking-[0.3em] text-teal-400 mb-4 uppercase">
                NEW COLLECTION
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight mb-6">
                SCULPT<br/>YOUR<br/>
                <span className="text-teal-400">STRENGTH</span>
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-md mb-8">
                Premium athleisure engineered for peak performance. Elevate every rep, every stride, every moment.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/category/leggings"
                  className="inline-flex items-center px-8 py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] hover:bg-teal-400 transition-colors group"
                >
                  SHOP BESTSELLERS
                  <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/category/sports-bras"
                  className="inline-flex items-center px-8 py-4 border border-white text-white text-[11px] font-bold tracking-[0.15em] hover:bg-white hover:text-black transition-colors"
                >
                  NEW ARRIVALS
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] text-white/60 uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
        </div>
      </section>

      {/* Category Navigation Bar */}
      <section className="border-y border-black/10 py-6 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex overflow-x-auto gap-8 scrollbar-hide">
            {[
              { name: 'LEGGINGS', slug: 'leggings' },
              { name: 'SPORTS BRAS', slug: 'sports-bras' },
              { name: 'SHORTS', slug: 'shorts' },
              { name: 'TOPS', slug: 'tanks-tops' },
              { name: 'HOODIES', slug: 'hoodies-jackets' },
              { name: 'ACCESSORIES', slug: 'accessories' },
            ].map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="flex-shrink-0 text-[11px] font-bold tracking-[0.2em] text-black hover:text-teal-600 transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Split Hero Section - Gymshark Style. Text sits on photos, stays white/light-teal. */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="relative aspect-square lg:aspect-auto lg:h-[700px]">
          <img
            src="https://images.pexels.com/photos/10467198/pexels-photo-10467198.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="New Arrivals"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <span className="inline-block text-[10px] font-bold tracking-[0.3em] text-teal-400 mb-2">NEW</span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              EVERYDAY SEAMLESS<br/>RESTOCK
            </h2>
            <Link
              to="/category/leggings"
              className="inline-flex items-center text-[11px] font-bold tracking-[0.15em] text-white hover:text-teal-400 transition-colors"
            >
              SHOP NOW <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="relative aspect-square lg:aspect-auto lg:h-[700px]">
          <img
            src="https://images.pexels.com/photos/9994516/pexels-photo-9994516.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Sports Bras"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <span className="inline-block text-[10px] font-bold tracking-[0.3em] text-teal-400 mb-2">BESTSELLERS</span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              POWER<br/>COLLECTION
            </h2>
            <Link
              to="/category/sports-bras"
              className="inline-flex items-center text-[11px] font-bold tracking-[0.15em] text-white hover:text-teal-400 transition-colors"
            >
              SHOP NOW <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-teal-600 uppercase mb-2 block">TOP PICKS</span>
              <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">BESTSELLERS</h2>
            </div>
            <Link
              to="/category/leggings"
              className="hidden md:inline-flex items-center text-[11px] font-bold tracking-[0.15em] text-black hover:text-teal-600 transition-colors"
            >
              VIEW ALL <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/4] rounded" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link
              to="/category/leggings"
              className="inline-flex items-center text-[11px] font-bold tracking-[0.15em] text-black hover:text-teal-600 transition-colors"
            >
              VIEW ALL <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Video/Image Section with Text Overlay. Text sits on a photo, stays white/light-teal.
          BUG FIX: this used a fixed aspect-[21/9] on mobile, which at phone
          widths (e.g. 375px) computes to ~160px tall — nowhere near enough
          room for the 3-line heading plus button, so overflow-hidden
          silently clipped it. min-h-* guarantees enough room regardless of
          content length; md+ still uses the aspect ratio, since desktop
          widths give plenty of height at that ratio. */}
      <section className="relative min-h-[420px] md:min-h-0 md:aspect-[3/1] overflow-hidden">
        <img
          src="https://images.pexels.com/photos/10467197/pexels-photo-10467197.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Training"
          className="w-full h-full object-cover grayscale"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center py-10">
          <div className="text-center max-w-xl px-4">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              TRAIN<br/><span className="text-teal-400">WITHOUT</span><br/>LIMITS
            </h2>
            <Link
              to="/category/leggings"
              className="inline-flex items-center px-10 py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] hover:bg-teal-400 transition-colors"
            >
              SHOP COLLECTION <ArrowRight className="ml-3 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid - Large. Section bg is white; each card's own image
          keeps its dark gradient + white text since that's over a photo. */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold tracking-[0.3em] text-teal-600 uppercase mb-2 block">EXPLORE</span>
            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">SHOP BY CATEGORY</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group relative overflow-hidden aspect-[3/4]"
              >
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
                    {category.name.toUpperCase()}
                  </h3>
                  <span className="inline-flex items-center text-[11px] font-bold tracking-[0.15em] text-teal-400 group-hover:translate-x-2 transition-transform">
                    Shop <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-black/10 py-10 px-4 md:px-8 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {[
              { title: 'FREE SHIPPING', desc: 'On orders over ₹2,999' },
              { title: 'EASY RETURNS', desc: '15-day return policy' },
              { title: 'SECURE PAYMENT', desc: '100% secure checkout' },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <h3 className="text-[11px] font-bold tracking-[0.2em] text-black mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Signup - Full Width */}
      <section className="py-20 px-4 md:px-8 bg-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight mb-4">
            JOIN THE<br/><span className="text-teal-600">COMMUNITY</span>
          </h2>
          <p className="text-gray-500 mb-8">
            Subscribe for 15% off your first order and exclusive access to new drops.
          </p>
          <form className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-black/5 border border-black/10 rounded text-black placeholder-gray-500 focus:outline-none focus:border-teal-600 transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white text-[11px] font-bold tracking-[0.15em] hover:bg-teal-600 transition-colors"
            >
              SUBSCRIBE
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">
            By subscribing, you agree to our Privacy Policy and Terms of Service.
          </p>
        </div>
      </section>
    </div>
  )
}
