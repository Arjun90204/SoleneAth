import { Link } from 'react-router-dom'
import { Product } from '../lib/supabase'
import { useState } from 'react'
import { formatPrice } from '../lib/utils'
import { Plus } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null

  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-gray-900 aspect-[3/4]">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}
        <img
          src={product.image_url}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-3 left-3">
            <span className="inline-block bg-rose-400 text-black text-[10px] font-bold tracking-wider px-2 py-1 rounded-sm">
              -{discount}%
            </span>
          </div>
        )}

        {/* Bestseller/New Badge */}
        {product.featured && !discount && (
          <div className="absolute top-3 left-3">
            <span className="inline-block bg-white text-black text-[10px] font-bold tracking-wider px-2 py-1 rounded-sm">
              BESTSELLER
            </span>
          </div>
        )}

        {/* Quick Add - appears on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="p-3">
            <button
              onClick={(e) => e.preventDefault()}
              className="w-full py-3 bg-white text-black text-[11px] font-bold tracking-[0.15em] hover:bg-rose-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              QUICK ADD
            </button>
          </div>
        </div>

        {/* Second Image on hover - Gymshark style */}
        {product.images.length > 1 && (
          <img
            src={product.images[1]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}
      </div>

      {/* Product Info */}
      <div className="mt-3 pb-4">
        <h3 className="text-[11px] font-bold tracking-[0.1em] text-white uppercase group-hover:text-rose-400 transition-colors">
          {product.name}
        </h3>

        {/* Color Swatches */}
        <div className="flex items-center gap-1.5 mt-2">
          {product.colors.slice(0, 5).map((color, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer"
              style={{ backgroundColor: getColorValue(color) }}
              title={color}
            />
          ))}
          {product.colors.length > 5 && (
            <span className="text-[10px] text-gray-500 ml-1">+{product.colors.length - 5}</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-white">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'navy': '#1a1a2e',
    'grey': '#6B7280',
    'heather grey': '#9CA3AF',
    'charcoal': '#374151',
    'olive': '#556B2F',
    'burgundy': '#800020',
    'eggplant': '#614080',
    'dusty pink': '#D4A5A5',
    'sage': '#9DC183',
    'mauve': '#E0B0FF',
    'dusty blue': '#6B8CAE',
    'nude': '#E3BC9A',
    'cobalt blue': '#0047AB',
    'oatmeal': '#D3C4BE',
    'dusty mauve': '#D4A5A5',
    'vintage black': '#1a1a1a',
    'silver': '#C0C0C0',
    'camo': '#4A5D23',
    'blush': '#DE5D83',
    'multi-color': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  }
  return colorMap[color.toLowerCase()] || color.toLowerCase()
}
