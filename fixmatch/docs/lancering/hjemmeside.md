# Hjemmesiden – læg den online med Netlify Drop

*Skrevet 6. november 2026.*

Hjemmesiden har forside, privatlivspolitik, vilkår, support og tilmelding for virksomheder på dansk og engelsk. Apple kræver adressen på privatlivspolitikken og support-siden, før appen kan komme i App Store.

Indtil I køber et domæne, ligger siden gratis hos Netlify på **https://fixmatch-app.netlify.app**. Kontakt-e-mailen er Marleys egen, og udgiveren er Marley Romby Sangill (`src/constants/app-info.ts`).

## Første gang (10 minutter)

1. Byg siden: `cd fixmatch && npm run website:build`. Den færdige side ligger i mappen `fixmatch/dist-website`.
2. Gå ind på https://app.netlify.com/drop, og opret en gratis konto (fx med GitHub eller e-mail), så siden bliver liggende.
3. Træk mappen `dist-website` ind i feltet på siden. Efter nogle sekunder er siden online på en tilfældig adresse som `glittering-otter-123.netlify.app`.
4. Gå til **Site configuration → Change site name**, og skriv `fixmatch-app`. Så er adressen https://fixmatch-app.netlify.app. (Navnet `fixmatch` var ikke vores. Netlify-sitet startede som steady-moxie-cef7e6.)
5. Åbn adressen, og tjek forsiden, privatlivspolitikken og tilmeldingen på telefonen.

**Er navnet `fixmatch-app` taget?** Vælg et andet. Ret så linjen `const WEBSITE = …` og `website: …` i `src/constants/app-info.ts` til den nye adresse, og byg siden igen (punkt 1). Adressen står i appen, i privatlivspolitikken og i sitemap'en, så den skal passe.

## Når noget ændres

Byg siden igen, og træk den nye `dist-website` ind under **Deploys** på jeres site i Netlify. Den gamle udgave bliver erstattet med det samme.

## Tilmeldingsformularen

- **Med Supabase** (URL og publishable key i `fixmatch/.env`, se `supabase.md`): tilmeldingerne gemmes i databasen.
- **Uden Supabase**: formularen åbner virksomhedens mailprogram med tilmeldingen, sendt til kontakt-e-mailen. Det er fint, indtil Supabase er sat op.

Byg siden igen, når `.env` er udfyldt, så formularen sender til databasen.

## Til App Store Connect

| Felt | Dansk | Engelsk |
| --- | --- | --- |
| Support-URL | https://fixmatch-app.netlify.app/support/ | https://fixmatch-app.netlify.app/en/support/ |
| Marketing-URL | https://fixmatch-app.netlify.app/ | https://fixmatch-app.netlify.app/en/ |
| Privatlivspolitik | https://fixmatch-app.netlify.app/privatliv/ | https://fixmatch-app.netlify.app/en/privacy/ |

## Når I køber et domæne

1. Køb fx `fixmatch.dk` hos en dansk registrator (punktum.dk-forhandler).
2. I Netlify: **Domain management → Add a domain**, og følg vejledningen. Netlify laver selv https-certifikatet.
3. Ret adressen og e-mailen i `src/constants/app-info.ts`, byg siden igen, og opdatér URL'erne i App Store Connect.

## Det følger med siden

- Beskrivelse og billede, når et link deles, og til søgemaskiner.
- `sitemap.xml` og `robots.txt` til Google.
- En 404-side, når en adresse ikke findes.
- `_headers` med basale sikkerhedsindstillinger, som Netlify læser.
- E-mailadressen er skrevet, så de simpleste spam-robotter ikke kan læse den. Den virker som normalt for mennesker.
