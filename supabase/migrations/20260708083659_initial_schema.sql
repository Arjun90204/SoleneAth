/*
# Athleisure E-Commerce Database Schema

This migration creates the complete database structure for an athleisure brand e-commerce platform.

## New Tables

1. **categories** - Product categories (e.g., Leggings, Sports Bras, Shorts)
   - id (uuid, primary key)
   - name (text, unique)
   - slug (text, unique for URLs)
   - description (text)
   - image_url (text)
   - created_at (timestamp)

2. **products** - Individual products
   - id (uuid, primary key)
   - name (text)
   - slug (text, unique for URLs)
   - description (text)
   - price (decimal)
   - compare_at_price (decimal, for showing discounts)
   - category_id (uuid, foreign key)
   - image_url (text)
   - images (text array)
   - sizes (text array)
   - colors (text array)
   - featured (boolean)
   - in_stock (boolean)
   - created_at (timestamp)

3. **product_variants** - Size/color combinations with inventory
   - id (uuid, primary key)
   - product_id (uuid, foreign key)
   - size (text)
   - color (text)
   - sku (text, unique)
   - inventory (integer)
   - price_adjustment (decimal)

4. **cart_items** - Shopping cart
   - id (uuid, primary key)
   - user_id (uuid, foreign key to auth.users)
   - product_id (uuid, foreign key)
   - variant_id (uuid, foreign key)
   - quantity (integer)

5. **orders** - Customer orders
   - id (uuid, primary key)
   - user_id (uuid, foreign key)
   - order_number (text, unique)
   - status (text)
   - subtotal (decimal)
   - tax (decimal)
   - shipping (decimal)
   - total (decimal)
   - shipping_address (jsonb)
   - billing_address (jsonb)
   - payment_intent_id (text, for Stripe)
   - payment_status (text)
   - created_at (timestamp)
   - updated_at (timestamp)

6. **order_items** - Items within an order
   - id (uuid, primary key)
   - order_id (uuid, foreign key)
   - product_id (uuid, foreign key)
   - variant_id (uuid, foreign key)
   - quantity (integer)
   - price (decimal)
   - product_name (text)
   - variant_info (jsonb)

## Security
- RLS enabled on all tables
- Policies ensure users can only access their own data
- Products/categories are publicly readable
- Carts and orders are user-scoped
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price decimal(10,2) NOT NULL,
  compare_at_price decimal(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  images text[] DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  featured boolean DEFAULT false,
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Product Variants (size/color combinations with inventory)
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  sku text NOT NULL UNIQUE,
  inventory integer NOT NULL DEFAULT 0,
  price_adjustment decimal(10,2) DEFAULT 0
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, variant_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  subtotal decimal(10,2) NOT NULL,
  tax decimal(10,2) NOT NULL DEFAULT 0,
  shipping decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL,
  shipping_address jsonb,
  billing_address jsonb,
  payment_intent_id text,
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  product_name text NOT NULL,
  variant_info jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Products: Public read
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Product Variants: Public read
DROP POLICY IF EXISTS "public_read_variants" ON product_variants;
CREATE POLICY "public_read_variants" ON product_variants FOR SELECT
  TO anon, authenticated USING (true);

-- Cart Items: User owns their cart
DROP POLICY IF EXISTS "select_own_cart" ON cart_items;
CREATE POLICY "select_own_cart" ON cart_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cart" ON cart_items;
CREATE POLICY "insert_own_cart" ON cart_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cart" ON cart_items;
CREATE POLICY "update_own_cart" ON cart_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cart" ON cart_items;
CREATE POLICY "delete_own_cart" ON cart_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Orders: User owns their orders
DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Order Items: User owns their order items (via order ownership)
DROP POLICY IF EXISTS "select_own_order_items" ON order_items;
CREATE POLICY "select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);