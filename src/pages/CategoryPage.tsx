import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, Product, Category } from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'
import { ChevronDown, Filter } from 'lucide-react'

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const categoryRes = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (categoryRes.data) {
        setCategory(categoryRes.data)

        let query = supabase
          .from('products')
          .select('*')
          .eq('category_id', categoryRes.data.id)

        if (sortBy === 'price-asc') {
          query = query.order('price', { ascending: true })
        } else if (sortBy === 'price-desc') {
          query = query.order('price', { ascending: false })
        } else {
          query = query.order('featured', { ascending: false })
        }

        const productsRes = await query

        if (productsRes.data) setProducts(productsRes.data)
      }

      setLoading(false)
    }
    fetchData()
  }, [slug, sortBy])

  const getAllColors = () => {
    const colors = new Set<string>()
    products.forEach(p => p.colors?.forEach(c => colors.add(c)))
    return Array.from(colors)
  }

  const getAllSizes = () => {
    const sizes = new Set<string>()
    products.forEach(p => p.sizes?.forEach(s => sizes.add(s)))
    return Array.from(sizes)
  }

  const filteredProducts = products.filter(product => {
    if (selectedColors.length > 0 && !product.colors.some(c => selectedColors.includes(c))) return false
    if (selectedSizes.length > 0 && !product.sizes.some(s => selectedSizes.includes(s))) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Category Hero — text sits on a photo, stays white regardless of page theme */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={category?.image_url}
          alt={category?.name}
          className="w-full h-full object-cover grayscale opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black" />
        <div className="absolute inset-0 flex items-end pb-8 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-[11px] text-gray-300 mb-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">{category?.name}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
              {category?.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-white border-b border-black/10 py-4 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border text-[11px] font-bold tracking-[0.15em] uppercase transition-colors ${
                showFilters ? 'bg-black text-white border-black' : 'border-black/20 text-black hover:border-black'
              }`}
            >
              <Filter className="w-4 h-4" />
              FILTER
              {(selectedColors.length + selectedSizes.length) > 0 && (
                <span className="w-5 h-5 bg-teal-400 text-black rounded-full flex items-center justify-center text-[10px]">
                  {selectedColors.length + selectedSizes.length}
                </span>
              )}
            </button>
            <span className="text-sm text-gray-500">{filteredProducts.length} products</span>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-transparent border border-black/20 text-black text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-2 pr-10 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="featured" className="bg-white">Featured</option>
              <option value="price-asc" className="bg-white">Price: Low to High</option>
              <option value="price-desc" className="bg-white">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-black/10 py-6 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-bold tracking-[0.2em] text-black uppercase">Filters</h3>
              {(selectedColors.length + selectedSizes.length) > 0 && (
                <button
                  onClick={() => {
                    setSelectedColors([])
                    setSelectedSizes([])
                  }}
                  className="text-[11px] text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Colors */}
              <div>
                <h4 className="text-[11px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Color</h4>
                <div className="flex flex-wrap gap-2">
                  {getAllColors().map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColors(prev =>
                          prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
                        )
                      }}
                      className={`flex items-center gap-2 px-3 py-2 border text-[10px] font-medium uppercase transition-colors ${
                        selectedColors.includes(color)
                          ? 'border-teal-600 bg-teal-600/10 text-teal-600'
                          : 'border-black/20 text-gray-500 hover:border-black/40'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: color.toLowerCase() }} />
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-[11px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {getAllSizes().map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSizes(prev =>
                          prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                        )
                      }}
                      className={`w-12 h-10 border text-[11px] font-bold transition-colors ${
                        selectedSizes.includes(size)
                          ? 'border-teal-600 bg-teal-600/10 text-teal-600'
                          : 'border-black/20 text-gray-500 hover:border-black/40'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="px-4 md:px-8 py-12">
        <div className="max-w-[1400px] mx-auto">
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
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">No products match your filters.</p>
              <button
                onClick={() => {
                  setSelectedColors([])
                  setSelectedSizes([])
                }}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
