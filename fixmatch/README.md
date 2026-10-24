# FixMatch

**Find den rette håndværker eller mekaniker – sammenlign pris, afstand og Trustpilot-anmeldelser, og ring direkte.**

FixMatch er en iPhone-app (Expo / React Native) på dansk og engelsk til Danmark, Sverige, Norge, Tyskland, Storbritannien og USA. Brugeren vælger et fag eller en opgave og får lokale virksomheder rangeret efter en gennemsigtig FixMatch-score. Hver virksomhed har en side med telefonnummer, hjemmeside, prisinterval i landets valuta, TrustScore, registreringsnummer (fx CVR), autorisation og åbningstider.

| Fag | VVS'er · Elektriker · Tømrer · Murer · Mekaniker · Maler · Tagdækker · Låsesmed |
| --- | --- |
| Sammenligning | Pris (timepris + eksempelpriser), afstand (luftlinje) og Trustpilot (TrustScore, antal anmeldelser) |
| Kontakt | Ring op, hjemmeside, rutevejledning, del |
| Beskriv dit problem | Fritekst + budget → fag og opgave genkendes på telefonen, og virksomhederne grupperes efter, om deres egen pris passer til budgettet |
| Kort | Apple Kort (MapKit) med alle virksomheder, farvet efter fag, klynger og swipe-kort. Se `docs/jura/apple-kort.md` |
| Sprog og lande | Dansk og engelsk (følger telefonen). Priser sammenlignes kun inden for ét land og vises i landets valuta. Miles i UK og USA. Byer i hele verden kan vælges |
| Andet | Personlige prioriteter, filtre, sammenlign op til 3, gemte, søgning, akut/døgnvagt, mørk tilstand, VoiceOver |
| Jura indbygget | "Sådan rangerer vi" (mfl. § 6 a), "Om anmeldelser" (mfl. § 6 b), annoncer altid markeret, priser inkl. moms, "Rapportér fejl" (DSA art. 16) |

---

## Kom i gang (5 minutter)

Krav: [Node.js 20+](https://nodejs.org) og en iPhone med appen **Expo Go** (gratis i App Store).

```bash
cd fixmatch
npm install
npx expo start
```

Scan QR-koden med iPhonens kamera → appen åbner i Expo Go. Alt du ændrer i koden, vises med det samme.

- **Web-demo** (til projektor eller jury på bærbar): `npx expo start --web`, eller `npm run export:web` og læg mappen `dist/` på fx Netlify, Vercel eller GitHub Pages.
- **Tjek koden**: `npm run check` (TypeScript, lint og 96 tests).
- **Engelsk version**: på iPhone under Indstillinger → FixMatch → Sprog. På web: tilføj `?lang=en` til adressen.

> Appen starter i **demotilstand** med 224 fiktive virksomheder: 104 i København, Aarhus, Odense og Aalborg og 24 i hver af Stockholm, Oslo, Berlin, London og New York. De er tydeligt markeret, telefonnumre er i nummerserier til fiktion eller ugyldige, registreringsnumre er ugyldige, og opkald er slået fra.

**Fremvisning og lancering uden CVR:** se `docs/lancering/global-lancering.md`. Kort fortalt: vis appen via TestFlight (demodata er tilladt der), Expo Go, iOS-simulatoren eller webdemoen. App Store kræver rigtige virksomheder, men ikke et CVR-nummer.

## Fotos

Fotos er rigtige fotos fra [Pexels](https://www.pexels.com/license/) (gratis til kommerciel brug). De hentes fra Pexels' CDN og gemmes på telefonen. Før App Store-udgivelsen bør de lægges ind i appen, så den også virker offline:

```bash
npm run photos:bundle   # kræver internet; henter alle fotos til assets/photos/
```

Fotos til de rigtige virksomheder: brug virksomhedens egne billeder (med deres tilladelse – det står i samtykket) og angiv en https-adresse i kolonnen `billede`.

## Kortdata og byer

- Byer i hele verden: [GeoNames](https://www.geonames.org) (CC BY 4.0) via `all-the-cities`. Genbyg med `npm run data:cities`.
- Kystlinjer på webkortet: [Natural Earth](https://www.naturalearthdata.com) (public domain) via `world-atlas`. Genbyg med `npm run data:map`.
- På iPhone bruges Apple Kort. Der gemmes ingen data fra Apple i appen.

## Hjemmeside (privatlivspolitik og support)

Apple kræver en offentlig privatlivspolitik og en support-side. De bygges ud fra de samme tekster som skabelonerne i `docs/jura/`:

```bash
npm run website:build   # → dist-website/ med forside, privatliv, vilkår og support på dansk og engelsk
```

1. Udfyld først navn og e-mail i `src/constants/app-info.ts`. Felterne i `{{…}}` i teksterne udfyldes derfra, og linjer, der starter med `>`, er noter til jer og kommer ikke med.
2. Læg mappen online. Den nemmeste vej er [Netlify Drop](https://app.netlify.com/drop): træk `dist-website/` ind, og I får en gratis adresse. Domænet `fixmatch.dk` kan kobles på senere.
3. Ret domænet i `src/constants/app-info.ts`, hvis I bruger en anden adresse. Stierne (`/privatliv/`, `/en/privacy/` osv.) skal være de samme.

## Rigtige virksomheder: fra regneark til app

1. Kopiér `templates/virksomheder-skabelon.csv` til Google Sheets (Filer → Importér) eller Excel. Én række pr. virksomhed.
2. Udfyld **kun** oplysninger, virksomheden har godkendt. Kolonnen `samtykke_dato` skal udfyldes – rækker uden samtykke afvises.
3. Eksportér som CSV og kør:

   ```bash
   npm run import:businesses -- ~/Downloads/virksomheder.csv
   ```

   Scriptet tjekker CVR, telefonnummer, postnummer, priser, Trustpilot-link, åbningstider og autorisation og skriver fejl på dansk. Gyldige rækker gemmes i `src/data/live-businesses.json`.

4. Byg appen med `EXPO_PUBLIC_FIXMATCH_DATA=live` (er sat i `eas.json` under `production`).

Formater i regnearket:

| Kolonne | Eksempel |
| --- | --- |
| `kategorier` | `vvs` eller `toemrer\|tagdaekker` |
| `prisexempler` | `Stoppet afløb=1200-2500; Nyt trægulv=350-650/m2` |
| `autorisationer` | `vvs:12345\|kloak:23456` |
| `aabningstider` | `man-tor 07:00-15:30; fre 07:00-14:00; lør-søn lukket` |
| `doegnvagt`, `annonce` | `ja` / `nej` |
| `breddegrad`, `laengdegrad` | Slå adressen op i Danmarks Adresseregister (DAR) via [Datafordeleren](https://datafordeler.dk) eller Adressevælgeren (gratis, åbne data). DAWA lukkede 1. oktober 2026. Kopiér **ikke** koordinater fra Google Maps eller Apple Kort – deres vilkår forbyder at bygge databaser af dem. Tomme felter → postnummerets midtpunkt |

**Opdatering uden ny app-version:** læg `live-businesses.json` på en https-adresse og sæt `EXPO_PUBLIC_FIXMATCH_DATA_URL`. Appen henter listen ved opstart og bruger den indbyggede, hvis den er offline.

## Til App Store

Du behøver **ikke** en Mac – EAS bygger appen i skyen.

1. Opret en Apple Developer-konto (99 USD/år). En personlig konto er nok, og der kræves intet CVR-nummer. Jeres navn står så som udgiver. Som virksomhed kræver det et D-U-N-S-nummer (gratis, tager nogle dage).
2. Opret appen i [App Store Connect](https://appstoreconnect.apple.com) med bundle id `dk.fixmatch.app`. Kopiér App ID ind i `eas.json` (`ascAppId`).
3. Udfyld udgiveroplysningerne i `src/constants/app-info.ts` (navn som på Apple-kontoen, e-mail, hjemmeside, privatlivs-URL). CVR kan stå tomt.
4. Byg og upload:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build -p ios --profile testflight   # demodata, til jury og test
   npx eas-cli@latest submit -p ios --profile testflight
   ```

   Når de rigtige virksomheder er importeret: `--profile production`. Tjek først med `npm run check:release`. EAS kører samme tjek automatisk (`eas-build-pre-install` i `package.json`) og stopper buildet, hvis der mangler rigtige virksomheder, hvis der er demodata eller manglende samtykke, eller hvis `app-info.ts` stadig har TODO-felter.

5. Følg `docs/app-store/tjekliste.md` og brug teksterne i `docs/app-store/app-store-tekster.md`.

> **Trustpilot er slået fra i `production`** (`EXPO_PUBLIC_FIXMATCH_TRUSTPILOT=off` i `eas.json`). Så skjules TrustScores, anmeldelsesfiltre og anmeldelsesvægt. Skift til `on`, når partneraftalen med Trustpilot er underskrevet.
>
> **Byg aldrig production med demodata.** Apple afviser apps med pladsholder-indhold (retningslinje 2.1), og Trustpilot-scorer må først vises, når der er en aftale med Trustpilot (se `docs/jura/`).

## Projektstruktur

```
src/app/            Skærme (Expo Router): faner, kategori, virksomhed, sammenlign, søg, filtre …
src/components/     UI-komponenter (kort, knapper, Trustpilot-visning, Apple Kort og webkort)
src/lib/            Logik: rangering, filtre, åbningstider, søgning, formatering, kontakt, lande
src/i18n/           Sprog: dansk tekst er nøglen, `en.ts` er den engelske ordbog
src/data/           Fag, fotos, postnumre, demodata, live-data og tekster
src/state/          App-tilstand (gemmes kun på telefonen)
scripts/            Import af regneark, fotos, postnumre, verdensbyer, kortkonturer, demodata og ikoner
templates/          Regnearksskabelon til virksomheder
docs/app-store/     App Store-tekster, privatlivs-svar og tjekliste
docs/jura/          Samtykke, privatlivspolitik, vilkår, Trustpilot, Apple Kort og kontakt-regler
docs/lancering/     Global lancering, udgivelse uden CVR og fremvisning
website/            Forside og support til hjemmesiden (resten kommer fra docs/jura/)
```

## Sådan virker FixMatch-scoren

`src/lib/ranking.ts` – og forklaret for brugeren på siden "Sådan rangerer vi":

- **Pris**: timeprisens midtpunkt sammenlignet med de andre i faget (billigst = 1, dyrest = 0).
- **Afstand**: `e^(−km/15)` – 0 km = 1, 15 km ≈ 0,37.
- **Anmeldelser**: Bayesiansk gennemsnit af TrustScore (20 "neutrale" anmeldelser på 3,9 lægges til) fra 2,5–5,0 → 0–1.
- **Score** = vægtet sum × 100. Brugeren vælger vægtene. Betaling (`promoted`) påvirker aldrig scoren.

Ændrer I formlen, så opdatér teksten i `src/data/content.ts` – markedsføringsloven § 6 a kræver, at rangeringen er beskrevet korrekt.
