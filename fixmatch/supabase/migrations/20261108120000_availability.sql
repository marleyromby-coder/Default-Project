-- "Hvem har tid i dag?": a business marks that it has free time today or tomorrow.
--
-- Businesses have no FixMatch login yet, so each one gets a personal key (a long random code).
-- The business opens fixmatchh.netlify.app/ledig/ with its link and taps "Ledig i dag". Only
-- the hash of the key is stored. FixMatch issues keys in the SQL Editor:
--
--   select public.issue_business_key('fjordvand-vvs');
--
-- That returns the key once; send the link from docs/lancering/supabase.md to the business.

create extension if not exists pgcrypto with schema extensions;

create table public.business_keys (
  business_id text primary key,
  key_hash text not null,
  created_at timestamptz not null default now()
);

-- No policies: nobody can read or write the keys from the app or the website.
alter table public.business_keys enable row level security;

create table public.availability (
  business_id text primary key,
  -- The days the business has free time, in its own time zone. Old days are simply ignored.
  available_on date[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.availability enable row level security;

-- Everyone may see who has free time; nobody may write directly (only through set_availability).
create policy "availability is public" on public.availability for select to anon, authenticated using (true);
grant select on public.availability to anon, authenticated;

-- Makes (or replaces) a business's key and returns it once. Only for FixMatch in the SQL Editor.
create function public.issue_business_key(p_business_id text) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_key text := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_');
begin
  if p_business_id is null or length(p_business_id) < 2 then
    raise exception 'business id is missing';
  end if;
  insert into public.business_keys (business_id, key_hash)
  values (p_business_id, extensions.crypt(new_key, extensions.gen_salt('bf')))
  on conflict (business_id) do update set key_hash = excluded.key_hash, created_at = now();
  return new_key;
end;
$$;

revoke execute on function public.issue_business_key(text) from public, anon, authenticated;

-- The business marks its free days. Only days from yesterday to two days ahead are kept, so a
-- wrong clock cannot mark a whole month. An empty list means "no free time".
create function public.set_availability(p_business_id text, p_key text, p_days date[]) returns date[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  kept date[];
begin
  if not exists (
    select 1 from public.business_keys k
    where k.business_id = p_business_id and k.key_hash = extensions.crypt(p_key, k.key_hash)
  ) then
    raise exception 'wrong business id or key' using errcode = '28000';
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

revoke execute on function public.set_availability(text, text, date[]) from public;
grant execute on function public.set_availability(text, text, date[]) to anon, authenticated;
