import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, Order, Product, Category } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const

type VariantRow = {
  id: string
  size: string
  color: string
  sku: string
  inventory: number
  product: { name: string; slug: string } | { name: string; slug: string }[] | null
}

type ProductFormState = {
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string
  category_id: string
  image_url: string
  images: string[]
  sizes: string
  colors: string
  featured: boolean
  in_stock: boolean
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  compare_at_price: '',
  category_id: '',
  image_url: '',
  images: [],
  sizes: '',
  colors: '',
  featured: false,
  in_stock: true,
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function splitList(text: string) {
  return text.split(',').map((s) => s.trim()).filter(Boolean)
}

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: String(product.price),
    compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : '',
    category_id: product.category_id || '',
    image_url: product.image_url || '',
    images: product.images || [],
    sizes: (product.sizes || []).join(', '),
    colors: (product.colors || []).join(', '),
    featured: product.featured,
    in_stock: product.in_stock,
  }
}

// Uploads to the public product-images storage bucket (see
// supabase/migrations/20260730010000_product_images_storage.sql) — write
// access is gated by is_admin via storage RLS, same enforcement pattern as
// every other admin action, just expressed as bucket policy instead of a
// SECURITY DEFINER function since Storage has no RPC layer of its own.
async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" isn't an image file.`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`"${file.name}" is over 5MB — use a smaller image.`)
  }
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(path, file)
  if (error) throw error
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

// Real admin actions, not a read-only shell anymore: order status/payment
// updates, inventory edits, and product create/edit/delete all go through
// admin_update_order() / admin_update_inventory() / admin_upsert_product() /
// admin_delete_product() — SECURITY DEFINER functions that check is_admin
// server-side on every call (see
// supabase/migrations/20260729000000_admin_order_and_inventory_actions.sql,
// 20260730000000_admin_product_management.sql, and
// 20260730020000_admin_delete_product.sql). Deliberately NOT a blanket
// "admins can UPDATE/DELETE orders/products" RLS policy — see those
// migrations' comments for why, given what the profiles privilege-escalation
// bug taught us.
export function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'orders' | 'inventory' | 'products'>('orders')

  const [orders, setOrders] = useState<Order[]>([])
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  const [variants, setVariants] = useState<VariantRow[]>([])
  const [variantFilter, setVariantFilter] = useState('')
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null)
  const [variantError, setVariantError] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingAdditional, setUploadingAdditional] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminAndLoad() {
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      const admin = profile?.is_admin === true
      setIsAdmin(admin)

      if (admin) {
        const [ordersRes, variantsRes, productsRes, categoriesRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase
            .from('product_variants')
            .select('id, size, color, sku, inventory, product:products(name, slug)'),
          supabase.from('products').select('*').order('name', { ascending: true }),
          supabase.from('categories').select('*').order('name', { ascending: true }),
        ])
        if (ordersRes.data) setOrders(ordersRes.data)
        if (variantsRes.data) {
          // Same embedded-join typing quirk as CartContext/OrdersPage:
          // Postgrest can't confirm cardinality from the select string
          // alone, so cast to the shape we know is actually returned.
          const typedVariants = variantsRes.data as unknown as VariantRow[]
          const sorted = [...typedVariants].sort((a, b) => {
            const nameA = (Array.isArray(a.product) ? a.product[0]?.name : a.product?.name) || ''
            const nameB = (Array.isArray(b.product) ? b.product[0]?.name : b.product?.name) || ''
            return nameA.localeCompare(nameB) || a.size.localeCompare(b.size) || a.color.localeCompare(b.color)
          })
          setVariants(sorted)
        }
        if (productsRes.data) setProducts(productsRes.data)
        if (categoriesRes.data) setCategories(categoriesRes.data)
      }
      setLoading(false)
    }
    if (user) checkAdminAndLoad()
  }, [user])

  const updateOrder = async (orderId: string, changes: { status?: string; payment_status?: string }) => {
    setSavingOrderId(orderId)
    setOrderError(null)
    const { error } = await supabase.rpc('admin_update_order', {
      p_order_id: orderId,
      p_status: changes.status ?? null,
      p_payment_status: changes.payment_status ?? null,
    })
    if (error) {
      setOrderError(error.message)
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...changes } : o)))
    }
    setSavingOrderId(null)
  }

  const updateInventory = async (variantId: string, newInventory: number) => {
    setSavingVariantId(variantId)
    setVariantError(null)
    const { error } = await supabase.rpc('admin_update_inventory', {
      p_variant_id: variantId,
      p_inventory: newInventory,
    })
    if (error) {
      setVariantError(error.message)
    } else {
      setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, inventory: newInventory } : v)))
    }
    setSavingVariantId(null)
  }

  const openNewProductForm = () => {
    setEditingProductId(null)
    setProductForm(EMPTY_PRODUCT_FORM)
    setSlugTouched(false)
    setProductError(null)
    setProductFormOpen(true)
  }

  const openEditProductForm = (product: Product) => {
    setEditingProductId(product.id)
    setProductForm(productToForm(product))
    setSlugTouched(true)
    setProductError(null)
    setProductFormOpen(true)
  }

  const closeProductForm = () => {
    setProductFormOpen(false)
    setEditingProductId(null)
    setProductError(null)
  }

  const handleMainImageFiles = async (files: FileList | File[] | null) => {
    const file = files?.[0]
    if (!file) return
    setUploadingMain(true)
    setProductError(null)
    try {
      const url = await uploadProductImage(file)
      setProductForm((prev) => ({ ...prev, image_url: url }))
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Upload failed.')
    }
    setUploadingMain(false)
  }

  const handleAdditionalImageFiles = async (files: FileList | File[] | null) => {
    const fileArray = files ? Array.from(files) : []
    if (fileArray.length === 0) return
    setUploadingAdditional(true)
    setProductError(null)
    try {
      const urls = await Promise.all(fileArray.map(uploadProductImage))
      setProductForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }))
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Upload failed.')
    }
    setUploadingAdditional(false)
  }

  const removeAdditionalImage = (index: number) => {
    setProductForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const imageItems = Array.from(e.clipboardData.items).filter((item) => item.type.startsWith('image/'))
    if (imageItems.length === 0) return
    e.preventDefault()
    const files = imageItems.map((item) => item.getAsFile()).filter((f): f is File => f !== null)
    if (files.length === 0) return
    if (!productForm.image_url) {
      handleMainImageFiles([files[0]])
      if (files.length > 1) handleAdditionalImageFiles(files.slice(1))
    } else {
      handleAdditionalImageFiles(files)
    }
  }

  const saveProduct = async () => {
    setSavingProduct(true)
    setProductError(null)

    const { data: newId, error } = await supabase.rpc('admin_upsert_product', {
      p_product_id: editingProductId,
      p_name: productForm.name.trim(),
      p_slug: productForm.slug.trim(),
      p_description: productForm.description.trim() || null,
      p_price: productForm.price ? Number(productForm.price) : null,
      p_compare_at_price: productForm.compare_at_price ? Number(productForm.compare_at_price) : null,
      p_category_id: productForm.category_id || null,
      p_image_url: productForm.image_url.trim() || null,
      p_images: productForm.images,
      p_sizes: splitList(productForm.sizes),
      p_colors: splitList(productForm.colors),
      p_featured: productForm.featured,
      p_in_stock: productForm.in_stock,
    })

    if (error) {
      setProductError(error.message)
      setSavingProduct(false)
      return
    }

    const { data: refreshed } = await supabase.from('products').select('*').order('name', { ascending: true })
    if (refreshed) setProducts(refreshed)

    if (!editingProductId && newId) {
      const { data: refreshedVariants } = await supabase
        .from('product_variants')
        .select('id, size, color, sku, inventory, product:products(name, slug)')
      if (refreshedVariants) {
        const typedVariants = refreshedVariants as unknown as VariantRow[]
        const sorted = [...typedVariants].sort((a, b) => {
          const nameA = (Array.isArray(a.product) ? a.product[0]?.name : a.product?.name) || ''
          const nameB = (Array.isArray(b.product) ? b.product[0]?.name : b.product?.name) || ''
          return nameA.localeCompare(nameB) || a.size.localeCompare(b.size) || a.color.localeCompare(b.color)
        })
        setVariants(sorted)
      }
    }

    setSavingProduct(false)
    setProductFormOpen(false)
    setEditingProductId(null)
  }

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This also removes its size/color variants and cannot be undone.`)) {
      return
    }
    setDeletingProductId(product.id)
    setProductError(null)

    const { error } = await supabase.rpc('admin_delete_product', { p_product_id: product.id })

    if (error) {
      setProductError(error.message)
      setDeletingProductId(null)
      return
    }

    // Best-effort: clean up any images we hosted for this product so the
    // storage bucket doesn't accumulate orphans. Not critical if it fails
    // (e.g. an external Pexels URL, not ours to delete) — the DB row is
    // already gone, which is what actually matters.
    const ownedPaths = [product.image_url, ...(product.images || [])]
      .filter((url): url is string => !!url && url.includes('/product-images/'))
      .map((url) => url.split('/product-images/')[1])
      .filter(Boolean)
    if (ownedPaths.length > 0) {
      await supabase.storage.from('product-images').remove(ownedPaths)
    }

    setProducts((prev) => prev.filter((p) => p.id !== product.id))
    setVariants((prev) => prev.filter((v) => {
      const slug = Array.isArray(v.product) ? v.product[0]?.slug : v.product?.slug
      return slug !== product.slug
    }))
    if (editingProductId === product.id) closeProductForm()
    setDeletingProductId(null)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (isAdmin === false) return <Navigate to="/" replace />

  const filteredVariants = variants.filter((v) => {
    const name = (Array.isArray(v.product) ? v.product[0]?.name : v.product?.name) || ''
    return name.toLowerCase().includes(variantFilter.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-black tracking-tight uppercase">Admin</h1>
          <p className="text-gray-500 text-sm mt-2">
            Order status/payment updates, inventory, and product management are live. Refunds
            here only change the status flag — no real gateway is connected yet, see
            DEFERRED_TODO.md.
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-black/10">
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border-b-2 transition-colors ${
              tab === 'orders' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setTab('inventory')}
            className={`px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border-b-2 transition-colors ${
              tab === 'inventory' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-3 text-[11px] font-bold tracking-[0.15em] uppercase border-b-2 transition-colors ${
              tab === 'products' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Products
          </button>
        </div>

        {tab === 'orders' && (
          <div>
            {orderError && (
              <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 text-sm">{orderError}</div>
            )}
            <div className="border border-black/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-gray-500 uppercase text-[11px] tracking-wider">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-black/5 text-black">
                      <td className="p-4 font-bold">{order.order_number}</td>
                      <td className="p-4 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          disabled={savingOrderId === order.id}
                          onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                          className="border border-black/20 text-black text-[11px] font-bold uppercase px-2 py-1.5 focus:outline-none focus:border-teal-600 disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.payment_status}
                          disabled={savingOrderId === order.id}
                          onChange={(e) => updateOrder(order.id, { payment_status: e.target.value })}
                          className="border border-black/20 text-black text-[11px] font-bold uppercase px-2 py-1.5 focus:outline-none focus:border-teal-600 disabled:opacity-50"
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right font-bold">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No orders yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div>
            {variantError && (
              <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 text-sm">{variantError}</div>
            )}
            <input
              type="text"
              value={variantFilter}
              onChange={(e) => setVariantFilter(e.target.value)}
              placeholder="Filter by product name..."
              className="w-full max-w-sm mb-4 px-4 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
            />
            <div className="border border-black/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-gray-500 uppercase text-[11px] tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Color</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4 text-right">Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariants.map((variant) => {
                    const productName = (Array.isArray(variant.product) ? variant.product[0]?.name : variant.product?.name) || 'Unknown'
                    return (
                      <tr key={variant.id} className="border-b border-black/5 text-black">
                        <td className="p-4 font-bold">{productName}</td>
                        <td className="p-4">{variant.size}</td>
                        <td className="p-4">{variant.color}</td>
                        <td className="p-4 text-gray-500">{variant.sku}</td>
                        <td className="p-4 text-right">
                          <input
                            type="number"
                            min={0}
                            defaultValue={variant.inventory}
                            disabled={savingVariantId === variant.id}
                            onBlur={(e) => {
                              const next = Math.max(0, parseInt(e.target.value, 10) || 0)
                              if (next !== variant.inventory) updateInventory(variant.id, next)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            }}
                            className="w-20 text-right border border-black/20 px-2 py-1.5 focus:outline-none focus:border-teal-600 disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {filteredVariants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No variants match.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div>
            {!productFormOpen && (
              <button
                onClick={openNewProductForm}
                className="mb-6 px-5 py-3 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-teal-600 transition-colors"
              >
                + New Product
              </button>
            )}

            {productFormOpen && (
              <div className="border border-black/10 p-6 mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-black mb-4">
                  {editingProductId ? 'Edit Product' : 'New Product'}
                </h2>
                {productError && (
                  <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 text-sm">{productError}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Name</span>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setProductForm((prev) => ({
                          ...prev,
                          name,
                          slug: slugTouched ? prev.slug : slugify(name),
                        }))
                      }}
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Slug</span>
                    <input
                      type="text"
                      value={productForm.slug}
                      onChange={(e) => {
                        setSlugTouched(true)
                        setProductForm((prev) => ({ ...prev, slug: e.target.value }))
                      }}
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Description</span>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Price (₹)</span>
                    <input
                      type="number"
                      min={0}
                      value={productForm.price}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Compare-at price (₹, optional)</span>
                    <input
                      type="number"
                      min={0}
                      value={productForm.compare_at_price}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, compare_at_price: e.target.value }))}
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Category</span>
                    <select
                      value={productForm.category_id}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, category_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>

                  <div
                    className="block md:col-span-2 border border-dashed border-black/20 p-4 focus:outline-none focus:border-teal-600"
                    tabIndex={0}
                    onPaste={handleImagePaste}
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                      Product images — click here and paste (Ctrl/Cmd+V) a copied image, or choose files below
                    </span>

                    <div className="mb-4">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Main image</span>
                      {productForm.image_url ? (
                        <div className="flex items-center gap-3">
                          <img src={productForm.image_url} alt="Main product" className="w-24 h-24 object-cover border border-black/10" />
                          <button
                            type="button"
                            onClick={() => setProductForm((prev) => ({ ...prev, image_url: '' }))}
                            className="text-red-600 hover:text-red-700 text-[11px] font-bold uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingMain}
                          onChange={(e) => handleMainImageFiles(e.target.files)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-black/20 file:text-[11px] file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-black hover:file:border-black file:cursor-pointer disabled:opacity-50"
                        />
                      )}
                      {uploadingMain && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Additional images</span>
                      {productForm.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {productForm.images.map((url, i) => (
                            <div key={url + i} className="relative w-20 h-20">
                              <img src={url} alt="" className="w-20 h-20 object-cover border border-black/10" />
                              <button
                                type="button"
                                onClick={() => removeAdditionalImage(i)}
                                aria-label="Remove image"
                                className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-xs leading-none rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingAdditional}
                        onChange={(e) => handleAdditionalImageFiles(e.target.files)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-black/20 file:text-[11px] file:font-bold file:uppercase file:tracking-wider file:bg-white file:text-black hover:file:border-black file:cursor-pointer disabled:opacity-50"
                      />
                      {uploadingAdditional && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                    </div>
                  </div>

                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Sizes (comma-separated)</span>
                    <input
                      type="text"
                      value={productForm.sizes}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, sizes: e.target.value }))}
                      placeholder="XS, S, M, L, XL"
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Colors (comma-separated)</span>
                    <input
                      type="text"
                      value={productForm.colors}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, colors: e.target.value }))}
                      placeholder="Black, Navy, Olive"
                      className="w-full px-3 py-2 border border-black/20 text-black text-sm focus:outline-none focus:border-teal-600"
                    />
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, featured: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-black">Featured (shows on homepage)</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.in_stock}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, in_stock: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-black">In stock (visible in store)</span>
                  </label>
                </div>

                {editingProductId && (
                  <p className="text-xs text-gray-500 mt-4">
                    Saving will add variants for any new size/color combos (starting at 0 stock — set
                    quantities on the Inventory tab). Existing variants and their stock are left alone.
                  </p>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveProduct}
                    disabled={savingProduct}
                    className="px-5 py-3 bg-black text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-teal-600 transition-colors disabled:opacity-50"
                  >
                    {savingProduct ? 'Saving...' : 'Save Product'}
                  </button>
                  <button
                    onClick={closeProductForm}
                    disabled={savingProduct}
                    className="px-5 py-3 border border-black/20 text-black text-[11px] font-bold tracking-[0.15em] uppercase hover:border-black transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="border border-black/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-gray-500 uppercase text-[11px] tracking-wider">
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const categoryName = categories.find((c) => c.id === product.category_id)?.name || '—'
                    return (
                      <tr key={product.id} className="border-b border-black/5 text-black">
                        <td className="p-4 font-bold">{product.name}</td>
                        <td className="p-4 text-gray-500">{categoryName}</td>
                        <td className="p-4 text-right">{formatPrice(product.price)}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                            product.in_stock ? 'bg-teal-400/20 text-teal-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {product.in_stock ? 'In stock' : 'Hidden'}
                          </span>
                          {product.featured && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-black/5 text-black">
                              Featured
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditProductForm(product)}
                            disabled={deletingProductId === product.id}
                            className="text-teal-600 hover:text-teal-700 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product)}
                            disabled={deletingProductId === product.id}
                            className="ml-4 text-red-600 hover:text-red-700 text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                          >
                            {deletingProductId === product.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No products yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
