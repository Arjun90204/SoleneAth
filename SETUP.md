# Soléan — Shell Setup

## What's in this package
This is a **patch set**, not a full project — it contains only the files
that changed from your original Bolt export. Copy these files into your
existing project, overwriting the matching paths:

```
DEFERRED_TODO.md          → project root (NEW)
.env.example               → project root (NEW)
SETUP.md                   → project root (NEW, this file)
tailwind.config.js         → overwrite
index.html                 → overwrite
src/App.tsx                → overwrite
src/components/Header.tsx  → overwrite
src/components/Footer.tsx  → overwrite
src/context/AuthContext.tsx → overwrite
src/pages/AuthPage.tsx     → overwrite
src/pages/ProductPage.tsx  → overwrite
src/pages/CheckoutPage.tsx → overwrite
src/pages/AccountPage.tsx  → overwrite
src/pages/AdminPage.tsx    → NEW file
supabase/migrations/20260709000000_shell_additions.sql → NEW file
```

Everything else (CartPage, HomePage, CategoryPage, CartContext, Footer's
sibling components, database schema/seed migrations) is untouched — keep
your existing versions of those.

## Steps to get this running

1. **Remove Bolt entirely**
   ```
   rm -rf .bolt
   ```
   Also delete the "Open in Bolt" badge line from `README.md`.

2. **Copy the changed files above into your project**, overwriting as noted.

3. **Set up your `.env`**
   ```
   cp .env.example .env
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your
   Supabase project settings. Leave the TODO-marked variables commented
   out for now — they're placeholders for later phases.

4. **Run the new migration** against your Supabase project (via the SQL
   editor in the Supabase dashboard, or the Supabase CLI):
   ```
   supabase/migrations/20260709000000_shell_additions.sql
   ```
   This adds the `profiles` table (your signup tracker) and the `coupons`
   table shell. Run it *after* your existing `initial_schema.sql`,
   `update_prices_to_inr.sql`, and `seed_data.sql`.

5. **Manually flag yourself as admin** (one-time, via SQL editor), so you
   can view `/admin`:
   ```sql
   update profiles set is_admin = true where email = 'your-email@example.com';
   ```
   (You'll need to sign up through the app first so the row exists.)

6. **Install and run**
   ```
   npm install
   npm run dev
   ```

7. **Test the full loop**: sign up (check a `phone` value lands in the
   `profiles` table via Supabase dashboard) → browse → add to cart →
   checkout → "Simulate Payment" → confirm order appears on `/orders`
   and in `/admin`.

## What to do next
Open `DEFERRED_TODO.md` and work down the 🔴 BLOCKER list before touching
real customer money. That file is the single source of truth for what's
still fake in this build.
