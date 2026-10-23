# Tjekliste før App Store

Kryds af i rækkefølge. ✅ = allerede klaret i koden.

## 1. Konto og virksomhed

- [ ] Stift virksomheden (fx enkeltmandsvirksomhed eller ApS) og få et CVR-nummer.
- [ ] Hent et gratis D-U-N-S-nummer til virksomheden (kræves for at tilmelde en organisation).
- [ ] Tilmeld Apple Developer Program som **organisation** (99 USD/år). Som privatperson står jeres personlige navn som udgiver.
- [ ] Accepter Apple Developer Program License Agreement. Det er tilladelsen til Apple Kort (bilag 6). Gem dato og version (`docs/jura/apple-kort.md`).
- [ ] Angiv **trader-status** i App Store Connect (krav i EU efter Digital Services Act). Som erhvervsdrivende vises adresse, telefon og e-mail på App Store-siden i EU.
- [ ] Registrér domænet `fixmatch.dk` (punktum.dk) og overvej varemærkeregistrering af "FixMatch" hos Patent- og Varemærkestyrelsen.

## 2. Indhold og rettigheder

- [ ] Skriftligt samtykke fra hver virksomhed (`docs/jura/samtykke-virksomhed.md`).
- [ ] Skriftlig partneraftale med Trustpilot, før TrustScores vises (`docs/jura/trustpilot.md`). Indtil da: vis ikke Trustpilot-data i den offentlige version.
- [ ] Virksomhedernes egne billeder og logoer er med i samtykket.
- [ ] `npm run import:businesses` kører uden fejl.
- [ ] `npm run photos:bundle` er kørt, så fotos ligger i appen.
- [ ] Udfyld `src/constants/app-info.ts` (virksomhedsnavn, CVR, e-mail, URL'er).
- [ ] Privatlivspolitik og vilkår ligger på offentlige URL'er.

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
- [ ] Test på en rigtig iPhone via TestFlight: ring, hjemmeside, rute, del, placering til/fra, mørk tilstand, stor tekst.
- [ ] Kortet: Apple-logo og "Legal" er synlige over kortene i bunden (lys/mørk, stor tekst). Klynger zoomer ind, "Hele DK" viser hele landet.
- [ ] "Beskriv dit problem": prøv eksemplerne, og tjek at budgetgrupperne passer med virksomhedernes priser.

## 4. App Store Connect

- [ ] Tekster, søgeord og noter fra `app-store-tekster.md`.
- [ ] App Privacy: "Indsamler ikke data".
- [ ] Aldersgrænse 4+.
- [ ] Skærmbilleder (6,9").
- [ ] Support- og privatlivs-URL virker uden login.
- [ ] Indsend til review. Typisk svartid er 1–3 dage.

## Hyppige afvisningsgrunde for apps som FixMatch

| Retningslinje | Risiko | Sådan undgår I den |
| --- | --- | --- |
| 2.1 App Completeness | Demodata eller tomme lister | Indsend kun med rigtige, samtykkede virksomheder |
| 4.2 Minimum Functionality | "Bare en hjemmeside" | Appen har native kort, sammenligning, filtre, placering – fremhæv det i review-noterne |
| 5.1.1 Privacy | Manglende privatlivspolitik | Link i appen ✅ og i App Store Connect |
| 5.2.2 Tredjepartsindhold | Trustpilot-data uden tilladelse | Partneraftale med Trustpilot – Apple kan bede om dokumentation |
| 5.2.1 Varemærker | Trustpilot-logo eller andres navne | Brug kun ordet "Trustpilot" som kilde, følg deres brand-regler |
