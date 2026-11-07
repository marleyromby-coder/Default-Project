-- "Min virksomhed": the business's own page in the app.
--
-- A business owner signs in with a normal FixMatch account and links it to the business with
-- the personal code from "Hvem har tid i dag?" (issue_business_key in …_availability.sql).
-- Linked owners can see who called them through FixMatch, mark free time and ask FixMatch to
-- change their prices, opening hours and texts. Run this after 20261108120000_availability.sql.

create table public.business_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null check (char_length(business_id) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

alter table public.business_members enable row level security;

create policy "Owners see their own links" on public.business_members
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Owners can unlink themselves" on public.business_members
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.is_business_member(p_business_id text) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.user_id = auth.uid() and m.business_id = p_business_id
  );
$$;

revoke execute on function public.is_business_member(text) from public, anon;
grant execute on function public.is_business_member(text) to authenticated;

-- Links the signed-in user to the business when the code is right.
create function public.claim_business(p_business_id text, p_key text) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in first' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.business_keys k
    where k.business_id = p_business_id and k.key_hash = extensions.crypt(p_key, k.key_hash)
  ) then
    raise exception 'wrong business id or key' using errcode = '28000';
  end if;
  insert into public.business_members (user_id, business_id)
  values (auth.uid(), p_business_id)
  on conflict do nothing;
end;
$$;

revoke execute on function public.claim_business(text, text) from public, anon;
grant execute on function public.claim_business(text, text) to authenticated;

-- Free time from the app, for linked owners (same rules as set_availability).
create function public.set_my_availability(p_business_id text, p_days date[]) returns date[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  kept date[];
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'not your business' using errcode = '42501';
  end if;
  select coalesce(array_agg(distinct d order by d), '{}')
    into kept
    from unnest(coalesce(p_days, '{}')) as d
   where d between current_date - 1 and current_date + 2;
  insert into public.availability (business_id, available_on, updated_at)
  values (p_business_id, kept, now())
  on conflict (business_id) do update set available_on = excluded.available_on, updated_at = now();
  return kept;
end;
$$;

revoke execute on function public.set_my_availability(text, date[]) from public, anon;
grant execute on function public.set_my_availability(text, date[]) to authenticated;

-- Who contacted the business through FixMatch in the last 90 days: the name and number the
-- customer agreed to share with the businesses they call (privacy policy, section 7).
create function public.business_contacts(p_business_id text)
returns table (created_at timestamptz, channel text, name text, phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'not your business' using errcode = '42501';
  end if;
  return query
    select c.created_at, c.channel, p.name, p.phone
    from public.contacts c
    left join public.profiles p on p.id = c.user_id
    where c.business_id = p_business_id and c.created_at > now() - interval '90 days'
    order by c.created_at desc
    limit 300;
end;
$$;

revoke execute on function public.business_contacts(text) from public, anon;
grant execute on function public.business_contacts(text) to authenticated;

-- The monthly summary: contacts per month for the last 12 months, Danish time.
create function public.business_month_summary(p_business_id text)
returns table (month date, calls integer, messages integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'not your business' using errcode = '42501';
  end if;
  return query
    select date_trunc('month', c.created_at at time zone 'Europe/Copenhagen')::date as month,
           count(*) filter (where c.channel = 'call')::integer as calls,
           count(*) filter (where c.channel <> 'call')::integer as messages
    from public.contacts c
    where c.business_id = p_business_id and c.created_at > now() - interval '12 months'
    group by 1
    order by 1 desc;
end;
$$;

revoke execute on function public.business_month_summary(text) from public, anon;
grant execute on function public.business_month_summary(text) to authenticated;

-- Changes the business asks for. FixMatch checks them and puts them in live-businesses.json.
create table public.business_change_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_id text not null check (char_length(business_id) between 1 and 120),
  user_id uuid references auth.users (id) on delete set null,
  changes jsonb not null check (jsonb_typeof(changes) = 'object' and pg_column_size(changes) < 20000),
  status text not null default 'new' check (status in ('new', 'applied', 'rejected'))
);

alter table public.business_change_requests enable row level security;

create policy "Owners ask for changes to their business" on public.business_change_requests
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_business_member(business_id) and status = 'new');

create policy "Owners see their own requests" on public.business_change_requests
  for select to authenticated using ((select auth.uid()) = user_id);
