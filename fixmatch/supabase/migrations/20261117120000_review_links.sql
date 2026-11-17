-- FixMatch: links to a business's own profiles on other review sites (src/lib/review-links.ts).
-- FixMatch dropped its plan to show scores from Trustpilot (17 Nov 2026). The ranking uses only
-- FixMatch's own reviews (review_summary, unchanged). A business may still give plain links to
-- its profiles elsewhere; the app shows the site's name only, never stars, scores or counts.
-- The sign-up forms and the CSV import check the links against the allowed sites in
-- src/data/review-sites.json; here we only make sure they are short https links.

alter table public.business_signups
  add column review_links text[] check (
    review_links is null
    or (
      cardinality(review_links) between 1 and 3
      and array_to_string(review_links, ' ') ~ '^https://[^ ]+( https://[^ ]+)*$'
      and char_length(array_to_string(review_links, ' ')) <= 1000
    )
  );

-- The same export as before, with the links at the end in the CSV column anmeldelseslinks.
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
    end as verificering_oensket,
    coalesce(array_to_string(review_links, '|'), '') as anmeldelseslinks
  from public.business_signups
  where status = 'new'
  order by created_at;

-- For the dashboard only, as in 20261113120000_lock_admin_views.sql.
revoke all on public.business_signups_export from anon, authenticated;
