-- "Naborabat": neighbours pool a job (gutters, boiler service, tyre change) so one business
-- does them all on the same day and gives a discount. Run after 20261111120000_work_photos.sql.
--
-- A group has a 6-letter code. Neighbours join with the code or from the list for their
-- postal code. Only the member count is public, never who the members are.

create table public.group_jobs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  country text not null check (country in ('DK', 'SE', 'NO', 'DE', 'GB')),
  postal_code text not null check (char_length(postal_code) between 3 and 10),
  -- The street or area, as the creator wrote it, so neighbours recognise it.
  area text not null check (char_length(trim(area)) between 2 and 60),
  category text not null check (char_length(category) between 2 and 30),
  job text not null check (char_length(job) between 2 and 40),
  note text check (char_length(note) <= 300),
  -- The period that suits the neighbours.
  wanted_from date not null,
  wanted_to date not null check (wanted_to >= wanted_from),
  status text not null default 'open' check (status in ('open', 'sent', 'done', 'closed'))
);

create index group_jobs_postal_idx on public.group_jobs (country, postal_code, created_at desc);

alter table public.group_jobs enable row level security;

create policy "Open groups are public" on public.group_jobs
  for select to anon, authenticated using (status in ('open', 'sent') and created_at > now() - interval '90 days');

create policy "Users create groups" on public.group_jobs
  for insert to authenticated with check ((select auth.uid()) = created_by);

create policy "Creators change their groups" on public.group_jobs
  for update to authenticated using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);

create table public.group_members (
  group_id uuid not null references public.group_jobs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Members see their own memberships" on public.group_members
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users join open groups" on public.group_members
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.group_jobs g where g.id = group_id and g.status = 'open')
  );

create policy "Members leave" on public.group_members
  for delete to authenticated using ((select auth.uid()) = user_id);

-- The creator is a member too.
create function public.add_creator_as_member() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.created_by) on conflict do nothing;
  return new;
end;
$$;

create trigger group_jobs_creator_member
  after insert on public.group_jobs
  for each row execute function public.add_creator_as_member();

-- What everyone sees: the group and how many are in, never who.
create view public.open_group_jobs with (security_invoker = false) as
  select g.id, g.code, g.country, g.postal_code, g.area, g.category, g.job, g.note,
         g.wanted_from, g.wanted_to, g.status, g.created_at,
         (select count(*) from public.group_members m where m.group_id = g.id)::integer as members
  from public.group_jobs g
  where g.status in ('open', 'sent') and g.created_at > now() - interval '90 days';

grant select on public.open_group_jobs to anon, authenticated;

-- Joins by code and returns the group id.
create function public.join_group(p_code text) returns uuid
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
  select id into gid from public.group_jobs where code = upper(trim(p_code)) and status = 'open';
  if gid is null then
    raise exception 'no open group with that code' using errcode = 'P0002';
  end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end;
$$;

revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.join_group(text) to authenticated;
