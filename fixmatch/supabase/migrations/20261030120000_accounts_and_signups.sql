-- FixMatch: user accounts, contacts and businesses' own sign-ups.
-- Run once in the Supabase project (SQL Editor → New query → paste → Run),
-- see docs/lancering/supabase.md. Every table has row level security, so the app's
-- publishable key can only do what the policies below allow.

-- Profiles: the name and phone number a business sees when you contact it.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users create their own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Contacts: who contacted which business and how. Businesses get these (with the
-- caller's name and phone number) through FixMatch, so they know who they deal with.
create table public.contacts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null check (char_length(business_id) between 1 and 120),
  channel text not null check (channel in ('call', 'email', 'message')),
  created_at timestamptz not null default now()
);

create index contacts_business_id_idx on public.contacts (business_id, created_at desc);

alter table public.contacts enable row level security;

create policy "Users log their own contacts" on public.contacts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read their own contacts" on public.contacts
  for select to authenticated using ((select auth.uid()) = user_id);

-- For the team: every contact with the user's name and phone number, newest first.
create view public.contacts_with_profile with (security_invoker = true) as
  select c.created_at, c.business_id, c.channel, p.name, p.phone
  from public.contacts c
  left join public.profiles p on p.id = c.user_id
  order by c.created_at desc;

-- Deleting your account deletes the profile and contacts too (on delete cascade).
-- Required by App Store Review Guideline 5.1.1(v).
create function public.delete_account() returns void
  language sql
  security definer
  set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- Business sign-ups: a business fills in its details and gives its consent itself, in the
-- app or on the website. The consent is stored with the time it was given. Nobody can read
-- the sign-ups with the publishable key; the team reads them in the Supabase dashboard.
create table public.business_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'published', 'rejected')),
  source text not null check (source in ('app', 'web')),
  language text not null default 'da' check (language in ('da', 'en')),

  country text not null check (country in ('DK', 'SE', 'NO', 'DE', 'GB')),
  company_name text not null check (char_length(trim(company_name)) between 2 and 120),
  registry_number text not null check (char_length(trim(registry_number)) between 4 and 30),
  trades text[] not null check (cardinality(trades) between 1 and 8),
  street text not null check (char_length(street) <= 120),
  postal_code text not null check (char_length(postal_code) between 3 and 10),
  city text not null check (char_length(city) between 1 and 80),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  website text check (char_length(website) <= 200),
  hourly_min integer not null check (hourly_min > 0),
  hourly_max integer not null check (hourly_max >= hourly_min),
  callout_fee integer check (callout_fee >= 0),
  opening_hours text check (char_length(opening_hours) <= 200),
  emergency boolean not null default false,
  description text check (char_length(description) <= 500),

  contact_name text not null check (char_length(trim(contact_name)) between 2 and 100),
  contact_role text check (char_length(contact_role) <= 80),
  -- The exact statements the business agreed to, and the version of the wording.
  consent jsonb not null,
  consent_version text not null,
  check ((consent ->> 'listing')::boolean and (consent ->> 'accurate')::boolean and (consent ->> 'authority')::boolean)
);

alter table public.business_signups enable row level security;

create policy "Anyone can sign up a business" on public.business_signups
  for insert to anon, authenticated with check (status = 'new');

-- The sign-ups in the columns of templates/virksomheder-skabelon.csv. In the dashboard:
-- Table Editor → business_signups_export → Export → CSV, then
-- npm run import:businesses -- ~/Downloads/business_signups_export_rows.csv
create view public.business_signups_export with (security_invoker = true) as
  select
    company_name as navn,
    array_to_string(trades, '|') as kategorier,
    country as land,
    registry_number as cvr,
    left(coalesce(description, ''), 80) as kort_beskrivelse,
    coalesce(description, '') as beskrivelse,
    street as adresse,
    postal_code as postnummer,
    city as "by",
    '' as breddegrad,
    '' as laengdegrad,
    phone as telefon,
    coalesce(website, '') as hjemmeside,
    email,
    hourly_min as timepris_min,
    hourly_max as timepris_max,
    coalesce(callout_fee::text, '') as koerselsgebyr,
    '' as prisexempler,
    to_char(created_at at time zone 'UTC', 'YYYY-MM-DD') as priser_opdateret,
    '' as autorisationer,
    '' as medlemskaber,
    '' as ydelser,
    coalesce(opening_hours, '') as aabningstider,
    case when emergency then 'ja' else 'nej' end as doegnvagt,
    '' as svartid,
    '' as etableret,
    '' as ansatte,
    '' as koereradius_km,
    '' as billede,
    'nej' as annonce,
    to_char(created_at at time zone 'UTC', 'YYYY-MM-DD') as samtykke_dato,
    contact_name || coalesce(', ' || contact_role, '') || ' (selvbetjent ' || source || ', ' || id || ')' as samtykke_kontakt
  from public.business_signups
  where status = 'new'
  order by created_at;
