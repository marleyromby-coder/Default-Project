-- FixMatch: reports of user content and hidden Naborabat groups (App Store guideline 1.2,
-- DSA art. 16). Run after 20261117120000_review_links.sql.
--
-- "Rapportér" in the app adds a row to content_reports: a review, a Naborabat group or a photo of
-- finished work, and why. Anyone can report, also without an account. Nobody can read the
-- reports through the app or the website (no select policy); FixMatch reads them in the
-- dashboard and looks at new ones within 24 hours on weekdays (docs/lancering/supabase.md).

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('review', 'group', 'photo')),
  -- The review's id, the group's id or the photo's path.
  target_id text not null check (char_length(target_id) between 1 and 200),
  reason text check (char_length(reason) <= 300),
  -- The signed-in user who reported it; empty without an account, or once the user is deleted.
  reporter uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index content_reports_created_idx on public.content_reports (created_at desc);

alter table public.content_reports enable row level security;

-- Nobody can report in someone else's name.
create policy "Anyone can report content" on public.content_reports
  for insert to anon, authenticated
  with check (reporter is null or reporter = (select auth.uid()));

-- Supabase gives anon and authenticated every privilege on new tables by default. They may only
-- add reports.
revoke all on public.content_reports from anon, authenticated;
grant insert on public.content_reports to anon, authenticated;

-- A group FixMatch has hidden after a report. It disappears from the app, the website and the
-- code; set hidden back to false to show it again.
alter table public.group_jobs add column hidden boolean not null default false;

drop policy "Open groups are public" on public.group_jobs;
create policy "Open groups are public" on public.group_jobs
  for select to anon, authenticated
  using (status in ('open', 'sent') and not hidden and created_at > now() - interval '90 days');

-- The same view as in 20261112120000_group_jobs.sql, with the same columns (the website reads
-- them), without hidden groups.
drop view public.open_group_jobs;
create view public.open_group_jobs with (security_invoker = false) as
  select g.id, g.code, g.country, g.postal_code, g.area, g.category, g.job, g.note,
         g.wanted_from, g.wanted_to, g.status, g.created_at,
         (select count(*) from public.group_members m where m.group_id = g.id)::integer as members
  from public.group_jobs g
  where g.status in ('open', 'sent') and not g.hidden and g.created_at > now() - interval '90 days';

-- Read only. The view runs as its owner, so anything more would bypass the table's policies.
revoke all on public.open_group_jobs from anon, authenticated;
grant select on public.open_group_jobs to anon, authenticated;

-- Nobody can join a hidden group with its code.
create or replace function public.join_group(p_code text) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in first' using errcode = '28000';
  end if;
  select id into gid from public.group_jobs where code = upper(trim(p_code)) and status = 'open' and not hidden;
  if gid is null then
    raise exception 'no open group with that code' using errcode = 'P0002';
  end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end;
$$;

revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.join_group(text) to authenticated;
