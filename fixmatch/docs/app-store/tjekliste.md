# Tjekliste før App Store

Kryds af i rækkefølge. ✅ = allerede klaret i koden.

## 1. Konto og udgiver

Der kræves **ikke** et CVR-nummer. Se `docs/lancering/global-lancering.md`.

- ✅ Apple Developer Program (personlig konto, 99 USD/år). Jeres navn står som udgiver i App Store.
- [ ] Accepter den nyeste Apple Developer Program License Agreement. Det er tilladelsen til Apple Kort (bilag 6). Gem dato og version (`docs/jura/apple-kort.md`).
- [ ] Angiv **trader-status** i App Store Connect (Business → Compliance → Digital Services Act). Gratis app uden indtægter: ikke erhvervsdrivende. Tjener I penge: erhvervsdrivende, og så vises adresse, telefon og e-mail på App Store-siden i EU.
- [ ] Vælg kun de lande i App Store Connect (Pricing and Availability), hvor der er rigtige virksomheder.
- [ ] Læg hjemmesiden online på https://fixmatchh.netlify.app med Netlify Drop (`docs/lancering/hjemmeside.md`). Et eget domæne kan komme senere.
- [ ] Senere, når der kommer indtægter: stift en enkeltmandsvirksomhed (gratis på virk.dk), momsregistrér ved over 50.000 kr. i momspligtigt salg, og overvej varemærkeregistrering af "FixMatch".

## 2. Indhold og rettigheder

- [ ] Skriftligt samtykke fra hver virksomhed (`docs/jura/samtykke-virksomhed.md`).
- ✅ Ingen stjerner, scorer eller logoer fra Trustpilot, Google eller andre anmeldelsessider – kun FixMatch' egne anmeldelser og almindelige tekstlinks til virksomhedens egen profil (`docs/jura/anmeldelser.md`).
- [ ] Tjek hvert anmeldelseslink, før det kommer med: det skal pege på samme virksomhed (navn og CVR).
- [ ] Virksomhedernes egne billeder og logoer er med i samtykket.
- [ ] `npm run import:businesses` kører uden fejl.
- [ ] Udfyld `src/constants/app-info.ts` (navn som på Apple-kontoen, e-mail, URL'er). CVR kan stå tomt.
- [ ] Hjemmesiden er online: `npm run website:build`, og læg `dist-website/` på fx Netlify. Privatlivspolitik, vilkår og support findes på dansk og engelsk og kræver ikke login.

## 3. Teknik

- ✅ Bundle id `dk.fixmatch.app`, version 1.0.0, build-numre tælles op automatisk af EAS.
- ✅ App-ikon 1024 × 1024 uden gennemsigtighed + iOS 26 Liquid Glass-ikon (`assets/fixmatch.icon`).
- ✅ Placering kun "mens appen bruges", med dansk forklaring. Ingen baggrundsplacering.
- ✅ Appen virker uden placering (manuel by).
- ✅ Privacy manifest (`ios.privacyManifests` i `app.json`) og `ITSAppUsesNonExemptEncryption = false` (ingen eksportdokumentation nødvendig).
- ✅ Brugere kan slette deres konto i appen (Profil → Slet bruger), som retningslinje 5.1.1(v) kræver. Log ind med Apple er med, og login kan springes over.
- ✅ Privatlivspolitik er tilgængelig inde i appen (Mere → Privatlivspolitik).
- ✅ Mørk tilstand, Dynamic Type og VoiceOver-labels.
- ✅ Kun iPhone (`supportsTablet: false`) – ingen iPad-skærmbilleder nødvendige.
- [ ] `EXPO_PUBLIC_FIXMATCH_DATA=live` i den build, der indsendes (profilen `production` i `eas.json`).
- [ ] `npm run check` er grønt.
- [ ] `EXPO_PUBLIC_FIXMATCH_DATA=live npm run check:release` siger "klar til App Store". EAS kører samme tjek og stopper buildet ellers.
- ✅ "Sådan rangerer vi" og "Om anmeldelser" beskriver, hvordan FixMatch-anmeldelser tæller med i scoren, og hvordan de tjekkes (markedsføringsloven § 6 a og § 6 b).
- [ ] Test på en rigtig iPhone via TestFlight: ring, hjemmeside, rute, del, placering til/fra, mørk tilstand, stor tekst.
- [ ] Kortet: Apple-logo og "Legal" er synlige over kortene i bunden (lys/mørk, stor tekst). Klynger zoomer ind, "Hele DK" viser hele landet.
- [ ] "Beskriv dit problem": prøv eksemplerne, og tjek at budgetgrupperne passer med virksomhedernes priser.
- [ ] Widgets på en rigtig iPhone: tilføj "Hurtig hjælp" og "Gemte håndværkere" i alle størrelser på hjemmeskærmen og låseskærmen, gem en virksomhed, og tjek at et tryk åbner den rigtige side. Prøv lys, mørk og tonet (iOS 18+) tilstand.
- ✅ `npm run widgets:check` renderer alle widgets uden fejl.

## 4. App Store Connect

- [ ] Tekster, søgeord og noter fra `app-store-tekster.md` (dansk) og `app-store-texts-en.md` (engelsk, til alle andre lande).
- [ ] App Review Information: flueben ved **Sign-in required**, og virksomhedens id og kode til "Min virksomhed" i *User name* og *Password* (se `app-store-tekster.md` → Noter til Apples review-team). Prøv selv koden i appen først.
- [ ] App Privacy: datatyperne fra `app-store-tekster.md` → App Privacy (navn, e-mail, telefon, bruger-id, produktinteraktion, købshistorik, andet brugerindhold).
- [ ] Supabase er sat op (`docs/lancering/supabase.md`), og `fixmatch/.env` har URL og publishable key i den build, der indsendes.
- [ ] Aldersgrænse 4+.
- [ ] Skærmbilleder (6,9").
- [ ] Support- og privatlivs-URL virker uden login.
- [ ] Indsend til review. Typisk svartid er 1–3 dage.

## Hyppige afvisningsgrunde for apps som FixMatch

| Retningslinje | Risiko | Sådan undgår I den |
| --- | --- | --- |
| 2.1 App Completeness | Demodata eller tomme lister | Indsend kun med rigtige, samtykkede virksomheder |
| 2.2 Beta Testing | Demoversion i App Store | Demoer og betaversioner hører hjemme på TestFlight |
| 2.1 Review fra USA | Apple tester ofte fra USA og ser en tom app | Uden for Danmark viser appen København og siger det. Review-noterne forklarer også, hvordan man vælger by (Profil → Placering). Vælg kun lande med virksomheder |
| 1.2 Brugerindhold | Anmeldelser og grupper uden mulighed for at rapportere | "Rapportér" ved anmeldelser og grupper, tekstfilter, nultolerance i vilkårene, og I ser på rapporter inden for 24 timer på hverdage (`docs/lancering/supabase.md`) |
| 5.1.1(v) Login | Navn og telefon kræves, før man kan bruge appen | Hele appen kan ses uden bruger ("Spring over", og "Ikke nu" efter Log ind med Apple). Kun opkald og beskeder kræver navn og nummer, og review-noterne forklarer hvorfor |
| 4.2 Minimum Functionality | "Bare en hjemmeside" | Appen har native kort, sammenligning, filtre, placering – fremhæv det i review-noterne |
| 5.1.1 Privacy | Manglende privatlivspolitik | Link i appen ✅ og i App Store Connect |
| 5.2.2 Tredjepartsindhold | Scorer eller anmeldelser fra andre sider uden tilladelse | Vis kun FixMatch' egne anmeldelser og almindelige tekstlinks til virksomhedens egen profil. Forklar det i review-noterne |
| 5.2.1 / 2.3.7 Varemærker | Andres logoer eller navne i appen eller i søgeord | Ingen logoer, stjerner eller farver fra andre sider. Navnet står kun som tekst i linket og aldrig i søgeord |
