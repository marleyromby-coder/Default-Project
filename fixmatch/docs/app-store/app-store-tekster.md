# App Store-tekster for FixMatch (dansk)

Kopiér felterne direkte ind i App Store Connect → appen → Distribution → *Dansk*. Tegngrænser er tjekket.

## App-oplysninger

| Felt | Værdi | Tegn |
| --- | --- | --- |
| Navn | `FixMatch: Find håndværker` | 25 / 30 |
| Undertitel (Trustpilot fra) | `Sammenlign pris og afstand` | 26 / 30 |
| Undertitel (Trustpilot til) | `Sammenlign pris & anmeldelser` | 29 / 30 |
| Primær kategori | Livsstil (Lifestyle) | |
| Sekundær kategori | Hjælpeværktøjer (Utilities) | |
| Aldersgrænse | 4+ (ingen af spørgsmålene besvares med ja) | |
| Pris | Gratis | |
| Bundle ID | `dk.fixmatch.app` | |
| SKU | `fixmatch-ios-1` | |

**Søgeord** (97 / 100 tegn – ingen mellemrum efter komma, og ord fra navn/undertitel gentages ikke):

```
vvs,elektriker,tømrer,murer,mekaniker,værksted,maler,tagdækker,låsesmed,bilværksted,blikkenslager
```

Brug ikke "Trustpilot" eller konkurrenters navne som søgeord – Apple afviser brug af andres varemærker (retningslinje 2.3.7).

Standard er **Trustpilot fra** (`production` i `eas.json`), indtil partneraftalen er underskrevet. Så viser appen ingen anmeldelser, og App Store-teksten må heller ikke love dem (retningslinje 2.3.1).

**Reklametekst** – kan ændres uden ny version.

Trustpilot fra (142 / 170):

```
Ny: Beskriv dit problem med dine egne ord, sæt et budget, og se hvilke lokale håndværkere der passer – med timepris inkl. moms, før du ringer.
```

Trustpilot til (141 / 170):

```
Ny: Sammenlign op til tre håndværkere side om side – timepris inkl. moms, afstand og TrustScore. Og vælg selv, hvad der betyder mest for dig.
```

## Beskrivelse

```
Mangler du en VVS'er, elektriker, tømrer, murer eller mekaniker? FixMatch finder lokale danske virksomheder og sammenligner dem på det, der betyder noget: pris og afstand. Så sparer du både tid og penge.

BESKRIV DIT PROBLEM – VI MATCHER DIT BUDGET
• Skriv med dine egne ord, fx "køkkenvasken er stoppet", og hvad du vil give
• FixMatch finder faget og viser, hvem der ligger inden for dit budget – og hvem der er tæt på
• Din beskrivelse bliver på telefonen

ALLE HÅNDVÆRKERE PÅ ÉT KORT
• Se hvor virksomhederne holder til i hele Danmark – farvet efter fag
• Swipe gennem dem i kortudsnittet, og ring direkte fra kortet

SE PRISEN FØR DU RINGER
• Timepris og typiske priser for almindelige opgaver – altid inkl. moms
• Kørselsgebyr og prisniveau sammenlignet med andre i faget
• Vejledende priser for fx stoppet afløb, ladestander, stort service og døroplukning

SAMMENLIGN PÅ ÉT SKÆRMBILLEDE
• Vælg op til tre virksomheder og se pris, afstand, døgnvagt og autorisation side om side
• FixMatch-scoren samler pris og afstand – og du bestemmer selv vægtningen
• Sortér efter pris eller afstand, og filtrér på åben nu, døgnvagt og autorisation

TJEKKET OG GENNEMSIGTIGT
• CVR-nummer og autorisation fra Sikkerhedsstyrelsen for el og VVS
• Ingen kan betale sig til en bedre placering. Annoncer er altid tydeligt markeret

RING DIREKTE
• Telefonnummer, hjemmeside og rutevejledning lige ved hånden
• Ingen mellemled, ingen login og ingen gebyrer

FAG I FIXMATCH
VVS'er, elektriker, tømrer, murer, mekaniker, maler, tagdækker og låsesmed – flere kommer til.

DIT PRIVATLIV
FixMatch har ingen login og ingen reklamesporing. Din placering bruges kun på din telefon til at beregne afstande.

Er du håndværker eller værksted? Skriv til os, så kommer du gratis med.
```

## Hvad er nyt (version 1.0)

```
Første version af FixMatch: find, sammenlign og ring til lokale håndværkere og mekanikere.
```

## Links (skal være offentlige, før I indsender)

| Felt | Dansk | Engelsk |
| --- | --- | --- |
| Support-URL | `https://fixmatch.dk/support/` | `https://fixmatch.dk/en/support/` |
| Marketing-URL | `https://fixmatch.dk/` | `https://fixmatch.dk/en/` |
| Privatlivspolitik-URL | `https://fixmatch.dk/privatliv/` | `https://fixmatch.dk/en/privacy/` |

Siderne bygges med `npm run website:build` ud fra `docs/jura/` og `website/` (se README → Hjemmeside). Har I ikke domænet endnu, så brug den gratis adresse, Netlify giver jer, og ret domænet i `src/constants/app-info.ts` og her.

## App Privacy ("privatlivsetiket")

Svar i App Store Connect → App-privatliv:

- **Indsamler du eller dine tredjepartspartnere data fra denne app?** → *Nej, vi indsamler ikke data fra denne app.*

Det er korrekt, fordi:

- placeringen kun bruges på telefonen og aldrig sendes nogen steder hen,
- gemte virksomheder, by og prioriteter kun gemmes lokalt,
- teksten i "Beskriv dit problem" kun behandles på telefonen og ikke sendes nogen steder hen,
- der ikke er login, analyse-SDK'er, reklamer eller crash-rapportering.

Tilføjer I senere analyse (fx Firebase, PostHog) eller login, skal svaret opdateres, før den version indsendes – ellers risikerer I afvisning efter retningslinje 5.1.2.

## Noter til Apples review-team (på engelsk)

Udfyld byen i firkantede parenteser med den by, hvor I har rigtige virksomheder.

```
FixMatch helps people find and compare local tradespeople (plumbers, electricians, carpenters, bricklayers, mechanics, painters, roofers, locksmiths) by price range and distance, and contact them directly by phone or website.

• No account or login is required.
• The app is in English and Danish and follows the device language (Settings → FixMatch → Language).
• Businesses are currently listed in [Copenhagen, Denmark]. If you review from another country, open More → Location and search for "[København]" to see the listings. Elsewhere the app says that FixMatch is not in that country yet.
• Location permission is optional. Without it, the user picks a city manually (More → Location). Location is processed on the device only.
• All listed businesses have given written consent to be listed. Prices are provided by the businesses.
• The map uses Apple MapKit. The pins are the businesses' own addresses; the app does not store any map data.
• "Describe your problem" matches the user's text and budget on the device; the text is not sent anywhere.
• To test: tap "Plumber" → tap a business → "Call" opens the phone dialer. Or tap "Describe your problem" → tap an example → "Find a match".
```

Kun hvis Trustpilot-aftalen er underskrevet og Trustpilot er slået til i buildet, tilføjes:

```
• Trustpilot content is displayed under our partner agreement with Trustpilot A/S (agreement available on request).
```

**Med Trustpilot-aftale** (og `EXPO_PUBLIC_FIXMATCH_TRUSTPILOT=on` i buildet): brug undertitlen og reklameteksten for "Trustpilot til", og ret beskrivelsen sådan:

- Første afsnit: "pris og afstand" → "pris, afstand og kundeanmeldelser".
- Under SAMMENLIGN: tilføj "TrustScore" i første punkt, skriv "pris, afstand og anmeldelser" i andet og "pris, afstand eller anmeldelser" i tredje.
- Under TJEKKET OG GENNEMSIGTIGT: tilføj punktet "• TrustScore og antal anmeldelser fra Trustpilot ved hver virksomhed" øverst.

## Skærmbilleder

Krav: mindst ét sæt til **6,9" iPhone** (1320 × 2868 eller 1290 × 2796 px). Appen understøtter ikke iPad, så iPad-billeder er ikke nødvendige.

Tag billederne på en rigtig iPhone (TestFlight-build med **live**-data, ikke demo). Forslag til rækkefølge og overskrifter:

1. Forside – *"Find den rette håndværker"*
2. Liste over VVS'ere – *"Sammenlign pris og afstand"*
3. Virksomhedsside – *"Pris inkl. moms – før du ringer"*
4. Sammenlign side om side – *"Vælg den bedste på 10 sekunder"*
5. Dine prioriteter – *"Du bestemmer, hvad der tæller"*
