# Apple Kort i FixMatch – må vi det, og hvordan får vi godkendelsen?

*Gennemgået 23. oktober 2026 mod Apple Developer Program License Agreement (DPLA), senest opdateret 13. oktober 2026. Det er Apples egen aftaletekst, ikke juridisk rådgivning. Læs den version, I selv accepterer i jeres udviklerkonto. Den er bindende.*

## Kort svar

**Ja, I må bruge Apple Kort i appen, og det er gratis.** Der findes ingen særskilt ansøgning eller kontrakt om kort. "Godkendelsen" består af to ting:

1. **Apple Developer Program-aftalen (DPLA).** Den accepterer I, når virksomheden tilmelder sig Apple Developer Program. Aftalen giver ret til at bruge kortet gennem Apples kortværktøj, MapKit, og bilag 6 ("Attachment 6") indeholder reglerne for kortet.
2. **App Review.** Apple gennemgår appen, inden den kommer på App Store. Apple kan til enhver tid gennemgå jeres brug af kortet og trække adgangen tilbage (bilag 6, punkt 4).

Det er efter alt at dømme også sådan Nyx har fået lov. Nyx Systems ApS er en københavnsk virksomhed med en iPhone-app. En iPhone-app, der viser et Apple-kort, bruger MapKit på præcis de samme vilkår. Vi kan ikke se Nyx' kode eller aftaler, så det kan vi ikke bekræfte. Men der findes ingen anden officiel vej til Apple Kort end MapKit, MapKit JS og Apple Maps Server API (bilag 6, punkt 1.1).

FixMatch bruger allerede MapKit. Kortbiblioteket `react-native-maps` bruger Apple Kort på iPhone som standard og kræver ingen API-nøgle.

## Reglerne – og hvordan FixMatch overholder dem

| Regel i DPLA | Hvad det betyder | Status i FixMatch |
| --- | --- | --- |
| Kun adgang via MapKit, MapKit JS eller Maps Server API (bilag 6, 1.1) | Ingen "skrabning" af kortet eller uofficielle løsninger | ✅ MapKit via `react-native-maps` |
| Apple-logoet, copyright og "Legal"-linket må ikke fjernes, skjules eller ændres (bilag 6, 2.1). Apple kan trække adgangen tilbage, hvis logo eller links skjules (punkt 4) | Kortene i bunden af skærmen må ikke dække "Legal" | ✅ `legalLabelInsets` og `mapPadding` flytter logo og link op over kortene. **Tjek det på en rigtig iPhone før indsendelse** (lys og mørk tilstand) |
| Ingen massedownload, skrabning eller afledte databaser med Apples kortdata (2.2 og 2.3) | Adresser og koordinater i vores virksomhedsdatabase må **ikke** slås op hos Apple | ✅ Koordinaterne kommer fra virksomhederne selv (CSV-import) eller fra postnummerets midtpunkt (åbne data). Skal I slå adresser op, så brug Danmarks Adresseregister via [Datafordeleren](https://datafordeler.dk). DAWA lukkede 1. oktober 2026 ([Klimadatastyrelsen](https://www.klimadatastyrelsen.dk/om-klimadatastyrelsen/nyheder/nyhedsarkiv/2026/jul/dawa-lukker-d-1-oktober-2026)) |
| Kortdata må ikke gemmes ud over kortvarig cache (2.5) | Ingen lagring af kortfliser, søgeresultater eller ruter | ✅ Appen gemmer ingen kortdata |
| Kortdata må kun vises på et Apple-kort (2.4) | Bruger I senere Apples søgning, skal resultatet vises på Apple-kortet | ✅ Bruges ikke i dag |
| Der må ikke tages betaling alene for adgang til kortet (2.6) | Kortet skal være gratis for brugerne | ✅ Appen er gratis. Et Pro-abonnement for virksomheder er i orden, fordi der ikke betales for kortet |
| Egne data oven på kortet er jeres ansvar, også at de passer med kortet (DPLA 3.3.x, F(iii)) | Forkerte pins er jeres fejl | ✅ Importen afviser koordinater uden for Danmark. ⚠️ Bed virksomhederne bekræfte deres pin |
| Appen må ikke designes eller markedsføres til nødsituationer eller livreddende formål (F(i)) | "Akut hjælp" handler om håndværk, ikke om 112 | ✅ Forsiden skriver "Ved fare for liv eller brand: ring 112". Kald det aldrig "nødhjælp" i markedsføring |
| Placering kræver samtykke, og formålet skal forklares korrekt (F(ii) og F(iv)) | Systemets dialog om placering skal vises og respekteres | ✅ Kun "Når appen bruges", med dansk forklaring. Uden samtykke vælger brugeren en by |
| Rutevejledning trin for trin kræver en særlig ansvarsfraskrivelse (F(iii)) | Gælder kun apps med egen navigation | ✅ "Rutevejledning" åbner Apples egen Kort-app, så kravet gælder ikke |
| Apple kan ændre, begrænse eller lukke tjenesten (2.7 og 3.1) | Hav en plan B | ✅ Lister og søgning virker uden kortet |

## Kvoter og pris

- **iPhone-app (MapKit):** indgår i medlemskabet af Apple Developer Program (99 USD om året). Apple kan begrænse antallet af forespørgsler (bilag 6, 2.7), men sætter ingen fast pris på kortvisninger.
- **Hjemmeside (MapKit JS):** gratis op til 250.000 kortvisninger og 25.000 servicekald om dagen pr. medlemskab ([Apple, MapKit JS](https://developer.apple.com/maps/mapkitjs/)). Det kræver et Maps ID og en MapKit JS-nøgle fra udviklerkontoen. Webdemoen bruger i dag en kystlinje fra Natural Earth (public domain) og ingen nøgle.
- **Android (hvis det kommer):** her bruger `react-native-maps` Google Maps. Det kræver en API-nøgle, en betalingskonto hos Google og accept af Google Maps Platforms vilkår, som har deres egne regler om visning af ophav og cache.

## Navn og varemærker

- Brug ikke "Apple" eller "Apple Kort" i appnavn, undertitel eller søgeord. App Store Review Guidelines 2.3.7 forbyder varemærker i metadata.
- I teksten må I gerne skrive, at kortet er Apple Kort, når det er en saglig oplysning. I må ikke bruge Apples logo eller antyde, at Apple anbefaler FixMatch.
- SF Symbols-ikonerne må kun bruges på Apples platforme. Webdemoen bruger derfor Material Symbols (se `src/components/ui/icon.tsx`).

## Nyx som inspiration – ikke som kopi

Idéen (et stort kort med pins og kort, man kan swipe i bunden) er ikke beskyttet. I må til gengæld ikke kopiere Nyx' navn, logo, grafik, tekster eller et forvekslelignende udtryk. Det er beskyttet af ophavsretsloven og markedsføringsloven (§ 3 om god markedsføringsskik og § 22 om forveksling af kendetegn). FixMatch har egne farver, eget logo og egne pins, og kortet vises med Apples standarddesign.

## Godkendelsen trin for trin

1. **Virksomhed og D-U-N-S-nummer.** Apple kræver et D-U-N-S-nummer for organisationer. Det er gratis og kan slås op eller oprettes via Apples [D-U-N-S-opslag](https://developer.apple.com/enroll/duns-lookup/).
2. **Tilmeld Apple Developer Program som organisation** (99 USD om året). Accepter DPLA'en. **Det er tilladelsen til Apple Kort.** Gem dato og version som dokumentation.
3. **Ingen ekstra ansøgning for iPhone-appen.** MapKit er slået til for alle apps.
4. **(Valgfrit) Web:** opret et Maps ID og en MapKit JS-nøgle under *Certificates, Identifiers & Profiles → Keys*, før kortet kommer på fixmatch.dk.
5. **Test på en rigtig iPhone** (`eas build --profile testflight`): Apple-logoet og "Legal" skal være synlige over kortene i bunden, også med stor tekst og i mørk tilstand.
6. **Noter til App Review:** skriv, at kortet er Apple MapKit, at pins er virksomhedernes egne adresser, som de har givet samtykke til, og at appen ikke gemmer kortdata. Teksten står i `docs/app-store/app-store-tekster.md`.
7. **Når Apple opdaterer DPLA'en**, skal den accepteres igen i udviklerkontoen. Ellers kan I ikke indsende opdateringer. Læs bilag 6 igen ved hver ny version.

## Kilder

- Apple Developer Program License Agreement, afsnit 3.3.x "Location and Maps" og Attachment 6 "Additional Terms for the use of the Apple Maps Service": <https://developer.apple.com/support/terms/apple-developer-program-license-agreement/>
- MapKit JS og gratis kvote: <https://developer.apple.com/maps/mapkitjs/>
- App Store Review Guidelines: <https://developer.apple.com/app-store/review/guidelines/>
- Nyx' App Store-side: <https://apps.apple.com/us/app/nyx-nightlife-platform/id1207580572>
- `react-native-maps` (Apple Kort som standard på iPhone): <https://github.com/react-native-maps/react-native-maps>
