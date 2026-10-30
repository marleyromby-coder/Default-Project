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
2. Kopiér hele indholdet af `fixmatch/supabase/migrations/20261030120000_accounts_and_signups.sql`, sæt det ind, og tryk **Run**.
3. Der skal stå "Success. No rows returned".

Det laver tabellerne `profiles` (navn og telefon), `contacts` (hvem ringede til hvem), `business_signups` (tilmeldinger med samtykke), funktionen `delete_account` (sletning af bruger) og to visninger til jer: `contacts_with_profile` og `business_signups_export`. Alle tabeller er låst med "row level security", så appen kun kan det, den skal.

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

3. **Egen e-mailafsender (SMTP).** Supabase' indbyggede afsender sender kun til e-mails i jeres eget Supabase-team og kun få i timen. Til rigtige brugere skal I bruge jeres egen: **Authentication → Emails → SMTP Settings**, med fx [Brevo](https://www.brevo.com) eller [Resend](https://resend.com) (begge har en gratis plan). Afsender: fx `login@fixmatch.dk`.

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

### Sletning

- Brugere sletter selv deres konto i appen (Mere → Slet bruger). Navn, telefon og opkaldsliste slettes med det samme.
- Slet brugere, der ikke har logget ind i 24 måneder, mindst én gang om året: **Authentication → Users**, sortér efter "Last sign in" (det står i privatlivspolitikken).
- Vil en virksomhed fjernes, så fjern den fra `live-businesses.json` (og evt. regnearket), og sæt `status` til `rejected` i `business_signups`. Behold selve rækken som dokumentation i 12 måneder.

## Godt at vide

- **Gratis-planen sætter projektet på pause efter en uge uden aktivitet.** Det kan genstartes med ét klik i dashboardet. Før lanceringen bør I skifte til **Pro** (ca. 25 USD/md.), som aldrig går i pause og har daglig backup.
- Mister telefonen forbindelsen, viser appen en fejl og prøver igen næste gang. Intet går tabt.
- Skemaet ligger i `supabase/migrations/`. Ændrer I det, så lav en ny fil med en senere dato, og kør den i SQL Editor.

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
