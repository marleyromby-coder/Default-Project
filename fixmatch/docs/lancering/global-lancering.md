# Global lancering – uden CVR

*Skrevet 24. oktober 2026. Det er en gennemgang af kilderne, ikke juridisk rådgivning.*

## Kort fortalt

- **I kan godt udgive appen uden CVR-nummer.** En personlig Apple Developer-konto er nok. Jeres navn står så som udgiver i App Store.
- **Appen er klar til Europa:** dansk og engelsk, fem lande med egen valuta (Danmark, Sverige, Norge, Tyskland og Storbritannien), miles i UK, og byer i hele verden kan vælges som placering.
- **Der er kun én ting, der blokerer App Store: rigtige virksomheder.** Demoversionen med fiktive virksomheder må ikke ligge i App Store (retningslinje 2.2), men den må gerne ligge på TestFlight.
- **Til konkurrencen: brug TestFlight.** Så kan juryen installere appen på deres egen iPhone. Expo Go og iOS-simulatoren er alternativer.

## Hvad blokerer App Store – og hvad gør ikke?

| Punkt | Status | Hvad I skal gøre |
| --- | --- | --- |
| Fiktive demovirksomheder | ❌ Blokerer | App Store-retningslinje 2.2: demoer hører hjemme på TestFlight. Udgiv i App Store, når I har rigtige virksomheder |
| Rigtige virksomheder med samtykke og priser | ⏳ Mangler | Få 20–30 virksomheder i én by med (skabelon: `docs/jura/samtykke-virksomhed.md`), og importér dem (`npm run import:businesses`) |
| Trustpilot | ✅ Løst | Slået fra i alle builds (App Store, TestFlight, Xcode og webdemoen), indtil der er en partneraftale. Så nævner appen og App Store-teksten ingen anmeldelser |
| Spærre mod fejl-builds | ✅ Løst | `scripts/check-release.js` stopper et App Store-build uden rigtige virksomheder, med demodata eller manglende samtykke, eller med TODO-felter i `app-info.ts` |
| Apple Kort | ✅ Løst | Godkendt via udvikleraftalen. Se `docs/jura/apple-kort.md` |
| Privatlivspolitik og vilkår på en hjemmeside | ⏳ Klar til at lægge online | `npm run website:build` bygger forside, privatlivspolitik, vilkår og support på dansk og engelsk. Læg `dist-website/` på fx Netlify. Apple kræver et link til privatlivspolitikken og en support-side |
| Trader-status i EU | ⏳ Mangler | Se afsnittet nedenfor |
| CVR-nummer | ✅ Ikke nødvendigt | Kræves ikke af Apple. Se afsnittet om skat og moms |
| Apple tester ofte fra USA | ✅ Løst | Appen regner kun lande med virksomheder som åbne og viser ellers "FixMatch er endnu ikke i [land]". Review-noterne fortæller, hvilken by de skal vælge (`docs/app-store/app-store-tekster.md`) |
| Engelske App Store-tekster | ✅ Klar | `docs/app-store/app-store-texts-en.md` |

Selve appen overtræder ikke noget. Det, der mangler, er rigtige data og et par oplysninger i App Store Connect.

## Fremvisning til konkurrencen

| Metode | Kræver | Fordele | Ulemper |
| --- | --- | --- | --- |
| **TestFlight** (anbefalet) | Jeres Apple Developer-konto. Én kommando: `npx eas-cli@latest build -p ios --profile testflight --auto-submit` – se `docs/lancering/testflight.md`. Med en Mac kan I også bygge i Xcode: `docs/lancering/xcode.md` | Juryen installerer appen på sin egen iPhone. Op til 100 interne testere uden gennemgang og op til 10.000 eksterne via et offentligt link efter en kort Beta App Review. Apple Kort virker | Hver build kan bruges i 90 dage |
| **Expo Go** | Gratis Expo Go-app fra App Store. `npx expo start` på en computer | Ingen build. Virker med det samme på jeres egen iPhone, også med Apple Kort (`react-native-maps` er inkluderet i Expo Go) | Kun på telefoner på samme netværk, eller med `--tunnel`. Ikons- og app-navn er Expo Go's |
| **iOS-simulator** | En Mac med Xcode. `npx eas-cli@latest build -p ios --profile simulator` | God til at vise på en storskærm | Kræver en Mac |
| **Webdemo** | En browser. `npm run export:web` | Virker overalt, også på en projektor | Ikke Apple Kort, men et forenklet kort. `?lang=en` viser den engelske version |

**Widgets** vises kun i TestFlight-buildet (ikke i Expo Go, simulatoren uden Mac eller webdemoen). Læg "Hurtig hjælp" på hjemmeskærmen og låseskærmen før fremvisningen.

**Tip til juryen:** Vis appen på dansk i København. Skift så placering til London (Mere → Placering, søg "London") og sprog til engelsk (Mere → Sprog → Åbn Indstillinger). Så ser de pund, miles og engelske tekster. I webdemoen skifter Mere → Sprog med det samme.

## Udgivelse uden CVR

### Apple Developer-konto

En personlig konto (99 USD om året) kan udgive apps i alle lande. Jeres eget navn står som udgiver ("Seller") i App Store. Senere kan I skifte til en organisationskonto, når der er et firma, men det kræver, at appen overføres.

### Trader-status i EU (Digital Services Act)

Alle udviklere skal angive i App Store Connect under *Business → Compliance → Digital Services Act*, om de er erhvervsdrivende ("trader"):

- **Erhvervsdrivende:** Tjener I penge på appen (salg, abonnementer, annoncer), er I erhvervsdrivende. For en personlig konto viser App Store i EU så **jeres adresse, telefonnummer og e-mail** offentligt. Brug evt. en c/o-adresse eller en postboks, og et separat telefonnummer.
- **Ikke erhvervsdrivende:** Er appen gratis og uden indtægter, kan I svare nej, og appen kan stadig ligge i EU.
- Angiver I ikke noget, fjerner Apple appen fra App Store i EU.

### Skat og moms i Danmark

- Indtægter fra appen skal oplyses til Skattestyrelsen, også uden CVR (som hobby- eller virksomhedsindkomst).
- Momsregistrering (og dermed CVR) bliver nødvendig, når momspligtigt salg passerer **50.000 kr.** Tjek på [skat.dk](https://skat.dk), hvordan perioden opgøres i dag.
- Sælger I gennem App Store, håndterer Apple moms over for kunderne. Sælger I Pro-abonnementer direkte til virksomheder, gør I det selv.
- Plan: start gratis uden indtægter → stift en enkeltmandsvirksomhed (gratis på virk.dk), når de første virksomheder skal betale.

### GDPR gælder stadig

Selv uden firma er I dataansvarlige for oplysninger om virksomheder og kontaktpersoner. Samtykkeerklæringen og privatlivspolitikken i `docs/jura/` gælder uændret. Skriv jeres navn i stedet for firmanavn og CVR.

## Få virksomheder med hurtigt

Virksomhederne tilmelder sig selv i appen (Mere → Tilmeld din virksomhed) eller på hjemmesiden (`/tilmeld/` og `/en/sign-up/`) og giver samtykke med tre flueben. I tjekker tilmeldingen i Supabase og importerer den med `npm run import:businesses` – også fra London, Stockholm, Oslo og Berlin. Arbejdsgangen og reglerne for at kontakte virksomheder i hvert land står i `docs/jura/kontakt-af-virksomheder.md`, og opsætningen i `supabase.md`.

## Global udrulning

| Fase | Lande | Hvorfor | Hvad der skal til |
| --- | --- | --- | --- |
| 1 | Danmark | Hjemmemarked, sprog og jura er på plads | Rigtige virksomheder i én by først, fx København |
| 2 | Sverige og Norge | Samme kultur og prisniveau, høj iPhone-andel | Virksomheder i Stockholm og Oslo. Sverige: nævn ROT-fradrag på prissiden. Norge er ikke i EU, men har EØS-regler |
| 3 | Tyskland og UK (London) | Store markeder. London er én stor by med mange håndværkere, så man kan starte smalt | Tysk oversættelse anbefales. UK: Gas Safe-registrering for gasarbejde |

**App Store-tilgængelighed:** Vælg i App Store Connect kun de lande, hvor der er virksomheder. Ellers ser brugere i andre lande en tom app og giver dårlige anmeldelser. Appen viser selv "FixMatch er endnu ikke i [land]", hvis nogen alligevel åbner den.

**Lokalisering:** Appen skifter sprog efter telefonen (dansk eller engelsk; alle andre får engelsk). Nyt sprog: tilføj en ordbog i `src/i18n/` og sproget i `app.json`. Testen `src/__tests__/i18n.test.ts` sikrer, at ingen tekst mangler.

## Jura i de nye lande

Reglerne om rangering og anmeldelser er stort set ens i hele EU, fordi de kommer fra samme direktiv. UK har tilsvarende regler. FixMatch er bygget til at overholde dem alle: åben rangering, mærkede annoncer, ingen betalt placering og ingen redigering af anmeldelser.

| Område | EU (Danmark, Sverige, Tyskland) og Norge (EØS) | UK |
| --- | --- | --- |
| Rangering og annoncer | Omnibus-direktivet (2019/2161): oplys hovedparametrene, og markér betalt placering. I Danmark markedsføringsloven § 6 a | Digital Markets, Competition and Consumers Act 2024 (DMCC) |
| Anmeldelser | Oplys om og hvordan anmeldelser kontrolleres (i Danmark § 6 b). Falske anmeldelser er forbudt | DMCC: forbud mod falske anmeldelser siden 6. april 2025. Den, der viser anmeldelser, skal forebygge og fjerne falske |
| Persondata | GDPR | UK GDPR |
| Platforme | Digital Services Act og P2B-forordningen | Online Safety Act gælder næppe: ingen brugerindhold, og der søges kun i FixMatch' egen database |
| Priser | Totalpris inkl. moms | Inkl. VAT |
| Håndværkere | Autorisation: Sikkerhedsstyrelsen (DK), Elsäkerhetsverket (SE), DSB (NO), Handwerkskammer (DE) | Gas Safe Register |

Norge er med i EØS og har stort set de samme forbrugerregler. Nogle EU-forordninger, fx DSA, gælder først i Norge, når de er optaget i EØS-aftalen.

## Kilder

- [App Store Review Guidelines (2.2 om demoer)](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight-oversigt, App Store Connect Help](https://developer.apple.com/help/app-store-connect/test-a-beta-version/overview-of-testflight/)
- [Apple om trader-oplysninger i EU, 9to5Mac](https://9to5mac.com/2025/02/18/apple-trader-information-app-store/)
- [react-native-maps i Expo Go, Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/)
- [Hvornår skal jeg momsregistreres? Dinero](https://dinero.dk/tips/hvornaar-skal-jeg-momsregistreres)
- [DMCC Act – forbud mod falske anmeldelser, CMS](https://cms.law/en/gbr/legal-updates/no-more-faux-five-stars-the-dmcc-act-bans-fake-reviews)
- [FTC's endelige regel om anmeldelser, Federal Register](https://govinfo.gov/content/pkg/FR-2024-08-22/pdf/2024-18519.pdf)
- [Omnibus-direktivet, Addleshaw Goddard](https://www.addleshawgoddard.com/en/insights/insights-briefings/2020/competition/the-eu-omnibus-directive--time-to-prepare-for-strengthened-consumer-laws/)
