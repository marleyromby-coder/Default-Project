# Tjekliste før App Store

Kryds af i rækkefølge. ✅ = allerede klaret i koden.

## 1. Konto og udgiver

Der kræves **ikke** et CVR-nummer. Se `docs/lancering/global-lancering.md`.

- ✅ Apple Developer Program (personlig konto, 99 USD/år). Jeres navn står som udgiver i App Store.
- [ ] Accepter den nyeste Apple Developer Program License Agreement. Det er tilladelsen til Apple Kort (bilag 6). Gem dato og version (`docs/jura/apple-kort.md`).
- [ ] Angiv **trader-status** i App Store Connect (Business → Compliance → Digital Services Act). Gratis app uden indtægter: ikke erhvervsdrivende. Tjener I penge: erhvervsdrivende, og så vises adresse, telefon og e-mail på App Store-siden i EU.
- [ ] Vælg kun de lande i App Store Connect (Pricing and Availability), hvor der er rigtige virksomheder.
- [ ] Registrér domænet `fixmatch.dk` (punktum.dk) til privatlivspolitik og support.
- [ ] Senere, når der kommer indtægter: stift en enkeltmandsvirksomhed (gratis på virk.dk), momsregistrér ved over 50.000 kr. i momspligtigt salg, og overvej varemærkeregistrering af "FixMatch".

## 2. Indhold og rettigheder

- [ ] Skriftligt samtykke fra hver virksomhed (`docs/jura/samtykke-virksomhed.md`).
- [ ] Skriftlig partneraftale med Trustpilot, før TrustScores vises (`docs/jura/trustpilot.md`). Indtil da: vis ikke Trustpilot-data i den offentlige version.
- [ ] Virksomhedernes egne billeder og logoer er med i samtykket.
- [ ] `npm run import:businesses` kører uden fejl.
- [ ] `npm run photos:bundle` er kørt, så fotos ligger i appen.
- [ ] Udfyld `src/constants/app-info.ts` (navn som på Apple-kontoen, e-mail, URL'er). CVR kan stå tomt.
- [ ] Hjemmesiden er online: `npm run website:build`, og læg `dist-website/` på fx Netlify. Privatlivspolitik, vilkår og support findes på dansk og engelsk og kræver ikke login.

## 3. Teknik

- ✅ Bundle id `dk.fixmatch.app`, version 1.0.0, build-numre tælles op automatisk af EAS.
- ✅ App-ikon 1024 × 1024 uden gennemsigtighed + iOS 26 Liquid Glass-ikon (`assets/fixmatch.icon`).
- ✅ Placering kun "mens appen bruges", med dansk forklaring. Ingen baggrundsplacering.
- ✅ Appen virker uden placering (manuel by).
- ✅ Privacy manifest (`ios.privacyManifests` i `app.json`) og `ITSAppUsesNonExemptEncryption = false` (ingen eksportdokumentation nødvendig).
- ✅ Ingen login → kravet om kontosletning gælder ikke.
- ✅ Privatlivspolitik er tilgængelig inde i appen (Mere → Privatlivspolitik).
- ✅ Mørk tilstand, Dynamic Type og VoiceOver-labels.
- ✅ Kun iPhone (`supportsTablet: false`) – ingen iPad-skærmbilleder nødvendige.
- [ ] `EXPO_PUBLIC_FIXMATCH_DATA=live` i den build, der indsendes (profilen `production` i `eas.json`).
- [ ] `npm run check` er grønt.
- [ ] `EXPO_PUBLIC_FIXMATCH_DATA=live npm run check:release` siger "klar til App Store". EAS kører samme tjek og stopper buildet ellers.
- ✅ Med Trustpilot slået fra nævner appen ingen anmeldelser – heller ikke i VoiceOver eller på "Sådan rangerer vi" (testet i `trustpilot-off.test.ts`).
- [ ] Test på en rigtig iPhone via TestFlight: ring, hjemmeside, rute, del, placering til/fra, mørk tilstand, stor tekst.
- [ ] Kortet: Apple-logo og "Legal" er synlige over kortene i bunden (lys/mørk, stor tekst). Klynger zoomer ind, "Hele DK" viser hele landet.
- [ ] "Beskriv dit problem": prøv eksemplerne, og tjek at budgetgrupperne passer med virksomhedernes priser.

## 4. App Store Connect

- [ ] Tekster, søgeord og noter fra `app-store-tekster.md` (dansk) og `app-store-texts-en.md` (engelsk, til alle andre lande).
- [ ] App Privacy: "Indsamler ikke data".
- [ ] Aldersgrænse 4+.
- [ ] Skærmbilleder (6,9").
- [ ] Support- og privatlivs-URL virker uden login.
- [ ] Indsend til review. Typisk svartid er 1–3 dage.

## Hyppige afvisningsgrunde for apps som FixMatch

| Retningslinje | Risiko | Sådan undgår I den |
| --- | --- | --- |
| 2.1 App Completeness | Demodata eller tomme lister | Indsend kun med rigtige, samtykkede virksomheder |
| 2.2 Beta Testing | Demoversion i App Store | Demoer og betaversioner hører hjemme på TestFlight |
| 2.1 Review fra USA | Apple tester ofte fra USA og ser en tom app | Skriv i review-noterne, hvilken by de skal vælge (Mere → Placering), og vælg kun lande med virksomheder |
| 4.2 Minimum Functionality | "Bare en hjemmeside" | Appen har native kort, sammenligning, filtre, placering – fremhæv det i review-noterne |
| 5.1.1 Privacy | Manglende privatlivspolitik | Link i appen ✅ og i App Store Connect |
| 5.2.2 Tredjepartsindhold | Trustpilot-data uden tilladelse | Partneraftale med Trustpilot – Apple kan bede om dokumentation |
| 5.2.1 Varemærker | Trustpilot-logo eller andres navne | Brug kun ordet "Trustpilot" som kilde, følg deres brand-regler |
