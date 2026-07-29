/*
# Admin product management: create/edit products + auto-sync variants

Adds a third real admin capability alongside order management and
inventory editing: creating new products and editing existing ones.

Same pattern as 20260729000000_admin_order_and_inventory_actions.sql:
SECURITY DEFINER, explicit is_admin check, no blanket RLS write policy on
products/product_variants. A blanket policy is exactly what caused the
2026-07-22 privilege-escalation bug on profiles, so every admin write path
in this app goes through a narrow function instead.

admin_upsert_product() also creates any missing size x color variant combo
on save (mirrors the seed data's CROSS JOIN pattern), so a newly created
product immediately has variants to set stock on via the Inventory tab.
Existing variants are left untouched on every save — re-saving a product
never wipes out inventory someone already set.
*/

CREATE OR REPLACE FUNCTION public.admin_upsert_product(
  p_product_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_slug text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_compare_at_price numeric DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_images text[] DEFAULT '{}',
  p_sizes text[] DEFAULT '{}',
  p_colors text[] DEFAULT '{}',
  p_featured boolean DEFAULT false,
  p_in_stock boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'name_required';
  END IF;
  IF p_slug IS NULL OR length(trim(p_slug)) = 0 THEN
    RAISE EXCEPTION 'slug_required';
  END IF;
  IF p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;
  IF p_compare_at_price IS NOT NULL AND p_compare_at_price <= p_price THEN
    RAISE EXCEPTION 'compare_at_price_must_exceed_price';
  END IF;
  IF array_length(p_sizes, 1) IS NULL THEN
    RAISE EXCEPTION 'at_least_one_size_required';
  END IF;
  IF array_length(p_colors, 1) IS NULL THEN
    RAISE EXCEPTION 'at_least_one_color_required';
  END IF;

  IF p_product_id IS NULL THEN
    INSERT INTO products (
      name, slug, description, price, compare_at_price, category_id,
      image_url, images, sizes, colors, featured, in_stock
    ) VALUES (
      p_name, p_slug, p_description, p_price, p_compare_at_price, p_category_id,
      p_image_url, p_images, p_sizes, p_colors, p_featured, p_in_stock
    )
    RETURNING id INTO v_product_id;
  ELSE
    UPDATE products SET
      name = p_name,
      slug = p_slug,
      description = p_description,
      price = p_price,
      compare_at_price = p_compare_at_price,
      category_id = p_category_id,
      image_url = p_image_url,
      images = p_images,
      sizes = p_sizes,
      colors = p_colors,
      featured = p_featured,
      in_stock = p_in_stock
    WHERE id = p_product_id
    RETURNING id INTO v_product_id;

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;
  END IF;

  INSERT INTO product_variants (product_id, size, color, sku, inventory)
  SELECT
    v_product_id,
    s.size,
    c.color,
    CONCAT(p_slug, '-', lower(replace(s.size, ' ', '-')), '-', lower(replace(c.color, ' ', '-'))),
    0
  FROM unnest(p_sizes) AS s(size)
  CROSS JOIN unnest(p_colors) AS c(color)
  ON CONFLICT (sku) DO NOTHING;

  RETURN v_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_upsert_product(uuid, text, text, text, numeric, numeric, uuid, text, text[], text[], text[], boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_product(uuid, text, text, text, numeric, numeric, uuid, text, text[], text[], text[], boolean, boolean) TO authenticated;
