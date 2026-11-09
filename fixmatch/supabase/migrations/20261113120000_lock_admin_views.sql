-- Supabase gives anon and authenticated access to every new view in public by default.
-- These two views are for FixMatch in the dashboard only. They already respect row level
-- security (security_invoker), so nothing leaked, but the app has no reason to read them.

revoke all on public.contacts_with_profile from anon, authenticated;
revoke all on public.business_signups_export from anon, authenticated;
