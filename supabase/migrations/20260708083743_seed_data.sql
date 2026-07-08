/*
# Seed Data for Athleisure Store

This migration populates the database with initial product data.

## Categories Added
- Leggings, Sports Bras, Shorts, Tanks & Tops, Hoodies & Jackets, Accessories

## Products Added
- 15 products across all categories with realistic pricing
- Each product includes multiple sizes and colors
- Featured products set for homepage display
*/

-- Categories
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Leggings', 'leggings', 'High-performance leggings for every workout', 'https://images.pexels.com/photos/9995084/pexels-photo-9995084.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Sports Bras', 'sports-bras', 'Support and comfort for intense workouts', 'https://images.pexels.com/photos/10467198/pexels-photo-10467198.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Shorts', 'shorts', 'Lightweight and breathable training shorts', 'https://images.pexels.com/photos/6551098/pexels-photo-6551098.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Tanks & Tops', 'tanks-tops', 'Moisture-wicking tops for peak performance', 'https://images.pexels.com/photos/9994514/pexels-photo-9994514.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Hoodies & Jackets', 'hoodies-jackets', 'Comfortable layers for warm-ups and cool-downs', 'https://images.pexels.com/photos/6551074/pexels-photo-6551074.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Accessories', 'accessories', 'Essential gear for your fitness journey', 'https://images.pexels.com/photos/4222441/pexels-photo-4222441.jpeg?auto=compress&cs=tinysrgb&w=800')
ON CONFLICT (slug) DO NOTHING;

-- Products (Leggings)
INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, images, sizes, colors, featured, in_stock) VALUES
  ('Flex High-Waist Leggings', 'flex-high-waist-leggings', 'Our signature sculpting leggings with 4-way stretch and a flattering high waistband. Squat-proof and ultra-comfortable.', 78.00, null, (SELECT id FROM categories WHERE slug = 'leggings'), 'https://images.pexels.com/photos/9995084/pexels-photo-9995084.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/9995084/pexels-photo-9995084.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/9995081/pexels-photo-9995081.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Navy', 'Olive', 'Burgundy'], true, true),
  
  ('Power Compression Leggings', 'power-compression-leggings', 'Maximum compression for intense training sessions. Seamless construction with targeted support zones.', 88.00, null, (SELECT id FROM categories WHERE slug = 'leggings'), 'https://images.pexels.com/photos/10467198/pexels-photo-10467198.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/10467198/pexels-photo-10467198.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Charcoal', 'Eggplant'], true, true),

  ('Flow Seamless Leggings', 'flow-seamless-leggings', 'Buttery soft seamless leggings that move with you. Perfect for yoga and low-impact workouts.', 72.00, 85.00, (SELECT id FROM categories WHERE slug = 'leggings'), 'https://images.pexels.com/photos/9995081/pexels-photo-9995081.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/9995081/pexels-photo-9995081.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Mauve', 'Dusty Blue', 'Black'], false, true),

  ('Endurance 7/8 Leggings', 'endurance-7-8-leggings', '7/8 length leggings with quick-dry technology and hidden pocket. Built for marathon training.', 85.00, null, (SELECT id FROM categories WHERE slug = 'leggings'), 'https://images.pexels.com/photos/9558135/pexels-photo-9558135.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/9558135/pexels-photo-9558135.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Dusty Pink', 'Sage'], false, true),

  -- Sports Bras
  ('Impact Sports Bra', 'impact-sports-bra', 'Maximum support for high-impact activities. Racerback design with moisture-wicking fabric.', 45.00, null, (SELECT id FROM categories WHERE slug = 'sports-bras'), 'https://images.pexels.com/photos/9994516/pexels-photo-9994516.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/9994516/pexels-photo-9994516.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'White', 'Navy'], true, true),

  ('Flex Crop Top', 'flex-crop-top', 'Light support cropped top with removable padding. Perfect pairing for high-waist leggings.', 38.00, null, (SELECT id FROM categories WHERE slug = 'sports-bras'), 'https://images.pexels.com/photos/10467197/pexels-photo-10467197.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/10467197/pexels-photo-10467197.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Nude', 'Olive', 'Burgundy'], true, true),

  -- Shorts
  ('Racer Training Shorts', 'racer-training-shorts', '4-inch inseam shorts with built-in liner. Breathable and squat-proof.', 48.00, null, (SELECT id FROM categories WHERE slug = 'shorts'), 'https://images.pexels.com/photos/6551098/pexels-photo-6551098.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/6551098/pexels-photo-6551098.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Navy', 'Heather Grey'], true, true),

  ('Flow Biker Shorts', 'flow-biker-shorts', '8-inch inseam biker shorts with pockets. Super soft and sculpting.', 52.00, null, (SELECT id FROM categories WHERE slug = 'shorts'), 'https://images.pexels.com/photos/7815211/pexels-photo-7815211.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/7815211/pexels-photo-7815211.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Olive', 'Camo'], false, true),

  -- Tanks & Tops
  ('Sculpt Tank', 'sculpt-tank', 'Form-fitting tank with built-in shelf bra. Racerback design shows off those shoulders.', 42.00, null, (SELECT id FROM categories WHERE slug = 'tanks-tops'), 'https://images.pexels.com/photos/9994514/pexels-photo-9994514.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/9994514/pexels-photo-9994514.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'White', 'Dusty Blue'], true, true),

  ('Core Performance Tee', 'core-performance-tee', 'Lightweight performance tee with moisture-wicking technology. Relaxed fit for everyday wear.', 35.00, null, (SELECT id FROM categories WHERE slug = 'tanks-tops'), 'https://images.pexels.com/photos/6551073/pexels-photo-6551073.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/6551073/pexels-photo-6551073.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL'], ARRAY['White', 'Black', 'Grey Marl'], false, true),

  -- Hoodies & Jackets
  ('Essential Oversized Hoodie', 'essential-oversized-hoodie', 'Super soft oversized hoodie for pre and post-workout. Kangaroo pocket and thumb holes.', 75.00, null, (SELECT id FROM categories WHERE slug = 'hoodies-jackets'), 'https://images.pexels.com/photos/6551074/pexels-photo-6551074.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/6551074/pexels-photo-6551074.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Vintage Black', 'Oatmeal', 'Dusty Mauve'], true, true),

  ('Windbreaker Jacket', 'windbreaker-jacket', 'Lightweight wind and water-resistant jacket. Packs into its own pocket for easy carrying.', 95.00, null, (SELECT id FROM categories WHERE slug = 'hoodies-jackets'), 'https://images.pexels.com/photos/8183765/pexels-photo-8183765.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/8183765/pexels-photo-8183765.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['XS', 'S', 'M', 'L', 'XL'], ARRAY['Black', 'Silver', 'Cobalt Blue'], false, true),

  -- Accessories
  ('Performance Gym Bag', 'performance-gym-bag', 'Spacious duffel with separate shoe compartment. Water-resistant bottom.', 65.00, null, (SELECT id FROM categories WHERE slug = 'accessories'), 'https://images.pexels.com/photos/4222441/pexels-photo-4222441.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/4222441/pexels-photo-4222441.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['One Size'], ARRAY['Black', 'Grey'], true, true),

  ('Luxe Yoga Mat', 'luxe-yoga-mat', '6mm thick premium yoga mat with alignment lines. Non-slip surface for hot yoga.', 55.00, null, (SELECT id FROM categories WHERE slug = 'accessories'), 'https://images.pexels.com/photos/4662439/pexels-photo-4662439.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/4662439/pexels-photo-4662439.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['One Size'], ARRAY['Black', 'Sage', 'Blush'], false, true),

  ('Resistance Band Set', 'resistance-band-set', 'Set of 5 resistance bands from light to extra heavy. Perfect for home workouts.', 28.00, null, (SELECT id FROM categories WHERE slug = 'accessories'), 'https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=800'], ARRAY['One Size'], ARRAY['Multi-color'], true, true)
ON CONFLICT (slug) DO NOTHING;

-- Create product variants for all products
INSERT INTO product_variants (product_id, size, color, sku, inventory)
SELECT 
  p.id,
  size,
  color,
  CONCAT(p.slug, '-', LOWER(REPLACE(size, ' ', '-')), '-', LOWER(REPLACE(color, ' ', '-'))) as sku,
  CASE 
    WHEN size = 'XS' THEN 15
    WHEN size = 'S' THEN 25
    WHEN size = 'M' THEN 35
    WHEN size = 'L' THEN 25
    WHEN size = 'XL' THEN 15
    WHEN size = '2XL' THEN 10
    ELSE 50
  END as inventory
FROM products p
CROSS JOIN LATERAL (
  SELECT unnest(p.sizes) as size
) s
CROSS JOIN LATERAL (
  SELECT unnest(p.colors) as color
) c
ON CONFLICT (sku) DO NOTHING;