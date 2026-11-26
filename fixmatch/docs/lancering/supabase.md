# Supabase: brugere og virksomhedstilmeldinger

> **Status 9. november 2026:** Projektet `khhizugetbekalfjmyhr` i Frankfurt er oprettet, filerne i `supabase/migrations/` til og med `20261113120000_lock_admin_views.sql` er kørt, Log ind med Apple er slået til, og `.env` peger på projektet. Tilbage: databehandleraftalen (DPA), egen e-mailafsender (SMTP) og opgradering til Pro før lancering.

> **Skal køres i hånden (17. november 2026).** Kør de fire nye filer i SQL Editor (trin 2), i denne rækkefølge, før næste build eller hjemmesiden går ud. Ellers fejler tilmeldingerne (kolonnen `review_links` mangler), og "Rapportér" falder tilbage til e-mail.
>
> 1. `20261117120000_review_links.sql` – kolonnen `review_links` til links til virksomhedens egne profiler på andre anmeldelsessider, og eksporten med kolonnen `anmeldelseslinks`. Kør den kun én gang.
> 2. `20261117130000_content_reports.sql` – tabellen `content_reports` til "Rapportér", og `hidden` på Naborabat-grupper.
> 3. `20261117140000_report_retention.sql` – kolonnen `handled_at`, så I kan slette rapporter 12 måneder efter, I har afsluttet dem. Appen kan kun tilføje rapporter, ikke sætte `handled_at`.
> 4. `20261117150000_lock_public_views.sql` – appen og hjemmesiden kan kun læse de offentlige visninger. Indtil den er kørt, kan alle med den offentlige nøgle rette og slette delte priser gennem `shared_prices`, så kør den hurtigst muligt.
>
> Fil 3 og 4 kan køres flere gange. Tjek bagefter med forespørgslen under "Godt at vide", at ingen visning giver mere end læseadgang.

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
2. Kopiér hele indholdet af `fixmatch/supabase/migrations/20261030120000_accounts_and_signups.sql`, sæt det ind, og tryk **Run**. Gør det samme med `20261106120000_verification.sql` (Verificeret-mærket) `20261107120000_prices_and_reviews.sql` (anmeldelser og "Del, hvad du betalte") `20261108120000_availability.sql` ("Hvem har tid i dag?") `20261109120000_business_accounts.sql` ("Min virksomhed"), `20261110120000_call_answers.sql` ("Fik du fat i dem?") `20261111120000_work_photos.sql` (billeder af udført arbejde), `20261112120000_group_jobs.sql` (Naborabat), `20261113120000_lock_admin_views.sql`, `20261117120000_review_links.sql` (links til anmeldelsessider), `20261117130000_content_reports.sql` (rapporter fra brugere), `20261117140000_report_retention.sql` (hvornår en rapport er afsluttet) og `20261117150000_lock_public_views.sql` (kun læseadgang til de offentlige visninger) bagefter, i den rækkefølge.
3. Der skal stå "Success. No rows returned".

Det laver tabellerne `profiles` (navn og telefon), `contacts` (hvem ringede til hvem), `business_signups` (tilmeldinger med samtykke), funktionen `delete_account` (sletning af bruger) og to visninger til jer: `contacts_with_profile` og `business_signups_export`. Den sidste fil laver `price_reports` og `reviews` og visningerne `shared_prices`, `public_reviews` og `review_summary`, som appen læser. Databasen tjekker selv, at der er en række i `contacts` for brugeren og virksomheden, før en anmeldelse eller pris kan gemmes. Rækken kommer, når brugeren trykker Ring eller skriver til virksomheden i appen – databasen kan ikke se, om opkaldet blev besvaret. Alle tabeller er låst med "row level security", så appen kun kan det, den skal.

## 3. Log ind med Apple

1. **Authentication → Sign In / Providers → Apple** → slå til.
2. Under **Client IDs** skriver du `dk.fixmatch.app` (appens bundle id). Mere skal der ikke til for login i appen; felterne til "Secret Key" er kun til login på en hjemmeside.
3. Appen har allerede tilladelsen til Log ind med Apple (`usesAppleSignIn` i `app.json`). Xcode opretter den, når du signerer.

## 3b. Log ind med Google

Knappen "Fortsæt med Google" vises først i appen, når Google er slået til i Supabase. Appen spørger selv projektet (`/auth/v1/settings`), så der skal ikke bygges en ny app, når den slås til.

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)) → opret et projekt, fx `FixMatch`.
2. **Google Auth Platform → Branding**: appens navn `FixMatch`, jeres support-e-mail og et link til privatlivspolitikken (`https://fixmatchh.netlify.app/privatliv/`). **Audience**: *External*, og tryk **Publish app**, så alle kan logge ind (ellers kun testbrugere). **Data Access**: `openid`, `.../auth/userinfo.email` og `.../auth/userinfo.profile`.
3. **Clients → Create client** → type **Web application** (også selvom det er en iPhone-app: login sker i en browser hos Supabase).
   - **Authorized redirect URIs**: `https://<projekt-id>.supabase.co/auth/v1/callback` (står også på Google-siden i Supabase).
   - Gem, og kopiér **Client ID** og **Client secret**.
4. **Supabase → Authentication → Sign In / Providers → Google** → slå til, indsæt Client ID og Client secret, og gem.
5. **Supabase → Authentication → URL Configuration → Redirect URLs** → tilføj `fixmatch://auth/callback`. Uden den sender Supabase brugeren til hjemmesiden i stedet for tilbage til appen.

**Test:** Åbn appen → Profil → Opret bruger → Fortsæt med Google. Brugeren står bagefter under **Authentication → Users** med udbyderen `google`.

> Apple kræver, at en app med Google-login også har Log ind med Apple (App Store-retningslinje 4.8). Det har FixMatch, så det er i orden.

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

   Indtil SMTP er på plads, virker **Log ind med Apple** for alle. E-mail-login er skjult i appen med `EXPO_PUBLIC_EMAIL_LOGIN=off` i `.env`, fordi Supabase ikke må sende en kode på gratisplanen uden jeres egen afsender. Når SMTP virker og skabelonerne ovenfor er rettet, så sæt den til `on`, og byg appen igen.

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

### "Min virksomhed": virksomheden logger ind i appen

Koden fra linket ovenfor er også virksomhedens login i appen. Ejeren opretter en almindelig bruger, går til **Profil → Log ind som virksomhed**, finder virksomheden og skriver koden. Så ser de, hvem der har ringet de sidste 90 dage, kan melde ledig tid og se den månedlige opgørelse.

Beder de om at rette priser, åbningstider eller tekst, kommer det i **Table Editor → business_change_requests** (kolonnen `changes`). Ret virksomheden i regnearket eller `live-businesses.json`, og sæt `status` til `applied` (eller `rejected`). Lov virksomhederne svar inden for 2 hverdage. **Table Editor → business_members** viser, hvem der er logget ind som hvilken virksomhed; slet rækken for at lukke adgangen.

### Billeder af udført arbejde

Virksomhederne lægger selv billeder op fra "Min virksomhed". Filerne ligger i **Storage → work-photos** i en mappe pr. virksomhed, og rækkefølgen i **Table Editor → business_photos**. Er et billede upassende (personer, adresser, reklame for andet), så slet rækken og filen. Højst 6 pr. virksomhed.

### "Fik du fat i dem?"

Efter et opkald spørger appen kunden, om nogen tog telefonen. Svarene ligger i **call_answers**, og visningen **answer_rates** giver andelen pr. virksomhed. Appen viser først "Tager telefonen 9 ud af 10 gange" fra 5 svar. Ingen kan se, hvem der svarede hvad.

### Naborabat

Naboer går sammen om en opgave i **group_jobs** med en kode på 6 tegn, og **group_members** viser, hvem der er med (kun antallet er offentligt gennem visningen `open_group_jobs`). Grupper lukker af sig selv efter 90 dage. Ser I en gruppe med upassende tekst i `area` eller `note`, så sæt `hidden` til `true`. Så forsvinder den fra appen og hjemmesiden, og ingen kan melde sig til med koden.

### Rapporter fra brugere (inden for 24 timer på hverdage)

Når en bruger trykker **Rapportér** ved en anmeldelse eller en Naborabat-gruppe, kommer der en række i **Table Editor → content_reports**: `kind` (`review`, `group` eller `photo`), `target_id` (anmeldelsens eller gruppens id), `reason` og `created_at`. Uden server eller internet kommer rapporten som e-mail med samme id. Det rapporterede er skjult på brugerens egen telefon med det samme.

Vilkårene lover, at I ser på rapporter **inden for 24 timer på hverdage** (App Store-retningslinje 1.2). Kig i tabellen hver hverdag, sorteret efter `created_at`, og filtrér på `handled_at` er tom. Slet ikke rækkerne, mens sagen kører; de er jeres dokumentation.

- **Anmeldelse:** find den under **Table Editor → reviews** (filtrér på `id`). Bryder den reglerne (personoplysninger, krænkende, ikke om virksomheden, skrevet af virksomheden selv eller en konkurrent), så sæt `hidden` til `true`. Ret aldrig i teksten.
- **Gruppe:** find den under **group_jobs** (filtrér på `id`), og sæt `hidden` til `true`.
- **Billede af udført arbejde:** slet rækken i **business_photos** og filen i **Storage → work-photos**.
- **Nultolerance:** Skriver en bruger krænkende eller truende indhold igen og igen, så slet brugeren under **Authentication → Users**. Så forsvinder alt, brugeren har skrevet.

Når I har taget stilling, så gør begge dele (DSA art. 16 og 17). Reglerne står på siderne "Om anmeldelser" og "Vilkår for brug" i appen.

1. **Skriv altid til den, hvis indhold I skjuler eller sletter,** og sig kort hvorfor – også når rapporten kom fra knappen i appen uden e-mail. Find forfatteren: for en anmeldelse kolonnen `user_id` i **reviews**, for en gruppe kolonnen `created_by` i **group_jobs**. Slå id'et op under **Authentication → Users**, hvor e-mailen står (ved Log ind med Apple kan det være Apples skjulte adresse, som også virker). Er det et billede af udført arbejde, så skriv til virksomheden: `user_id` i **business_members** for virksomhedens id, eller kontaktpersonens e-mail i **business_signups**.
2. **Svar den, der rapporterede,** hvis de har skrevet en e-mail. Rapporter fra knappen i appen har ingen e-mail; dem svarer I ikke på.

Sæt så `handled_at` til tidspunktet (fx `now()`) på rækken i **content_reports**. Lader I indholdet blive, sætter I også `handled_at`.

**Sletning af gamle rapporter (én gang om måneden).** Privatlivspolitikken lover, at en rapport slettes senest 12 måneder efter, sagen er afsluttet. Kør i SQL Editor:

```sql
delete from public.content_reports where handled_at < now() - interval '12 months';
```

Slet også e-mails med rapporter og svar 12 måneder efter, sagen er afsluttet.

### Priser, brugere har delt

**Table Editor → price_reports** viser alle delte priser. Appen viser kun priser fra de seneste 24 måneder og først fra 3 priser pr. opgave. Ligner en pris en fejl (fx 10 gange for meget), så slet rækken.

### Sletning

- Brugere sletter selv deres konto i appen (Profil → Slet bruger). Navn, telefon, opkaldsliste, anmeldelser og delte priser slettes med det samme.
- Slet brugere, der ikke har logget ind i 24 måneder, mindst én gang om året: **Authentication → Users**, sortér efter "Last sign in" (det står i privatlivspolitikken).
- Vil en virksomhed fjernes, så fjern den fra `live-businesses.json` (og evt. regnearket), og sæt `status` til `rejected` i `business_signups`. Behold selve rækken som dokumentation i 12 måneder.
- Rapporter i `content_reports`: én gang om måneden, 12 måneder efter `handled_at` (se "Rapporter fra brugere").

## Godt at vide

- **Gratis-planen sætter projektet på pause efter en uge uden aktivitet.** Det kan genstartes med ét klik i dashboardet. Før lanceringen bør I skifte til **Pro** (ca. 25 USD/md.), som aldrig går i pause og har daglig backup.
- Mister telefonen forbindelsen, viser appen en fejl og prøver igen næste gang. Intet går tabt.
- Skemaet ligger i `supabase/migrations/`. Ændrer I det, så lav en ny fil med en senere dato, og kør den i SQL Editor.
- **Nye visninger er åbne for alle.** Supabase giver `anon` og `authenticated` alle rettigheder til nye tabeller og visninger. En ny visning skal derfor altid have `revoke all on public.<visning> from anon, authenticated;` og, hvis appen skal læse den, `grant select on public.<visning> to anon, authenticated;`. Tjek med denne forespørgsel, at ingen visning giver mere end læseadgang (den skal give 0 rækker):

  ```sql
  select table_name, grantee, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'
    and table_name in (select table_name from information_schema.views where table_schema = 'public');
  ```
- **Verificeret-mærket:** Tilmeldinger, der beder om mærket, har teksten "Ønsker Verificeret" i kolonnen `verificering_oensket` i eksporten, med autorisationsnummer, forsikring og garantiordning. Tjek CVR på datacvr.virk.dk, ring til ejeren (senere MitID Erhverv), slå autorisationen op hos Sikkerhedsstyrelsen og se forsikringen. Skriv så datoen i `verificeret` og tjekkene i `verificeret_tjek` (fx `cvr|ejer|autorisation|forsikring|garanti`) før `npm run import:businesses`. Mærket gælder et år.

## Hvis noget går galt

| Problem | Løsning |
| --- | --- |
| Appen siger "Demo: din bruger gemmes kun på denne telefon" | `.env` mangler eller blev ikke læst. Tjek de to linjer, og byg igen med `npm run ios:xcode` |
| "For mange forsøg" ved e-mail-login | Supabase' indbyggede afsender er nået sin grænse. Sæt egen SMTP op (trin 4) |
| E-mailen har et link i stedet for en kode | Skabelonerne mangler `{{ .Token }}` (trin 4) |
| Appen siger "Vi kan ikke få forbindelse til FixMatch lige nu", og tilmelding på hjemmesiden fejler | Projektet er sat på pause. Gratisplanen sætter projekter på pause efter en uge uden aktivitet, og så findes adressen `<projekt-id>.supabase.co` ikke længere. Gå til [supabase.com/dashboard](https://supabase.com/dashboard), åbn projektet, og tryk **Restore project** (tager et par minutter). Er projektet væk, så opret et nyt (trin 1–5), kør alle filer i `supabase/migrations/` igen, ret `.env`, og byg appen og hjemmesiden igen. Pro-planen pauser ikke |
| Log ind med Apple fejler med "Unacceptable audience" | `dk.fixmatch.app` mangler under Client IDs (trin 3) |
| "Fortsæt med Google" vises ikke | Google er ikke slået til i Supabase (trin 3b), eller projektet er på pause |
| Google-login ender på hjemmesiden i stedet for i appen | `fixmatch://auth/callback` mangler under Redirect URLs (trin 3b, punkt 5) |
| Google siger "redirect_uri_mismatch" | Supabase' callback-adresse mangler under Authorized redirect URIs i Google Cloud (trin 3b, punkt 3) |
| "Det lykkedes ikke" når man gemmer navn og telefon | SQL'en er ikke kørt (trin 2), eller telefonnummeret har tegn, der ikke er tilladt |
| Tilmelding på hjemmesiden åbner en e-mail i stedet for at gemme | Hjemmesiden er bygget uden `.env`. Kør `npm run website:build` igen, og læg `dist-website/` op igen |
| Tilmelding giver "blev ikke sendt" | Forkert URL eller nøgle i `.env`, eller SQL'en er ikke kørt |
