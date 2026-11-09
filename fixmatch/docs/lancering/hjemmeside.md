# Hjemmesiden – læg den online med Netlify Drop

*Skrevet 6. november 2026. Ny forside og Naborabat-side 9. november 2026.*

Hjemmesiden har forside, privatlivspolitik, vilkår, support, tilmelding for virksomheder, "Ledig i dag" og Naborabat på dansk og engelsk. Apple kræver adressen på privatlivspolitikken og support-siden, før appen kan komme i App Store.

## Sådan hænger siden sammen med appen

- **Forsiden** viser, hvad appen kan, med billeder af appens egne skærme. Under overskriften står **Lige nu på FixMatch**: hvor mange virksomheder der har tid i dag, åbne naborabat-grupper, delte priser og anmeldelser. Tallene kommer direkte fra Supabase, fra de samme offentlige visninger som appen læser. Et tal vises først, når det er over 0.
- **Naborabat** (`/naborabat/?kode=ABC123`): Når en nabo deler en gruppe i appen, får de andre et link hertil. Siden viser opgaven, gaden, perioden og hvor mange der er med, aldrig hvem. Knappen **Åbn i FixMatch og deltag** åbner appen på Naborabat med koden udfyldt.
- **Tilmelding** og **Ledig i dag** gemmer i Supabase, ligesom appen.
- Fag og opgaver, mindste gruppe og rabat læses fra appens kode, når siden bygges, så siden og appen siger det samme.

Billederne ligger i `website/images` (WebP, 600 px brede). Tag nye, når skærmene i appen ændrer sig: kør appen på web (`npx expo export -p web`), tag skærmbilleder i 390 × 844, og gem dem med samme navne.

**Links, der åbner appen direkte (universal links)** kræver jeres Team ID fra Apple. Indtil da åbner knappen appen med `fixmatch://`, og siden virker for alle uden appen.

Indtil I køber et domæne, ligger siden gratis hos Netlify på **https://fixmatchh.netlify.app**. Kontakt-e-mailen er Marleys egen, og udgiveren er Marley Romby Sangill (`src/constants/app-info.ts`).

## Første gang (10 minutter)

1. Byg siden: `cd fixmatch && npm run website:build`. Den færdige side ligger i mappen `fixmatch/dist-website`.
2. Gå ind på https://app.netlify.com/drop, og opret en gratis konto (fx med GitHub eller e-mail), så siden bliver liggende.
3. Træk mappen `dist-website` ind i feltet på siden. Efter nogle sekunder er siden online på en tilfældig adresse som `glittering-otter-123.netlify.app`.
4. Gå til **Site configuration → Change site name**, og skriv `fixmatchh` (med to h'er). Så er adressen https://fixmatchh.netlify.app. (Navnet `fixmatch` var ikke vores. Netlify-sitet startede som steady-moxie-cef7e6.)
5. Åbn adressen, og tjek forsiden, privatlivspolitikken og tilmeldingen på telefonen.

**Skal navnet skiftes?** Vælg et nyt i Netlify. Ret så linjen `const WEBSITE = …` og `website: …` i `src/constants/app-info.ts` til den nye adresse, og byg siden igen (punkt 1). Adressen står i appen, i privatlivspolitikken og i sitemap'en, så den skal passe.

## Når noget ændres

Byg siden igen, og træk den nye `dist-website` ind under **Deploys** på jeres site i Netlify. Den gamle udgave bliver erstattet med det samme.

## Tilmeldingsformularen

- **Med Supabase** (URL og publishable key i `fixmatch/.env`, se `supabase.md`): tilmeldingerne gemmes i databasen.
- **Uden Supabase**: formularen åbner virksomhedens mailprogram med tilmeldingen, sendt til kontakt-e-mailen. Det er fint, indtil Supabase er sat op.

Byg siden igen, når `.env` er udfyldt, så formularen sender til databasen.

## Til App Store Connect

| Felt | Dansk | Engelsk |
| --- | --- | --- |
| Support-URL | https://fixmatchh.netlify.app/support/ | https://fixmatchh.netlify.app/en/support/ |
| Marketing-URL | https://fixmatchh.netlify.app/ | https://fixmatchh.netlify.app/en/ |
| Privatlivspolitik | https://fixmatchh.netlify.app/privatliv/ | https://fixmatchh.netlify.app/en/privacy/ |

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
