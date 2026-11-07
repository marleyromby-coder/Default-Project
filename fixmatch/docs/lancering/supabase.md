# Supabase: brugere og virksomhedstilmeldinger

FixMatch gemmer brugere (navn, telefon, e-mail), hvem der har ringet til hvilken virksomhed, og virksomhedernes egne tilmeldinger i **Supabase**. Serveren står i EU (Frankfurt). Det tager ca. 20 minutter at sætte op, og det er gratis at starte.

**Uden Supabase virker appen stadig.** Brugeren gemmes så kun på telefonen, og en virksomhedstilmelding åbner en e-mail til jer. Det er nok til en TestFlight-demo. Til rigtige brugere skal Supabase være sat op.

## 1. Opret projektet

1. Gå til [supabase.com](https://supabase.com), og opret en gratis konto.
2. **New project**:
   - Name: `fixmatch`
   - Database password: lav et stærkt, og gem det i jeres adgangskode-app
   - Region: **Central EU (Frankfurt)**. Det er vigtigt for GDPR, og regionen kan ikke ændres bagefter.
3. Vent et par minutter, til projektet er klar.

**Databehandleraftale:** Organization → Settings → Legal Documents → underskriv **DPA**. Det er jeres databehandleraftale efter GDPR, og privatlivspolitikken henviser til den.

## 2. Lav tabellerne

1. Åbn **SQL Editor** → **New query**.
2. Kopiér hele indholdet af `fixmatch/supabase/migrations/20261030120000_accounts_and_signups.sql`, sæt det ind, og tryk **Run**. Gør det samme med `20261106120000_verification.sql` (Verificeret-mærket) `20261107120000_prices_and_reviews.sql` (anmeldelser og "Del, hvad du betalte") og `20261108120000_availability.sql` ("Hvem har tid i dag?") bagefter, i den rækkefølge.
3. Der skal stå "Success. No rows returned".

Det laver tabellerne `profiles` (navn og telefon), `contacts` (hvem ringede til hvem), `business_signups` (tilmeldinger med samtykke), funktionen `delete_account` (sletning af bruger) og to visninger til jer: `contacts_with_profile` og `business_signups_export`. Den sidste fil laver `price_reports` og `reviews` og visningerne `shared_prices`, `public_reviews` og `review_summary`, som appen læser. Databasen tjekker selv, at brugeren har ringet til virksomheden, før en anmeldelse eller pris kan gemmes. Alle tabeller er låst med "row level security", så appen kun kan det, den skal.

## 3. Log ind med Apple

1. **Authentication → Sign In / Providers → Apple** → slå til.
2. Under **Client IDs** skriver du `dk.fixmatch.app` (appens bundle id). Mere skal der ikke til for login i appen; felterne til "Secret Key" er kun til login på en hjemmeside.
3. Appen har allerede tilladelsen til Log ind med Apple (`usesAppleSignIn` i `app.json`). Xcode opretter den, når du signerer.

## 4. Log ind med e-mail og kode

1. **Authentication → Sign In / Providers → Email**: skal være slået til.
2. **Authentication → Emails → Templates**: ret skabelonerne **Confirm signup** og **Magic link**, så de sender en kode i stedet for et link. Erstat indholdet med fx:

   ```html
   <h2>Din kode til FixMatch</h2>
   <p>Skriv koden i appen: <strong>{{ .Token }}</strong></p>
   <p>Har du ikke bedt om den, kan du se bort fra denne e-mail.</p>
   ```

   Emne: `Din kode til FixMatch`.

3. **Egen e-mailafsender (SMTP).** Supabase' indbyggede afsender sender kun til e-mails i jeres eget Supabase-team og kun få i timen. Til rigtige brugere skal I bruge jeres egen: **Authentication → Emails → SMTP Settings**, med fx [Brevo](https://www.brevo.com) eller [Resend](https://resend.com) (begge har en gratis plan). Afsender: fx `login@fixmatch.dk`, når I har et domæne.

   Indtil SMTP er på plads, virker **Log ind med Apple** for alle, og e-mail-login virker for jer selv.

## 5. Forbind appen

1. **Project Settings → API Keys**: kopiér **Publishable key** (starter med `sb_publishable_`). Den er lavet til at ligge i apps og på hjemmesider.
2. **Project Settings → Data API** (eller forsiden af projektet): kopiér **Project URL**, fx `https://abcdefgh.supabase.co`.
3. Kopiér `fixmatch/.env.example` til `fixmatch/.env`, og udfyld:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
   ```

   Brug **aldrig** den hemmelige nøgle (`sb_secret_…` eller `service_role`) – den giver adgang til alt.

4. Byg appen igen: `npm run ios:xcode` og ▶︎ / Archive (se `xcode.md`). Hjemmesiden: `npm run website:build`. Begge læser `.env`.

**Test:** Åbn appen → Opret bruger → Log ind med Apple → skriv navn og telefon. Brugeren står nu under **Authentication → Users** og i tabellen `profiles`. Ring til en rigtig (ikke-demo) virksomhed, og der kommer en række i `contacts`.

## 6. I hverdagen

### Hvem har ringet til en virksomhed?

**Table Editor → contacts_with_profile** viser hvert opkald med tidspunkt, virksomhedens id, kundens navn og telefonnummer, nyeste først. Indtil der er en side, hvor virksomhederne selv logger ind, kan I sende dem listen, fx én gang om ugen.

### Nye virksomhedstilmeldinger

1. **Table Editor → business_signups** viser alle tilmeldinger med samtykke, ordlyd (`consent`), version og tidspunkt. Det er jeres dokumentation for samtykket – slet dem ikke.
2. Tjek oplysningerne (ring evt. og bekræft), og afvis useriøse ved at sætte `status` til `rejected`.
3. **Table Editor → business_signups_export → Export → CSV** giver de nye tilmeldinger i præcis de kolonner, importen bruger.
4. `npm run import:businesses -- ~/Downloads/business_signups_export_rows.csv`. Importen kan læse alle fem lande, og byer som London får koordinater fra bylisten. Tilføj gerne præcise koordinater, prisexempler og autorisationer i regnearket først.
5. Sæt `status` til `published` på de importerede rækker, så de ikke kommer med i næste eksport.

### "Hvem har tid i dag?": giv en virksomhed sit link

Virksomhederne melder ledig tid på hjemmesiden uden login, med et personligt link. Lav linket sådan, når virksomheden er med i appen:

1. **SQL Editor → New query**, skriv `select public.issue_business_key('fjordvand-vvs');` med virksomhedens id (fra `live-businesses.json`), og tryk **Run**.
2. Svaret er koden. Den vises kun denne ene gang; databasen gemmer kun en hash.
3. Send linket til virksomheden, fx som sms: `https://fixmatchh.netlify.app/ledig/?id=fjordvand-vvs#kode=KODEN`. Bed dem gemme det på hjemmeskærmen.
4. Har de mistet linket, så kør linje 1 igen. Den gamle kode holder op med at virke.

**Table Editor → availability** viser, hvem der har meldt ledig tid og hvornår. Appen viser kun i dag og i morgen, og den henter listen, hver gang den åbnes.

### Anmeldelser, der bliver rapporteret

Rapporter kommer som e-mail med anmeldelsens id. Find den under **Table Editor → reviews** (filtrér på `id`). Bryder den reglerne (personoplysninger, krænkende, ikke om virksomheden, skrevet af virksomheden selv eller en konkurrent), så sæt `hidden` til `true`. Ret aldrig i teksten. Svar den, der rapporterede, og skriv kort til anmelderen, hvorfor den er skjult (DSA art. 16 og 17). Reglerne står på siden "Om anmeldelser" i appen.

### Priser, kunder har delt

**Table Editor → price_reports** viser alle delte priser. Appen viser kun priser fra de seneste 24 måneder og først fra 3 priser pr. opgave. Ligner en pris en fejl (fx 10 gange for meget), så slet rækken.

### Sletning

- Brugere sletter selv deres konto i appen (Profil → Slet bruger). Navn, telefon, opkaldsliste, anmeldelser og delte priser slettes med det samme.
- Slet brugere, der ikke har logget ind i 24 måneder, mindst én gang om året: **Authentication → Users**, sortér efter "Last sign in" (det står i privatlivspolitikken).
- Vil en virksomhed fjernes, så fjern den fra `live-businesses.json` (og evt. regnearket), og sæt `status` til `rejected` i `business_signups`. Behold selve rækken som dokumentation i 12 måneder.

## Godt at vide

- **Gratis-planen sætter projektet på pause efter en uge uden aktivitet.** Det kan genstartes med ét klik i dashboardet. Før lanceringen bør I skifte til **Pro** (ca. 25 USD/md.), som aldrig går i pause og har daglig backup.
- Mister telefonen forbindelsen, viser appen en fejl og prøver igen næste gang. Intet går tabt.
- Skemaet ligger i `supabase/migrations/`. Ændrer I det, så lav en ny fil med en senere dato, og kør den i SQL Editor.
- **Verificeret-mærket:** Tilmeldinger, der beder om mærket, har teksten "Ønsker Verificeret" i kolonnen `verificering_oensket` i eksporten, med autorisationsnummer, forsikring og garantiordning. Tjek CVR på datacvr.virk.dk, ring til ejeren (senere MitID Erhverv), slå autorisationen op hos Sikkerhedsstyrelsen og se forsikringen. Skriv så datoen i `verificeret` og tjekkene i `verificeret_tjek` (fx `cvr|ejer|autorisation|forsikring|garanti`) før `npm run import:businesses`. Mærket gælder et år.

## Hvis noget går galt

| Problem | Løsning |
| --- | --- |
| Appen siger "Demo: din bruger gemmes kun på denne telefon" | `.env` mangler eller blev ikke læst. Tjek de to linjer, og byg igen med `npm run ios:xcode` |
| "For mange forsøg" ved e-mail-login | Supabase' indbyggede afsender er nået sin grænse. Sæt egen SMTP op (trin 4) |
| E-mailen har et link i stedet for en kode | Skabelonerne mangler `{{ .Token }}` (trin 4) |
| Log ind med Apple fejler med "Unacceptable audience" | `dk.fixmatch.app` mangler under Client IDs (trin 3) |
| "Det lykkedes ikke" når man gemmer navn og telefon | SQL'en er ikke kørt (trin 2), eller telefonnummeret har tegn, der ikke er tilladt |
| Tilmelding på hjemmesiden åbner en e-mail i stedet for at gemme | Hjemmesiden er bygget uden `.env`. Kør `npm run website:build` igen, og læg `dist-website/` op igen |
| Tilmelding giver "blev ikke sendt" | Forkert URL eller nøgle i `.env`, eller SQL'en er ikke kørt |
