-- FixMatch: the app and the website may only read the public views. Run after
-- 20261117140000_report_retention.sql. Safe to run more than once.
--
-- Supabase gives anon and authenticated every privilege on new tables and views in public by
-- default (see 20261113120000_lock_admin_views.sql). The public views below run as their owner
-- (security_invoker = false), so the table's row level security does not apply to them. A view
-- that reads one table is also updatable: before this file, anyone with the publishable key could
-- change or delete every shared price through shared_prices. The app and the website only ever
-- select from these views (they write to the tables, where the policies apply), so read is all
-- they get.
--
-- Views in public, from every migration up to this one:
--   read by the app or the website: shared_prices, public_reviews, review_summary, answer_rates,
--                                   open_group_jobs
--   for FixMatch in the dashboard:  contacts_with_profile, business_signups_export (no grants)
-- availability is a table with row level security, not a view. It is read by the app and the
-- "Ledig i dag" page and written only through set_availability and set_my_availability, so it is
-- locked to read the same way.

do $$
declare
  target text;
begin
  foreach target in array array['shared_prices', 'public_reviews', 'review_summary', 'answer_rates', 'open_group_jobs', 'availability']
  loop
    if to_regclass('public.' || target) is not null then
      execute format('revoke all on public.%I from anon, authenticated', target);
      execute format('grant select on public.%I to anon, authenticated', target);
    end if;
  end loop;

  foreach target in array array['contacts_with_profile', 'business_signups_export']
  loop
    if to_regclass('public.' || target) is not null then
      execute format('revoke all on public.%I from anon, authenticated', target);
    end if;
  end loop;

  -- A view added later without its own grants shows up here when this file is run again.
  for target in
    select distinct g.table_name
    from information_schema.role_table_grants g
    join information_schema.views v on v.table_schema = g.table_schema and v.table_name = g.table_name
    where g.table_schema = 'public'
      and g.grantee in ('anon', 'authenticated')
      and g.privilege_type <> 'SELECT'
  loop
    raise warning 'public.% lets anon or authenticated do more than read. Lock it like the views above.', target;
  end loop;
end
$$;
