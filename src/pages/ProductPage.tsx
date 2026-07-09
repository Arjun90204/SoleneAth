import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Minus, Plus, Heart, ChevronRight, ChevronLeft, Truck, RefreshCw, Shield, Check } from 'lucide-react'
import { supabase, Product, ProductVariant } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ProductCard } from '../components/ProductCard'
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../lib/utils'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showAddedMessage, setShowAddedMessage] = useState(false)

  const { addToCart } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)

      const productRes = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (productRes.data) {
        setProduct(productRes.data)
        setSelectedColor(productRes.data.colors[0] || null)

        const variantsRes = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productRes.data.id)

        if (variantsRes.data) setVariants(variantsRes.data)

        const relatedRes = await supabase
          .from('products')
          .select('*')
          .eq('category_id', productRes.data.category_id)
          .neq('id', productRes.data.id)
          .limit(4)

        if (relatedRes.data) setRelatedProducts(relatedRes.data)
      }

      setLoading(false)
    }
    fetchProduct()
  }, [slug])

  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  )

  const handleAddToCart = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    if (!selectedVariant) {
      alert('Please select size and color')
      return
    }

    setAddingToCart(true)
    try {
      await addToCart(product!.id, selectedVariant.id, quantity)
      setShowAddedMessage(true)
      setTimeout(() => setShowAddedMessage(false), 3000)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <p className="text-gray-400">Product not found</p>
      </div>
    )
  }

  const availableSizes = Array.from(new Set(variants.filter(v => v.color === selectedColor).map(v => v.size)))

  const price = product.price + (selectedVariant?.price_adjustment || 0)

  // BUG FIX: previously this checked `availableSizes.includes(selectedSize)`
  // against the OLD render's availableSizes (computed from the OLD
  // selectedColor) before React had re-rendered with the new color. That
  // stale-closure check could silently leave an invalid size selected.
  // Now we compute validity directly against `variants` using the NEW color,
  // so it's correct on the same click.
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    const stillValid = selectedSize
      ? variants.some(v => v.color === color && v.size === selectedSize && v.inventory > 0)
      : false
    if (!stillValid) setSelectedSize(null)
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="border-b border-white/10 py-4 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <nav className="flex items-center gap-2 text-[11px] text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/category/${slug?.split('-')[0]}`} className="hover:text-white transition-colors">
              {product.name.split(' ')[0]}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-gray-900 overflow-hidden">
              <img
                src={product.images[currentImageIndex] || product.image_url}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              {product.compare_at_price && (
                <span className="absolute top-4 left-4 bg-rose-400 text-black text-[10px] font-bold tracking-[0.1em] px-2 py-1">
                  -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                </span>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(Math.min(product.images.length - 1, currentImageIndex + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white transition-colors"
                    disabled={currentImageIndex === product.images.length - 1}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${
                      i === currentImageIndex ? 'border-rose-400' : 'border-transparent hover:border-white/40'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                {product.featured && (
                  <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-rose-400 uppercase mb-2">
                    Bestseller
                  </span>
                )}
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                  {product.name}
                </h1>
              </div>
              <button className="p-3 border border-white/20 text-gray-400 hover:text-white hover:border-white transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <span className="text-2xl font-bold text-white">{formatPrice(price)}</span>
              {product.compare_at_price && (
                <span className="text-lg text-gray-500 line-through">{formatPrice(product.compare_at_price)}</span>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                  Color: <span className="text-gray-400 font-normal normal-case">{selectedColor}</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      color === selectedColor ? 'ring-2 ring-offset-2 ring-offset-black ring-rose-400 border-rose-400' : 'border-white/20 hover:border-white/40'
                    }`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Size</label>
                {/* TODO: size guide modal — currently missing entirely, see DEFERRED_TODO.md */}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const isAvailable = selectedColor && variants.some(v => v.size === size && v.color === selectedColor && v.inventory > 0)
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={`min-w-[48px] h-12 px-3 border text-[11px] font-bold transition-all ${
                        size === selectedSize
                          ? 'border-white bg-white text-black'
                          : isAvailable
                            ? 'border-white/20 text-white hover:border-white/40'
                            : 'border-white/10 text-gray-600 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
              {availableSizes.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">No sizes available in this color.</p>
              )}
            </div>

            <div className="mt-8">
              <label className="text-[11px] font-bold tracking-[0.2em] text-white uppercase block mb-3">Quantity</label>
              <div className="flex items-center border border-white/20 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-white font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedColor || addingToCart}
                className="w-full py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                {addingToCart ? 'ADDING...' : 'ADD TO BAG'}
              </button>

              {showAddedMessage && (
                <div className="mt-4 p-4 bg-rose-400/10 border border-rose-400/20 flex items-center gap-3 text-rose-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Added to your bag!</span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Truck className="w-5 h-5 text-rose-400" />
                <span>Free shipping on orders above ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <RefreshCw className="w-5 h-5 text-rose-400" />
                <span>15-day easy returns</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Shield className="w-5 h-5 text-rose-400" />
                <span>Secure checkout with Razorpay</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-[11px] font-bold tracking-[0.2em] text-white uppercase mb-4">Description</h3>
              <p className="text-gray-400 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">You May Also Like</h2>
              <Link
                to={`/category/${product.category_id}`}
                className="hidden md:flex items-center text-[11px] font-bold tracking-[0.15em] text-white hover:text-rose-400 transition-colors"
              >
                VIEW ALL <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
