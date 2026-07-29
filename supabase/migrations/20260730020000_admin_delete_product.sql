/*
# Admin delete product

Completes the product-management admin capability with a real delete path.
Direct REST DELETE against `products` correctly fails closed today (no RLS
policy permits it) — this RPC is the sanctioned way to do it instead, same
SECURITY DEFINER + is_admin-check pattern as every other admin write path
in this app.

Relies on existing FK behavior for cleanup: product_variants cascades
(ON DELETE CASCADE), cart_items cascades (removes stale cart entries for
the deleted product), order_items keeps history (ON DELETE SET NULL —
product_name/price/variant_info are already snapshotted on the order_items
row, so past orders still display correctly after the product is gone).
*/

CREATE OR REPLACE FUNCTION public.admin_delete_product(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  DELETE FROM products WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_product(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_product(uuid) TO authenticated;
