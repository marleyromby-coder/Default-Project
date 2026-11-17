# FixMatch på TestFlight – trin for trin

Mål: demoversionen (fiktive virksomheder) på jeres egne iPhones og juryens via TestFlight. Rigtige virksomheder og App Store kommer bagefter.

Det hele bygges i skyen af Expo (EAS). Du behøver **ikke** en Mac – en Windows- eller Linux-pc virker også. Det tager ca. 20 minutter at sætte op og 30–60 minutter, før buildet ligger i TestFlight.

**Har du en Mac med Xcode?** Så kan du også bygge og uploade selv fra Xcode: se `xcode.md`.

## Det skal du have

- Din Apple Developer-konto (Apple-id og adgangskode, og din iPhone til to-faktor-koden).
- En gratis Expo-konto: opret den på [expo.dev/signup](https://expo.dev/signup).
- [Node.js 20 eller nyere](https://nodejs.org) og [Git](https://git-scm.com) på computeren.

## 1. Hent projektet

```bash
git clone https://github.com/marleyromby-coder/Default-Project.git
cd Default-Project
git checkout claude/nice-goodall-15i9e2
cd fixmatch
npm install
```

## 2. Log ind hos Expo

```bash
npx eas-cli@latest login
```

## 3. Byg og send til TestFlight – én kommando

```bash
npx eas-cli@latest build --platform ios --profile testflight --auto-submit
```

EAS stiller nogle spørgsmål første gang. Svar sådan:

| Spørgsmål | Svar |
| --- | --- |
| Create an EAS project? | **Yes** |
| Log in to your Apple account? | **Yes** – Apple-id, adgangskode og koden fra din iPhone |
| Select a team | Dit eget navn (personlig konto) |
| Generate a new Apple Distribution Certificate? | **Yes** |
| Generate a new Apple Provisioning Profile? | **Yes** – det sker to gange: én for appen (`dk.fixmatch.app`) og én for widgets (`dk.fixmatch.app.widgets`) |
| App Store Connect app (EAS Submit) | Lad EAS oprette appen. Er navnet "FixMatch" optaget i App Store, så opret appen selv i App Store Connect (se nedenfor) og kør kommandoen igen |

EAS sætter selv App Group (`group.dk.fixmatch.app`) op, som widgets bruger til at hente data fra appen. Når buildet er færdigt, uploades det automatisk. Apple behandler det i 5–30 minutter, og så dukker det op under **TestFlight** i App Store Connect.

**Hvis navnet er optaget:** Gå til [App Store Connect](https://appstoreconnect.apple.com) → Apps → **+** → Ny app. Platform iOS, navn fx "FixMatch: Find håndværker", primært sprog English (U.K.) eller Dansk, bundle id `dk.fixmatch.app`, SKU `fixmatch-ios-1`. Kør så kommandoen fra trin 3 igen.

## Demo-builds hedder 0.9.0

Builds med demodata får version **0.9.0** i stedet for 1.0.0 fra `app.json`. Det gælder profilerne `testflight`, `demo` og `simulator` og alt, der bygges i Xcode (`xcode.md`). Det styrer `app.config.js`. I App Store Connect ligger demo-builds derfor under 0.9.0, så de aldrig kan vælges til App Store-versionen 1.0.0.

Kun `npx eas-cli@latest build --platform ios --profile production` bygger 1.0.0 med live-data, og EAS kører udgivelsestjekket (`npm run check:release`) først. Vil du se, hvilken version et build får, så kør:

```bash
npx expo config --type public                                  # demo: version 0.9.0
EXPO_PUBLIC_FIXMATCH_DATA=live npx expo config --type public   # live: version 1.0.0
```

> Når 1.0.0 er godkendt i App Store, afviser Apple uploads med en lavere version. Brug så TestFlight med live-data (profilen `production`) i stedet for demo-builds.

## 4. Inviter testere

I App Store Connect → appen → **TestFlight**:

- **Interne testere** (op til 100, ingen gennemgang hos Apple): Brugere og adgang → tilføj personen som bruger, og læg vedkommende i en intern testgruppe. De får en mail og installerer via TestFlight-appen. Det er hurtigst til jer selv.
- **Eksterne testere og juryen** (op til 10.000, via et offentligt link): Opret en ekstern gruppe, tilføj buildet, og udfyld testoplysningerne nedenfor. Apple laver en kort Beta App Review (typisk under et døgn). Derefter kan du slå **Offentligt link** til og give linket til juryen.

Testerne installerer den gratis app **TestFlight** fra App Store og åbner invitationen eller linket. Buildet virker i 90 dage.

### Testoplysninger til Beta App Review (kopiér)

**Beskrivelse af beta**

```
FixMatch helps people find and compare local tradespeople (plumbers, electricians, carpenters, mechanics and more) by price, distance and reviews from FixMatch users, and call them directly. This beta is a demo for an innovation competition: all businesses are fictional examples, clearly marked in the app, and calling them is turned off.
```

**Hvad skal testes**

```
Tap a trade on the home screen, open a business, compare up to three businesses, and try "Describe your problem" with one of the examples. Add the "FixMatch" widgets to the home screen and lock screen. You can skip sign-up on the first screen, or tap "Not now" after Sign in with Apple. Calling a business asks you to sign in with Apple and give a name and phone number, so the business knows who is calling. Businesses can sign up under More → Sign up your business. Location is optional (Profile → Location lets you pick a city).
```

Feedback-e-mail: jeres egen. Login: ikke nødvendigt – testere kan springe det over eller bruge Log ind med Apple.

## 5. Inden fremvisningen

- Læg widgets på hjemmeskærmen: hold fingeren på skærmen → **+** → søg "FixMatch" → vælg "Hurtig hjælp" og "Gemte håndværkere" i de størrelser, I vil vise. Tilføj også en widget på låseskærmen.
- Gem et par virksomheder med hjertet, så "Gemte håndværkere" har indhold.
- Vis skift af by (Profil → Placering → London) og sprog (Profil → Sprog).

## Nyt build efter ændringer

Kør kommandoen fra trin 3 igen. Buildnummeret tælles automatisk op. Små ændringer i JavaScript kan også sendes som opdatering uden nyt build med `eas update`, men det kræver ekstra opsætning, så start med et nyt build.

## Hvis noget går galt

| Problem | Løsning |
| --- | --- |
| "You have reached your build limit" | Gratis Expo-konti har et begrænset antal iOS-builds pr. måned, og buildet kan stå i kø. Vent, eller opgrader til en betalt plan for en måned |
| Fejl om App Group eller provisioning profile | Kør `npx eas-cli@latest credentials -p ios`, vælg profilen `testflight` og lad EAS lave profilerne igen |
| "Missing Compliance" i TestFlight | Burde ikke ske, fordi appen erklærer, at den ikke bruger kryptering ud over standard. Ellers: svar "None of the algorithms mentioned above" |
| Widgets vises ikke | Åbn appen én gang efter installation. Widgets virker kun i TestFlight- og App Store-buildet, ikke i Expo Go |

Vil du hellere have, at Claude kører kommandoerne for dig: åbn Claude Desktop, eller kør `claude remote-control` i mappen `Default-Project` på din computer. Så kan Claude bruge din computer, og du skal kun taste dit Apple-id og to-faktor-koden, når EAS spørger.
