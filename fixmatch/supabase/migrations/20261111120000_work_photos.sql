-- Photos of finished work on a business's profile, uploaded by the business from
-- "Min virksomhed". Run after 20261110120000_call_answers.sql.
--
-- The files live in the public storage bucket "work-photos" under <business id>/<file>.
-- Only linked owners (business_members) may add or remove files for their business.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work-photos', 'work-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "Work photos are public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'work-photos');

create policy "Owners add work photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'work-photos' and public.is_business_member(split_part(name, '/', 1)));

create policy "Owners remove work photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'work-photos' and public.is_business_member(split_part(name, '/', 1)));

-- The order and public address of each photo. At most 6 per business (checked by the app;
-- the trigger below keeps it so even if the app is wrong).
create table public.business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id text not null check (char_length(business_id) between 1 and 120),
  url text not null check (url ~ '^https://'),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create index business_photos_business_idx on public.business_photos (business_id, sort);

alter table public.business_photos enable row level security;

create policy "Work photos are public" on public.business_photos
  for select to anon, authenticated using (true);

create policy "Owners add work photos" on public.business_photos
  for insert to authenticated with check (public.is_business_member(business_id));

create policy "Owners remove work photos" on public.business_photos
  for delete to authenticated using (public.is_business_member(business_id));

grant select on public.business_photos to anon, authenticated;

create function public.limit_business_photos() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.business_photos where business_id = new.business_id) >= 6 then
    raise exception 'at most 6 photos per business' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger business_photos_limit
  before insert on public.business_photos
  for each row execute function public.limit_business_photos();
