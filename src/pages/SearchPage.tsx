import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { supabase, Product } from '../lib/supabase'
import { ProductCard } from '../components/ProductCard'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function runSearch() {
      if (!query.trim()) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('featured', { ascending: false })

      setResults(data || [])
      setLoading(false)
    }
    runSearch()
  }, [query])

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <nav className="flex items-center gap-2 text-[11px] text-gray-500 mb-4">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <span className="text-black">Search</span>
        </nav>
        <h1 className="text-3xl font-black text-black tracking-tight uppercase mb-2">
          Search results
        </h1>
        {query && (
          <p className="text-gray-500 mb-8">
            {loading ? 'Searching' : `${results.length} result${results.length !== 1 ? 's' : ''}`} for "{query}"
          </p>
        )}

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
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-black/10">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-xl font-black text-black tracking-tight uppercase mb-2">
              {query ? 'No products found' : 'Search for something'}
            </h2>
            <p className="text-gray-500">
              {query
                ? `We couldn't find anything matching "${query}". Try a different word.`
                : 'Use the search icon in the header to find products by name.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
