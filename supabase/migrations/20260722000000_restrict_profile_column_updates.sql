/*
# Fix: privilege escalation via unrestricted profile updates

CRITICAL FINDING (security test pass, 2026-07-22): the "update_own_profile"
RLS policy only restricts WHICH ROW a user can update (their own, via
`auth.uid() = id`) — it does not restrict WHICH COLUMNS. Since Supabase
grants blanket table-level UPDATE to `authenticated` by default, any
logged-in user could PATCH their own profiles row and set `is_admin = true`
directly via the REST API, with no app UI involved at all. This was
verified live: a fresh test account self-escalated to admin and immediately
gained visibility into another user's order, including their shipping
address, via the existing "admins can see all orders" RLS policy on
`orders`.

Fix: Postgres supports column-level privileges. Revoke blanket UPDATE on
profiles and grant it back only for the columns a user legitimately needs
to edit about themselves. Neither `is_admin` nor `email` (auth email should
change only through Supabase's own email-change flow, not a direct table
edit) are included. No app code was ever using the broader grant — a repo
search confirmed nothing calls `.update()` on `profiles` at all today; this
only closes a door that was never meant to be open.
*/

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (phone, first_name, last_name) ON profiles TO authenticated;
