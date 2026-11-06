-- FixMatch: the free Verificeret badge (src/lib/verification.ts).
-- A business asks for the badge when it signs up. The team checks the CVR register, the owner,
-- Sikkerhedsstyrelsen's authorisation register, the insurance and the guarantee scheme, and then
-- fills in the columns verificeret (date) and verificeret_tjek in the import CSV.

alter table public.business_signups
  add column verification_requested boolean not null default false,
  add column authorization_number text check (char_length(authorization_number) <= 40),
  add column insurer text check (char_length(insurer) <= 120),
  add column guarantee_scheme text check (char_length(guarantee_scheme) <= 120);

-- The same export as before, with the verification columns at the end. verificeret and
-- verificeret_tjek stay empty until the team has made the checks; verificering_oensket says
-- what the business sent in.
create or replace view public.business_signups_export with (security_invoker = true) as
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
    contact_name || coalesce(', ' || contact_role, '') || ' (selvbetjent ' || source || ', ' || id || ')' as samtykke_kontakt,
    '' as verificeret,
    '' as verificeret_tjek,
    case
      when verification_requested then concat_ws('; ', 'Ønsker Verificeret', 'aut.nr. ' || authorization_number,
        'forsikring: ' || insurer, 'garanti: ' || guarantee_scheme)
      else ''
    end as verificering_oensket
  from public.business_signups
  where status = 'new'
  order by created_at;
