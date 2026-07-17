/*
# Atomic order placement with inventory locking

Problem: CheckoutPage previously did three separate client-side calls
(insert order, insert order_items in a loop, update payment_status) with
no inventory check at all. `product_variants.inventory` existed but
nothing ever decremented it — two customers could both "buy" the last
unit of a size, and a crash between the three calls could leave a
half-created order.

Fix: a single SECURITY DEFINER function that, in one Postgres
transaction:
  1. Atomically decrements inventory for every line item using
     `UPDATE ... WHERE inventory >= quantity`, which relies on Postgres's
     normal row-locking — concurrent checkouts for the same variant
     serialize instead of racing. If a decrement affects zero rows
     (not enough stock), the function raises and the ENTIRE order rolls
     back, including any earlier decrements in the same request.
  2. Only then creates the order + order_items rows.

SECURITY DEFINER is required because product_variants intentionally has
no UPDATE policy for regular users (see initial_schema.sql) — inventory
should never be writable directly from the client. This function is the
one narrow, audited path allowed to touch it. auth.uid() still resolves
to the real calling user inside a SECURITY DEFINER function (it reads
the request JWT, not the Postgres role), so orders.user_id is set
correctly and can't be spoofed by a client-supplied parameter.
*/

CREATE OR REPLACE FUNCTION public.place_order(
  p_order_number text,
  p_subtotal numeric,
  p_tax numeric,
  p_shipping numeric,
  p_total numeric,
  p_shipping_address jsonb,
  p_billing_address jsonb,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_updated int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Decrement inventory for every line item BEFORE creating the order.
  -- If any item doesn't have enough stock, this raises and Postgres
  -- rolls back everything this function has done so far in this call.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE product_variants
    SET inventory = inventory - (v_item->>'quantity')::int
    WHERE id = (v_item->>'variant_id')::uuid
      AND inventory >= (v_item->>'quantity')::int;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      RAISE EXCEPTION 'insufficient_inventory:%', v_item->>'product_name';
    END IF;
  END LOOP;

  INSERT INTO orders (
    user_id, order_number, status, subtotal, tax, shipping, total,
    shipping_address, billing_address, payment_status
  )
  VALUES (
    auth.uid(), p_order_number, 'processing', p_subtotal, p_tax, p_shipping,
    p_total, p_shipping_address, p_billing_address, 'paid'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, product_id, variant_id, quantity, price, product_name, variant_info
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'variant_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric,
      v_item->>'product_name',
      v_item->'variant_info'
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(text, numeric, numeric, numeric, numeric, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text, numeric, numeric, numeric, numeric, jsonb, jsonb, jsonb) TO authenticated;
