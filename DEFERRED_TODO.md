# SOLÉAN — Deferred Items (MUST resolve before real launch)

This file exists so nothing gets silently forgotten while we build the shell.
Every item below is currently a placeholder, mock, or missing entirely.
**Do not accept real customer payments until every "BLOCKER" item is checked off.**

---

## 🔴 BLOCKERS — cannot go live without these

- [ ] **Payment gateway**: Razorpay is currently MOCKED in `CheckoutPage.tsx`
      (search for `// TODO: REAL RAZORPAY`). Needs live business account,
      KYC-approved keys, and a real webhook handler with signature verification.
- [ ] **Shipping/courier integration**: no Shiprocket/Delhivery/etc connection.
      No pincode serviceability check, no label generation, no tracking numbers.
- [ ] **Returns/exchange workflow**: footer promises "15-day returns" but there
      is no actual flow — no return request form, no pickup scheduling, no
      refund trigger.
- [ ] **COD decision**: prepaid-only right now. Decide if Cash on Delivery is
      offered, and if so, build the fraud/RTO handling for it.
- [ ] **Legal pages**: Terms of Service, Privacy Policy (DPDP Act 2023
      compliant), Refund/Cancellation Policy, Shipping Policy are all just
      footer links to `#` right now. Needs real content + lawyer review.
- [ ] **Trademark check**: confirm "Soléan" isn't already registered for
      apparel in India (Trademark Registry search).

## 🟠 IMPORTANT — will hurt badly if skipped

- [ ] **Real admin dashboard**: `/admin` is currently a bare read-only shell.
      No order status updates, no refund issuing, no inventory editing.
- [ ] **Receipt emails**: `CheckoutPage.tsx` does not currently send anything.
      Needs Supabase Edge Function + Resend/SendGrid on payment confirmation,
      plus a stored business-copy in Supabase Storage.
- [ ] **Signup → Google Sheets sync**: `profiles` table captures email/phone
      correctly now, but nothing pushes it to a live Google Sheet yet. Needed:
      Postgres trigger → Edge Function → Sheets API (service account).
- [ ] **Coupon codes**: signup banner promises "15% off first order" — no
      discount code system exists to redeem it.
- [ ] **WhatsApp/SMS order updates**: email-only right now.
- [ ] **Size guide**: no size chart component anywhere on product pages.
- [ ] **Error/uptime monitoring**: no Sentry or equivalent wired in.
- [ ] **Staging environment**: currently one Supabase project for everything —
      need a separate staging project before go-live testing with real data.

## 🟡 NICE TO HAVE — post-launch fine

- [ ] Wishlist
- [ ] Product reviews/ratings
- [ ] Abandoned cart recovery emails
- [ ] Loyalty/referral program
- [ ] Order detail page (`/orders/:id`) — `/account` now links to the
      `/orders` list instead of a per-order detail page (bug fix applied
      in shell build; real detail page still not built)

---

## What IS real and working in the shell

- Supabase Auth (signup/login/session) — fully functional
- `profiles` table capturing email + phone on signup — fully functional via
  a DB trigger (`handle_new_user`), verified end-to-end against a live
  Supabase project
- Cart, RLS policies, checkout form UI — fully functional, verified
  end-to-end: signup → browse → add to cart → checkout → simulated payment
  → order visible on `/orders` and `/admin`
- Product/category browsing, filtering, sorting — fully functional
- GST calculation (18%) — fully functional (rate is currently hardcoded,
  confirm this is correct for your product HSN codes before launch)
- Admin shell (`/admin`) — verified showing all orders across users when
  `is_admin = true`
- Product search (`/search?q=`) — queries name + description against
  Postgres, wired to the header's search icon
- **Inventory oversell locking** — `place_order()` (see
  `supabase/migrations/20260714000000_atomic_place_order.sql`) atomically
  decrements `product_variants.inventory` for every line item inside the
  same transaction that creates the order. If any item doesn't have
  enough stock, the whole order (including any decrements already made
  in that call) rolls back and the customer sees a friendly "just sold
  out" message. Verified by forcing a variant to 1 unit, attempting a
  2-unit purchase (rejected, zero side effects), then a 1-unit purchase
  (succeeded, inventory hit exactly 0).
  - **Still deferred**: this decrements at order-creation time, which is
    correct for the current instant-mock payment flow. Once real
    Razorpay is wired up (async payment), you'll need a matching
    "release the reservation if payment fails or times out" mechanism —
    otherwise abandoned checkouts permanently lock stock. Revisit this
    when building the real payment integration.

## Rebrand (2026-07-13): Soléan, white/teal theme

Renamed from Solène to **Soléan** across every user-facing string (logos,
page title, meta tags, README/SETUP docs) and flipped the entire visual
theme from black-background/rose-accent to a white-background/teal-accent
look (`tailwind.config.js`'s `rose` key was replaced with a `teal` ramp).
The black announcement bar at the very top and white-text-on-photo
treatments (hero images, category card overlays) were kept deliberately —
those sit on dark backgrounds independent of the page theme. If you bring
on a designer later, flag this as the current baseline so they don't
"fix" the announcement bar back to white by mistake.

## Bugs found and fixed during shell verification (2026-07-09)

Beyond the bugs already fixed in the original shell patch, live end-to-end
testing against a real Supabase project surfaced and fixed:

- **Profile capture was silently failing.** The original client-side
  `profiles` insert ran under RLS as the current session, which doesn't
  exist until email confirmation completes — so every signup's phone
  number was being dropped. Fixed with a `SECURITY DEFINER` trigger on
  `auth.users` (`supabase/migrations/20260709010000_profile_trigger.sql`)
  that reads signup metadata and writes the profile row server-side,
  regardless of session/confirmation timing.
- **Checkout redirect race.** `CheckoutPage` cleared the cart before
  navigating to the success page; the cart-state update re-triggered the
  page's own "redirect to /cart if empty" effect, which won the race and
  bounced paying customers to an empty-bag page instead of their order
  confirmation. Fixed by navigating first, then clearing the cart.
- **Stale `loading` flag in `CartContext`.** `loading` was only ever set
  back to `false`, never reset to `true` when a new fetch started, and the
  reset also lived inside a `useEffect` — one render behind other contexts
  reacting to the same auth-state change. Any consumer gating on cart
  `loading` (e.g. the checkout redirect) could read a stale "not loading"
  signal. Fixed by resetting `loading` synchronously during render when
  the signed-in user changes (React's documented pattern for this).
- **CheckoutPage didn't wait for auth to resolve.** On a direct/reloaded
  visit to `/checkout`, `user` starts `null` for one render while
  `AuthContext` resolves its session — the page's effect read that as
  "not logged in" and bounced straight to `/login`. Fixed by gating on
  `authLoading` as well.
- **Checkout email field defaulted to blank.** `formData.email` was
  initialized from `user?.email` once at mount, before auth had resolved,
  so it stayed empty even after login. Fixed with an effect that fills it
  in once the user becomes available, without overwriting manual edits.

These were caught by actually driving the app end-to-end against a live
database, not by typechecking/linting alone — worth remembering as more
flows (Razorpay, receipts, admin actions) get built: any page that gates
behavior on `useAuth()`/`useCart()` state in a `useEffect` needs to account
for the loading window, not just the final resolved value.

## More bugs found and fixed (2026-07-17): inventory locking + high-traffic prep

- **`OrdersPage` had an N+1 query.** It fetched all orders, then fetched
  each order's items in a separate query inside `.map()` — one query
  becomes 1+N as order history grows, which gets expensive fast under
  real traffic. Fixed by embedding `order_items` in the same query
  (`select('*, items:order_items(*)')`) so Postgres does the join in a
  single round-trip.
- **Checkout error messages were silently wrong.** `CheckoutPage` did
  `err instanceof Error ? err.message : 'Failed to place order'` — but
  `supabase.rpc()`/`.from()` errors are plain `PostgrestError` objects,
  not `Error` instances, so that check was always false and every
  failure (including the friendly out-of-stock message) collapsed to
  the generic fallback. Fixed by also checking for a `message` property
  on the error object directly. Worth checking any other catch block
  that does `err instanceof Error` after a Supabase call.

---
*Last updated: shell build phase, post end-to-end verification. Update this
file every time you defer something new, and delete lines as items get
genuinely finished.*
