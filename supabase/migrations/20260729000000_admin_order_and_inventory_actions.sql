/*
# Real admin actions: order status/payment updates, inventory editing

Upgrades /admin from a read-only shell to something actually usable:
admins can update an order's status/payment_status, and adjust a product
variant's stock count.

SECURITY NOTE: deliberately NOT implemented as a blanket "admins can
UPDATE orders/product_variants" RLS policy. A recent live security pass
found that a blanket-permission approach on `profiles` let any user
self-escalate to admin by writing to a column the policy never meant to
expose (see 20260722000000_restrict_profile_column_updates.sql). To avoid
the same class of mistake here, both actions are narrow SECURITY DEFINER
functions that: (a) check is_admin server-side on every call, (b) only
ever touch the exact columns named in this file, and (c) validate inputs
against a fixed allowed-value list rather than trusting arbitrary text.
Regular users are explicitly denied EXECUTE.
*/

CREATE OR REPLACE FUNCTION public.admin_update_order(
  p_order_id uuid,
  p_status text DEFAULT NULL,
  p_payment_status text DEFAULT NULL
)
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

  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'invalid_status:%', p_status;
  END IF;

  IF p_payment_status IS NOT NULL AND p_payment_status NOT IN ('pending', 'paid', 'refunded') THEN
    RAISE EXCEPTION 'invalid_payment_status:%', p_payment_status;
  END IF;

  UPDATE orders
  SET
    status = COALESCE(p_status, status),
    payment_status = COALESCE(p_payment_status, payment_status),
    updated_at = now()
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_order(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_order(uuid, text, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_update_inventory(
  p_variant_id uuid,
  p_inventory int
)
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

  IF p_inventory < 0 THEN
    RAISE EXCEPTION 'inventory_cannot_be_negative';
  END IF;

  UPDATE product_variants
  SET inventory = p_inventory
  WHERE id = p_variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'variant_not_found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_inventory(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_inventory(uuid, int) TO authenticated;
