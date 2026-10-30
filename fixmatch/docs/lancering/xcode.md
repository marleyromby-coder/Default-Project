# FixMatch i Xcode → TestFlight

Den anden vej til TestFlight (den første er EAS i skyen, se `testflight.md`). Du bygger selv på din Mac og uploader fra Xcode. Det tager ca. 15 minutter første gang.

Buildet er demoversionen: fiktive virksomheder og ingen Trustpilot. Det er standard, så du skal ikke sætte noget op.

## Det skal du have

- En Mac med **Xcode 27.1** eller nyere (kræver macOS Tahoe 26.6). Xcode 27.1 er nødvendig, for at appen fylder hele den indre skærm på **iPhone Duo** og får den nye **ekstra store widget** fra iOS 27. Ældre Xcode virker også, men så kører appen med sorte kanter på den åbne Duo, og widgetten mangler.
- [Node.js 20 eller nyere](https://nodejs.org) og CocoaPods (`brew install cocoapods`).
- Din Apple Developer-konto, logget ind i Xcode → Settings → Accounts.

## 0. Supabase (brugere og tilmeldinger)

Appen gemmer brugere og virksomhedstilmeldinger i Supabase. Er det sat op (`supabase.md`), så læg filen `fixmatch/.env` med de to værdier, **før** du kører `npm run ios:xcode`. Uden `.env` virker appen også – brugeren gemmes så kun på telefonen, og det er fint til en demo.

## 1. Hent projektet og åbn det i Xcode

```bash
git clone https://github.com/marleyromby-coder/Default-Project.git
cd Default-Project
git checkout claude/nice-goodall-15i9e2
cd fixmatch
npm install
npm run ios:xcode
```

**Luk Xcode (⌘Q), før du kører kommandoen.** `npm run ios:xcode` tjekker Xcode og CocoaPods, installerer pakkerne, hvis de er forældede, sletter FixMatchs gamle build-cache og Xcodes modul-cache, laver Xcode-projektet (mappen `ios/`) ud fra `app.json`, kører `pod install` og åbner **`ios/FixMatch.xcworkspace`**. Går et trin galt, stopper den og skriver hvorfor. Mappen laves forfra hver gang, så ret aldrig i den direkte. Ret i `app.json` og kør kommandoen igen.

**Åbn altid `FixMatch.xcworkspace` (hvidt ikon), aldrig `FixMatch.xcodeproj` (blåt ikon).** Projektfilen alene kender ikke Expos moduler, og så fejler buildet med "No such module 'ExpoWidgets'".

## 2. Signering (første gang)

I Xcode: klik på **FixMatch** øverst i venstre side → fanen **Signing & Capabilities**. Gør det for begge targets i listen:

| Target | Hvad det er |
| --- | --- |
| **FixMatch** | Selve appen (`dk.fixmatch.app`) |
| **ExpoWidgetsTarget** | Widgets til hjemmeskærm og låseskærm (`dk.fixmatch.app.widgets`) |

FixMatch-targetet har også **Sign in with Apple**. Det står allerede under Signing & Capabilities og bliver oprettet automatisk, når du har valgt dit team.

For hvert target: sæt flueben i **Automatically manage signing**, og vælg dit team under **Team**. Xcode opretter selv app-id'erne og App Group'en `group.dk.fixmatch.app`, som widgets bruger.

**Tip:** Skriv dit Team ID i `app.json` under `"ios"`, fx `"appleTeamId": "AB12CD34EF"`. Så er begge targets signeret automatisk, hver gang du kører `npm run ios:xcode`. Team ID står på [developer.apple.com/account](https://developer.apple.com/account) under Membership.

## 3. Test på din egen iPhone (valgfrit)

Slut din iPhone til, vælg den øverst i Xcode, og tryk ▶︎ (Run). Eller kør `npx expo run:ios --device` i terminalen.

**iPhone Duo uden en Duo:** Vælg simulatoren **iPhone Duo** øverst i Xcode, og tryk ▶︎. Fold den ud og sammen fra menuen i simulatoren. Udfoldet bruger appen hele den indre skærm. Vender du den på tværs, står listen ved siden af kortet, og de andre skærme holder teksten i en læsevenlig bredde i midten.

## 4. Opret appen i App Store Connect (første gang)

[App Store Connect](https://appstoreconnect.apple.com) → Apps → **+** → Ny app:

- Platform: iOS
- Navn: fx "FixMatch: Find håndværker" (navnet "FixMatch" kan være optaget)
- Primært sprog: Dansk
- Bundle id: `dk.fixmatch.app`
- SKU: `fixmatch-ios-1`

## 5. Byg og upload

1. Vælg **Any iOS Device (arm64)** øverst i Xcode.
2. **Product → Archive**. Det tager 5–15 minutter.
3. Organizer-vinduet åbner. Vælg arkivet → **Distribute App** → **App Store Connect** → **Upload**. Klik dig igennem med standardvalgene.
4. Efter 5–30 minutter ligger buildet under **TestFlight** i App Store Connect. Spørgsmålet om kryptering er allerede besvaret i appen.

Inviter testere og juryen som beskrevet i `testflight.md`, afsnit 4.

## Nyt build efter ændringer

Apple kræver et højere buildnummer for hver upload:

1. Ret `"buildNumber"` i `app.json` (under `"ios"`) fra `"1"` til `"2"`, næste gang `"3"` osv.
2. Kør `npm run ios:xcode` igen, og gentag trin 5.

## Hvis noget går galt

Hver gang der pushes, bygger GitHub appen med Xcode 27.1 og 26.6 (▶︎ til iPhone og Archive) i `.github/workflows/fixmatch-ios.yml`. Er det grønt under **Actions** på GitHub, er koden i orden, og en fejl hos dig skyldes det lokale projekt. Så hjælper trinene her.

| Problem | Løsning |
| --- | --- |
| "No profiles for 'dk.fixmatch.app.widgets' were found" | Vælg dit team under Signing for **ExpoWidgetsTarget** også (trin 2) |
| "The app identifier dk.fixmatch.app cannot be registered" | Id'et er taget af en anden konto. Skift `bundleIdentifier` i `app.json` (fx `dk.ditnavn.fixmatch`) og widgets' `bundleIdentifier` og `groupIdentifier` til det samme med `.widgets` og `group.` foran. Kør `npm run ios:xcode` igen |
| `pod install` fejler | Kør `brew install cocoapods`, og så `npm run ios:xcode` igen |
| Hundredvis af fejl efter `git pull` | Der er kommet nye pakker til. Luk Xcode (⌘Q), kør `npm run ios:xcode`, og byg igen med ⇧⌘K og ▶︎. GitHub bygger hver version med 0 fejl (se *Actions*), så fejl, der bliver ved, skyldes det lokale projekt |
| Projektet ser forkert ud i Xcode: røde filnavne eller fejl i mange filer | Xcode var åben, mens `ios/` blev lavet forfra. Luk Xcode (⌘Q), og kør `npm run ios:xcode` igen |
| "No such module 'ExpoWidgets'", "Unable to resolve module dependency" eller "Clang dependency scanning failure" | Luk Xcode, kør `npm run ios:xcode` igen, og byg fra `FixMatch.xcworkspace`. Hjælper det ikke: **Product → Clean Build Folder** (⇧⌘K) og byg igen |
| "Command PhaseScriptExecution failed" med "node: command not found" | Kør `npm run ios:xcode` igen. Den skriver stien til Node i `ios/.xcode.env.local` |
| "Redundant Binary Upload" / buildnummer er brugt | Tal `buildNumber` op i `app.json` (se ovenfor) |
| Widgets vises ikke | Åbn appen én gang efter installation. Hold fingeren på hjemmeskærmen → **+** → søg "FixMatch" |

Vil du hellere have, at Claude gør det for dig: kør `claude remote-control` i mappen `Default-Project` på din Mac. Så kan Claude køre kommandoerne, og du skal kun vælge dit team i Xcode og trykke Upload.
