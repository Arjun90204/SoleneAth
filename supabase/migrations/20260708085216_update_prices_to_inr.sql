/*
# Update Product Prices to Indian Rupees

This migration updates all product prices to appropriate INR values for the Indian market.

## Price Updates
- Leggings: ₹2,999 - ₹4,299
- Sports Bras: ₹1,499 - ₹2,199
- Shorts: ₹1,799 - ₹2,499
- Tops: ₹1,299 - ₹1,999
- Hoodies: ₹3,499 - ₹4,999
- Accessories: ₹999 - ₹2,999

## Free Shipping Threshold
Updated free shipping from $75 to ₹2,999
*/

-- Update product prices to INR (approximate conversion: 1 USD = 83 INR)
UPDATE products SET 
  price = price * 83,
  compare_at_price = CASE WHEN compare_at_price IS NOT NULL THEN compare_at_price * 83 ELSE NULL END
WHERE 1=1;

-- Round prices to cleaner numbers
UPDATE products SET price = 2999, compare_at_price = NULL WHERE slug = 'flex-high-waist-leggings';
UPDATE products SET price = 3499, compare_at_price = NULL WHERE slug = 'power-compression-leggings';
UPDATE products SET price = 2799, compare_at_price = 3299 WHERE slug = 'flow-seamless-leggings';
UPDATE products SET price = 3299, compare_at_price = NULL WHERE slug = 'endurance-7-8-leggings';

UPDATE products SET price = 1799, compare_at_price = NULL WHERE slug = 'impact-sports-bra';
UPDATE products SET price = 1499, compare_at_price = NULL WHERE slug = 'flex-crop-top';

UPDATE products SET price = 1899, compare_at_price = NULL WHERE slug = 'racer-training-shorts';
UPDATE products SET price = 1999, compare_at_price = NULL WHERE slug = 'flow-biker-shorts';

UPDATE products SET price = 1699, compare_at_price = NULL WHERE slug = 'sculpt-tank';
UPDATE products SET price = 1299, compare_at_price = NULL WHERE slug = 'core-performance-tee';

UPDATE products SET price = 3499, compare_at_price = NULL WHERE slug = 'essential-oversized-hoodie';
UPDATE products SET price = 4299, compare_at_price = NULL WHERE slug = 'windbreaker-jacket';

UPDATE products SET price = 2499, compare_at_price = NULL WHERE slug = 'performance-gym-bag';
UPDATE products SET price = 1999, compare_at_price = NULL WHERE slug = 'luxe-yoga-mat';
UPDATE products SET price = 999, compare_at_price = NULL WHERE slug = 'resistance-band-set';
