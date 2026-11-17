# App Store-tekster for FixMatch (dansk)

Kopiér felterne direkte ind i App Store Connect → appen → Distribution → *Dansk*. Tegngrænser er tjekket.

## App-oplysninger

| Felt | Værdi | Tegn |
| --- | --- | --- |
| Navn | `FixMatch: Find håndværker` | 25 / 30 |
| Undertitel | `Sammenlign pris & anmeldelser` | 29 / 30 |
| Primær kategori | Livsstil (Lifestyle) | |
| Sekundær kategori | Hjælpeværktøjer (Utilities) | |
| Aldersgrænse | Spørgeskemaet: **Brugergenereret indhold (User-Generated Content): Ja** – anmeldelser, Naborabat-grupper og billeder af udført arbejde, som alle kan rapporteres. **Reklame (Advertising): Ja**, så snart en betalt annonce kan vises (kolonnen `annonce` i regnearket), ellers nej. Alle andre spørgsmål: nej. Brug den aldersgrænse, App Store Connect regner ud | |
| Pris | Gratis | |
| Bundle ID | `dk.fixmatch.app` | |
| SKU | `fixmatch-ios-1` | |

**Søgeord** (97 / 100 tegn – ingen mellemrum efter komma, og ord fra navn/undertitel gentages ikke):

```
vvs,elektriker,tømrer,murer,mekaniker,værksted,maler,tagdækker,låsesmed,bilværksted,blikkenslager
```

Brug ikke "Trustpilot" eller konkurrenters navne som søgeord – Apple afviser brug af andres varemærker (retningslinje 2.3.7).

Anmeldelserne i appen er FixMatch' egne: kun brugere, der har kontaktet virksomheden gennem FixMatch, kan anmelde den. Appen viser ingen stjerner eller scorer fra Trustpilot, Google eller andre sider, så teksterne må heller ikke love det (retningslinje 2.3.1 og 5.2.2). Se `docs/jura/anmeldelser.md`.

**Reklametekst** (142 / 170) – kan ændres uden ny version:

```
Ny: Beskriv dit problem med dine egne ord, sæt et budget, og se hvilke lokale håndværkere der passer – med timepris inkl. moms, før du ringer.
```

## Beskrivelse

```
Mangler du en VVS'er, elektriker, tømrer, murer eller mekaniker? FixMatch finder lokale danske virksomheder og sammenligner dem på det, der betyder noget: pris, afstand og anmeldelser. Så sparer du både tid og penge.

TILBUDSTJEK – ER PRISEN FAIR?
• Tast et tilbud ind, også et du har fået et andet sted, og se om prisen er lav, normal eller høj
• Se hvad det grønne håndværkerfradrag giver tilbage i kroner
• Find virksomheder i nærheden, der tager mindre for samme opgave

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
• Vælg op til tre virksomheder og se pris, afstand, anmeldelser, døgnvagt og autorisation side om side
• FixMatch-scoren samler pris, afstand og anmeldelser – og du bestemmer selv vægtningen
• Sortér efter pris, afstand eller anmeldelser, og filtrér på åben nu, døgnvagt og autorisation

TJEKKET OG GENNEMSIGTIGT
• Verificeret-mærket: FixMatch har selv tjekket CVR, ejer og autorisation
• CVR-nummer og autorisation fra Sikkerhedsstyrelsen for el og VVS
• Anmeldelser kun fra brugere, der har kontaktet virksomheden gennem FixMatch
• Ingen kan betale sig til en bedre placering

RING DIREKTE
• Telefonnummer, hjemmeside og rutevejledning lige ved hånden
• Ingen mellemled og ingen gebyrer. Virksomheden ser dit navn og nummer, så den ved, hvem den taler med

FAG I FIXMATCH
VVS'er, elektriker, tømrer, murer, mekaniker, maler, tagdækker og låsesmed – flere kommer til.

DIT PRIVATLIV
Ingen reklamenetværk og ingen sporing. Betalte annoncer er altid markeret "Annonce" og ændrer ikke rækkefølgen. Din placering bruges kun på din telefon til at beregne afstande. Din bruger ligger på servere i EU, og du kan slette den i appen.

Er du håndværker eller værksted? Tilmeld dig gratis under Mere → Tilmeld din virksomhed.
```

## Hvad er nyt (version 1.0)

```
Første version af FixMatch: find, sammenlign og ring til lokale håndværkere og mekanikere.
```

## Links (skal være offentlige, før I indsender)

| Felt | Dansk | Engelsk |
| --- | --- | --- |
| Support-URL | `https://fixmatchh.netlify.app/support/` | `https://fixmatchh.netlify.app/en/support/` |
| Marketing-URL | `https://fixmatchh.netlify.app/` | `https://fixmatchh.netlify.app/en/` |
| Privatlivspolitik-URL | `https://fixmatchh.netlify.app/privatliv/` | `https://fixmatchh.netlify.app/en/privacy/` |

Siderne bygges med `npm run website:build` ud fra `docs/jura/` og `website/` (se README → Hjemmeside). Har I ikke domænet endnu, så brug den gratis adresse, Netlify giver jer, og ret domænet i `src/constants/app-info.ts` og her.

## App Privacy ("privatlivsetiket")

Svar i App Store Connect → App-privatliv:

- **Indsamler du eller dine tredjepartspartnere data fra denne app?** → *Ja.*

Vælg disse datatyper. For hver: **Knyttet til brugeren: Ja**, **Bruges til sporing: Nej**, formål **Appens funktionalitet**:

| Kategori | Datatype | Hvorfor |
| --- | --- | --- |
| Kontaktoplysninger | Navn | Virksomheden ser, hvem der ringer |
| Kontaktoplysninger | E-mailadresse | Fra Log ind med Apple (kan være Apples skjulte adresse) |
| Kontaktoplysninger | Telefonnummer | Virksomheden ser, hvem der ringer |
| Id'er | Bruger-id | Brugerkontoen hos Supabase |
| Brugsdata | Produktinteraktion | Hvilke virksomheder brugeren har ringet til, så virksomheden kan se det |
| Køb | Købshistorik | Hvad brugeren betalte for en opgave ("Del, hvad du betalte"). Vises kun samlet og uden navn |
| Kontaktoplysninger | Fysisk adresse | Naborabat: postnummer og gade eller område, som brugeren selv skriver. Virksomhedstilmeldinger: virksomhedens adresse |
| Brugerindhold | Billeder eller videoer | Virksomheders billeder af udført arbejde (Min virksomhed). Vises for alle på virksomhedens side |
| Brugerindhold | Andet brugerindhold | Anmeldelser (stjerner og tekst, vises med forbogstav), Naborabat-grupper (besked) og rapporter ("Rapportér") |

Ikke indsamlet: placering (bruges kun på telefonen), søgninger, teksten og billederne i "Beskriv dit problem" (bliver på telefonen og sendes kun af brugeren selv som en besked), billeder af tilbud og i Min bolig (bliver på telefonen), gemte virksomheder, analyse, reklamer og crash-rapporter.

Virksomhedernes egne tilmeldinger (Mere → Tilmeld din virksomhed) er oplysninger om virksomheden og dens kontaktperson. Kontaktpersonens navn og e-mail er også "Kontaktoplysninger → Navn / E-mailadresse" og er allerede med i tabellen.

Samme typer står i privacy manifestet (`ios.privacyManifests.NSPrivacyCollectedDataTypes` i `app.json`). Tilføjer I analyse eller andet, skal begge opdateres, før den version indsendes (retningslinje 5.1.2).

## Noter til Apples review-team (på engelsk)

App Store Connect → appen → versionen → **App Review Information**. Sæt flueben ved **Sign-in required**, og skriv virksomhedens id og kode til "Min virksomhed" i felterne. De står ikke i git; lav dem med `issue_business_key` i Supabase (`docs/lancering/supabase.md` → "Hvem har tid i dag?") til jeres egen virksomhed eller en virksomhed, der har sagt ja til det.

| Felt | Værdi |
| --- | --- |
| User name | `[forretnings-id]` (virksomhedens id fra `live-businesses.json`, fx `fjordvand-vvs`) |
| Password | `[kode]` (koden fra `issue_business_key`) |

Kopiér noterne nedenfor ind i feltet **Notes**. De passer til et `production`-build: kun Log ind med Apple, rigtige virksomheder i København.

```
FixMatch helps people in Denmark find and compare local tradespeople and mechanics (plumbers, electricians, carpenters, bricklayers, mechanics, painters, roofers, locksmiths) on price, distance and FixMatch's own reviews, and contact them directly. The app follows the device language (English or Danish); Danish labels are in parentheses.

SIGN-IN
- Sign in with Apple is the only way for users to log in. There is no e-mail login. The User name and Password in Sign-In Information are the id and code for the business area (My business), see step 4.
- The first screen offers Sign in with Apple. Tap "Skip" ("Spring over") to use the app without an account. If you sign in with Apple there, the next screen asks for a name and phone number; tap "Not now" ("Ikke nu") to go straight into the app.
- Everything can be browsed without an account: listings, business pages, prices, the map, compare, Quote check, Describe your problem, Emergency help and the guides.
- Calling, messaging or FaceTiming a business needs an account with a name and phone number. This is the core of the service: the business sees who contacted it through FixMatch, so it knows who it is talking to and can call back, and only users who contacted a business through FixMatch can review it. The name and number are shown only to the business the user contacts, never to other users.
- Neighbour discount ("Naborabat") also needs sign-in to start or join a group, so neighbours know a group is real. Groups can be viewed without an account.
- The account can be deleted in the app: Profile > Delete account ("Profil > Slet bruger").

LOCATION
- The businesses are in Copenhagen, Denmark. If location is allowed and you are outside Denmark, the app shows the businesses in Copenhagen and says so in a note on the home screen. Without location, it starts in Copenhagen.
- To choose a city: Profile > Location ("Profil > Placering"), search for "København" and tap it.
- Location permission is optional and is only used on the device.

STEPS TO TEST
1. Home > "Plumber" > tap a business > "Call" ("Ring"). Sign in with Apple, enter a name and phone number, and the phone app opens with the business's number.
2. Home > "Describe your problem" > tap an example > "Find a match".
3. After a call, the business page offers "Write a review". Each review from another user and each Neighbour discount group has "Report" ("Rapportér").
4. My business: Profile > "Log in as a business" ("Log ind som virksomhed"). Sign in with Apple first. Search for the business id from the Sign-In Information (User name), tap the business and enter the code (Password). You then see who called, can mark free time and ask FixMatch to change prices.
5. Neighbour discount: Home > "Neighbour discount" > "Start a group".

USER CONTENT
- Reviews, Neighbour discount groups and businesses' photos of their work are user content. Every review and group can be reported in the app ("Report"). A reported item is hidden on the reporter's phone at once, and FixMatch reviews every report within 24 hours on weekdays and removes content that breaks the rules. Texts with slurs, phone numbers or links are stopped before they are posted. The terms (More > Terms of use) have a zero-tolerance clause for objectionable content and abusive users.
- Reviews are FixMatch's own: only users who contacted a business through the app can review it, once each. The app shows no ratings, scores or logos from Trustpilot, Google or other review sites. A business may add plain text links to its own profiles there; the app fetches nothing from those sites.

OTHER
- Businesses are only listed after they sign up themselves or give written consent. Prices come from the businesses. Businesses sign up under More > Sign up your business.
- The map uses Apple MapKit. The pins are the businesses' own addresses; the app stores no map data.
- "Describe your problem" matches the user's text and budget on the device; the text is not sent anywhere.
```

## Skærmbilleder

Krav: mindst ét sæt til **6,9" iPhone** (1320 × 2868 eller 1290 × 2796 px). Appen understøtter ikke iPad, så iPad-billeder er ikke nødvendige.

Tag billederne på en rigtig iPhone (TestFlight-build med **live**-data, ikke demo). Forslag til rækkefølge og overskrifter:

1. Forside – *"Find den rette håndværker"*
2. Liste over VVS'ere – *"Sammenlign pris og afstand"*
3. Virksomhedsside – *"Pris inkl. moms – før du ringer"*
4. Sammenlign side om side – *"Vælg den bedste på 10 sekunder"*
5. Dine prioriteter – *"Du bestemmer, hvad der tæller"*
