/*
# Reliable profile capture on signup

Problem: profiles were being inserted client-side from AuthContext.tsx right
after supabase.auth.signUp(). That insert runs under RLS as the CURRENT
session. When email confirmation is required (Supabase default), signUp()
does not return an active session until the user clicks the confirmation
link, so auth.uid() is null at insert time and the RLS check on
insert_own_profile silently fails — the signup "succeeds" but no row is
ever written to profiles. Since profiles is the source of truth for the
email+phone signup tracker, this must not depend on session/email-confirm
timing at all.

Fix: capture phone/first_name/last_name as auth signup metadata (passed via
options.data in supabase.auth.signUp on the client) and populate profiles
via a SECURITY DEFINER trigger on auth.users, which runs with elevated
privileges regardless of session/confirmation state.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
