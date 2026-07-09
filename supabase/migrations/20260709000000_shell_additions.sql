/*
# Shell Additions for Solene

Adds the pieces needed for the shell build:
1. profiles table — captures email + phone at signup (source of truth for
   the future Google Sheets sync — see DEFERRED_TODO.md)
2. is_admin flag — used by the placeholder /admin route
3. coupons table — structure only, NOT wired to checkout yet (deferred)
4. orders.payment_status already exists; no change needed there
*/

-- Profiles: one row per authenticated user
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text,
  first_name text,
  last_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins need to read all orders for the /admin shell page.
-- NOTE: this policy trusts the is_admin flag on the CALLER's own profile row.
-- Fine for a shell; before real launch, revisit with a proper admin-role
-- check (e.g. custom JWT claim) rather than a client-readable table flag.
DROP POLICY IF EXISTS "admins_select_all_orders" ON orders;
CREATE POLICY "admins_select_all_orders" ON orders FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Coupons: structure only. NOT applied anywhere in checkout yet (deferred).
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_coupons" ON coupons;
CREATE POLICY "public_read_active_coupons" ON coupons FOR SELECT
  TO anon, authenticated USING (active = true);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
