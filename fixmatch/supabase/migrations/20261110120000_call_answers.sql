-- "Fik du fat i dem?": after a call through FixMatch the user says whether anyone answered.
-- The answers give each business its answer rate ("Tager telefonen 9 ud af 10 gange").
-- Run after 20261109120000_business_accounts.sql.

create table public.call_answers (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null check (char_length(business_id) between 1 and 120),
  answered boolean not null,
  created_at timestamptz not null default now()
);

create index call_answers_business_idx on public.call_answers (business_id);

alter table public.call_answers enable row level security;

-- Only users who actually called the business through FixMatch can answer, and only about
-- a call from the last day. Nobody reads the single answers; the rate below is public.
create policy "Callers answer about their own calls" on public.call_answers
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.contacts c
      where c.user_id = (select auth.uid())
        and c.business_id = call_answers.business_id
        and c.created_at > now() - interval '1 day'
    )
  );

create policy "Users read their own answers" on public.call_answers
  for select to authenticated using ((select auth.uid()) = user_id);

-- One row per business over the last 12 months. The app shows a rate from 5 answers.
create view public.answer_rates with (security_invoker = false) as
  select business_id,
         count(*) filter (where answered)::integer as answered,
         count(*)::integer as total
  from public.call_answers
  where created_at > now() - interval '12 months'
  group by business_id;

grant select on public.answer_rates to anon, authenticated;
