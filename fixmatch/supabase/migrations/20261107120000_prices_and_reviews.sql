-- FixMatch: what users paid (shared prices) and reviews from real calls.
-- Both only make sense from a user who contacted the business through FixMatch, which the
-- contacts table proves. Run after the earlier migrations (docs/lancering/supabase.md).

-- Shared prices: "Del, hvad du betalte". Anonymous for everyone but the user: the price reports
-- are read without user_id through the view below. No photos are stored.
create table public.price_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null check (char_length(business_id) between 1 and 120),
  country text not null default 'DK' check (country in ('DK', 'SE', 'NO', 'DE', 'GB')),
  category text not null check (char_length(category) between 1 and 40),
  job text not null check (char_length(job) between 1 and 60),
  -- What the user paid, including VAT, in the country's currency; whole units.
  total integer not null check (total between 1 and 10000000),
  -- The labour part when the invoice shows it (needed for the tax deduction).
  labour integer check (labour between 0 and 10000000),
  quantity integer not null default 1 check (quantity between 1 and 10000),
  -- Only the first two digits of the postal code, so a report never points at a street.
  postal_area text not null check (postal_area ~ '^[0-9A-Z]{1,2}$'),
  paid_on date not null check (paid_on <= current_date),
  created_at timestamptz not null default now(),
  -- One report per user, business and job.
  unique (user_id, business_id, job)
);

create index price_reports_job_idx on public.price_reports (country, category, job, paid_on desc);

alter table public.price_reports enable row level security;

-- Only users who contacted the business through FixMatch can report what they paid it.
create policy "Users report what they paid a business they contacted" on public.price_reports
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.contacts c where c.user_id = (select auth.uid()) and c.business_id = price_reports.business_id)
  );
create policy "Users read their own price reports" on public.price_reports
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users update their own price reports" on public.price_reports
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own price reports" on public.price_reports
  for delete to authenticated using ((select auth.uid()) = user_id);

-- What the app reads: the reports without who made them. security_definer so the publishable
-- key can read every row through the view, never the table.
create view public.shared_prices with (security_invoker = false) as
  select business_id, country, category, job, total, labour, quantity, postal_area, paid_on
  from public.price_reports
  where paid_on >= current_date - interval '24 months';

grant select on public.shared_prices to anon, authenticated;

-- Reviews from real calls: only users who contacted the business through FixMatch can review
-- it, once each. The contact is the proof that they were a customer (markedsføringslovens § 6 b).
create table public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null check (char_length(business_id) between 1 and 120),
  rating smallint not null check (rating between 1 and 5),
  text text check (char_length(text) <= 500),
  -- What the review is about, so it can be filtered: the job done, when known.
  job text check (char_length(job) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Hidden by the team after a report (DSA art. 16); never deleted silently.
  hidden boolean not null default false,
  unique (user_id, business_id)
);

create index reviews_business_idx on public.reviews (business_id, created_at desc);

alter table public.reviews enable row level security;

create policy "Users review a business they contacted" on public.reviews
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.contacts c where c.user_id = (select auth.uid()) and c.business_id = reviews.business_id)
  );
create policy "Users read their own reviews" on public.reviews
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users update their own reviews" on public.reviews
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own reviews" on public.reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

-- What the app reads: the first name's initial stands for the reviewer, never the name.
create view public.public_reviews with (security_invoker = false) as
  select r.id, r.business_id, r.rating, r.text, r.job, r.created_at,
    upper(left(coalesce(p.name, ''), 1)) as initial
  from public.reviews r
  left join public.profiles p on p.id = r.user_id
  where not r.hidden;

grant select on public.public_reviews to anon, authenticated;

-- A business's rating at a glance: average and count.
create view public.review_summary with (security_invoker = false) as
  select business_id, round(avg(rating)::numeric, 2) as average, count(*)::integer as reviews
  from public.reviews
  where not hidden
  group by business_id;

grant select on public.review_summary to anon, authenticated;
