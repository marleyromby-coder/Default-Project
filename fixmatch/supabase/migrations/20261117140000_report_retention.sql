-- FixMatch: when a report was handled, so it can be deleted 12 months later, as the privacy
-- policies promise. Run after 20261117130000_content_reports.sql. Safe to run more than once.
--
-- Set handled_at when you close a report in the Table Editor. Once a month, delete the reports
-- that were handled more than 12 months ago (docs/lancering/supabase.md → "Rapporter fra
-- brugere"):
--
--   delete from public.content_reports where handled_at < now() - interval '12 months';

alter table public.content_reports add column if not exists handled_at timestamptz;

create index if not exists content_reports_handled_idx on public.content_reports (handled_at)
  where handled_at is not null;

-- The app may still only add reports, and only with the columns it sends (reporter is filled in
-- by its default). Nobody outside the dashboard can set handled_at and so get a report deleted early.
revoke all on public.content_reports from anon, authenticated;
grant insert (kind, target_id, reason, reporter) on public.content_reports to anon, authenticated;
