# Tryksager til Business Minds

Plakaten (A1 eller A2) og flyeren (A5) til standen i Vejle. Alt bygges af `build.js` ud fra
`plakat.html`, `flyer.html`, navnene i `../team.json` og billederne i `assets/`. Teksten kommer fra
`../pitch/plakat-og-flyer-tekst.md`.

Skærmbillederne viser demo-firmaer. De er mærket "Demo", og både plakat og flyer siger
"Testversion med demo-firmaer".

## Hvilken fil skal vi bruge?

Alle filer ligger i `pdf/`. Billeder af dem ligger i `preview/`.

| Fil | Størrelse | Til |
|---|---|---|
| `FixMatch-plakat-A1-med-beskaering.pdf` | 600 × 847 mm | **Trykkeriet.** A1 med 3 mm beskæring hele vejen rundt. Trykkeriet skærer den til 594 × 841 mm. |
| `FixMatch-plakat-A1-uden-beskaering.pdf` | 594 × 841 mm | **Skolens storformatprinter eller en copyshop.** Bed om tryk uden kant ("borderless"). Kan printeren ikke det, får plakaten en hvid kant på 3–5 mm. Ellers kan I printe `med-beskaering` på en bredere rulle og skære den til. |
| `FixMatch-plakat-A2-med-beskaering.pdf` | 426 × 600 mm | Som A1 med beskæring, bare i A2 (420 × 594 mm). |
| `FixMatch-plakat-A2-uden-beskaering.pdf` | 420 × 594 mm | Som A1 uden beskæring, bare i A2. |
| `FixMatch-flyer-A5-med-beskaering.pdf` | 2 sider à 154 × 216 mm | **Trykkeriet.** A5, dobbeltsidet, med 3 mm beskæring. |
| `FixMatch-flyer-A5-uden-beskaering.pdf` | 2 sider à 148 × 210 mm | **Præcis A5 uden beskæring:** til en skole- eller kopiprinter, der kan printe A5 helt ud til kanten, og til skærm og e-mail. En almindelig printer giver en hvid kant. Brug så en af de to næste. |
| `FixMatch-flyer-A5-paa-A4-med-skaeremaerker.pdf` | stående A4, 1 flyer pr. ark | **Skolens printer, fuld størrelse.** A5 med beskæring midt på arket, med skæremærker. Vend på den lange kant. |
| `FixMatch-flyer-A4-med-2-flyers.pdf` | liggende A4, 2 flyers pr. ark | **Skolens printer, mange flyers.** To flyers pr. ark i 90 % (133 × 189 mm), med skæremærker. Vend på den korte kant. |

Flyerne på A4-arkene er kopieret direkte fra `FixMatch-flyer-A5-med-beskaering.pdf`, så de er ens.
QR-koderne er mindst 3 cm brede i alle flyer-filer. Bruger I `Tilpas til side`, bliver de mindre.

## Udfyld navnene og byg igen

1. Åbn `../team.json` og skriv navnene ind i stedet for pladsholderne. Alt, der stadig står i
   `<span class="ph">[…]</span>`, bliver trykt som en gul boks, så I kan se, hvad der mangler.
2. Tilføj linjen `kontakt`. Den mangler i filen i dag og bruges på flyerens bagside. Skriv et
   nummer eller en adresse, som nogen faktisk tjekker efter Vejle.

   ```json
   {
     "deltagere": "Marley Romby Sangill, Navn Navnesen, Navn Navnesen, Navn Navnesen",
     "underviser": "Underviserens navn",
     "partnere": "…",
     "skole": "Skolens navn",
     "aarstal": "2026/2027",
     "kontakt": "Navn · 12 34 56 78 · navn@skole.dk"
   }
   ```

   Plakaten bruger `deltagere`, `skole` og `aarstal`. Flyeren bruger også `underviser` og `kontakt`.
   `partnere` står ikke på plakaten eller flyeren.
3. Byg alle PDF'er og billeder igen fra repoets rod (det virker også fra andre mapper):

   ```sh
   node fixmatch/docs/business-minds/tryk/build.js           # alt
   node fixmatch/docs/business-minds/tryk/build.js plakat    # kun plakaten
   node fixmatch/docs/business-minds/tryk/build.js flyer     # kun flyeren
   ```

4. Se billederne i `preview/` igennem. De er lavet ud fra de færdige PDF'er, så de viser det, der
   bliver trykt.

Scriptet skriver ✓ eller ✗ for hver fil. Det tjekker sidestørrelse og TrimBox, at skrifterne er
indlejret, at tekst og QR-koder holder afstand til skærekanten (plakat 20 mm på A1 og 15 mm på A2,
flyer 5 mm), at der er 4 felters hvid kant om QR-koderne, at QR-koderne kan læses fra PDF'en, og at
ingen del af en tryksag er blevet hvid. Til sidst står de pladsholdere, der mangler. Står der ✗,
så ret det, før I trykker. Bliver navnene for lange, er det typisk afstanden til kanten, der fejler.

**Det skal være installeret:**

- Node med Playwright og Chromium: `npm install -g playwright` og `npx playwright install chromium`.
- python3 med pypdf: `pip install pypdf`.
- Valgfrit: `pdftoppm` (Poppler: `brew install poppler` på Mac, `apt install poppler-utils` på Linux).
  Uden den bliver billederne i `preview/` ikke opdateret, og PDF'erne bliver ikke tjekket for hvide
  huller.
- Valgfrit: npm-pakken `jsqr` til at læse QR-koderne, fx
  `npm install --prefix ~/.fixmatch-tryk jsqr` og så
  `NODE_PATH=~/.fixmatch-tryk/node_modules node fixmatch/docs/business-minds/tryk/build.js`.
  Uden den skal I scanne koderne med en telefon (det skal I under alle omstændigheder).

## Papir og antal

- **Plakat:** 170–200 g mat eller silke. Mat papir giver mindst genskin fra lamperne på standen.
- **Flyer fra trykkeriet:** 250–300 g silke, dobbeltsidet. Fx 100 stk.
- **Flyer fra skolens printer:** det tykkeste papir, printeren kan tage (tjek printerens grænse).
  100 flyers er 50 ark med `FixMatch-flyer-A4-med-2-flyers.pdf` eller 100 ark med
  `FixMatch-flyer-A5-paa-A4-med-skaeremaerker.pdf`.

## Bestilling hos trykkeriet

- Send `med-beskaering`-filerne. Det færdige format står i PDF'ens TrimBox, og der er 3 mm
  beskæring hele vejen rundt.
- Filerne er i RGB (sRGB). Bed trykkeriet konvertere til CMYK (relativ farvegengivelse med
  sortpunktskompensation) og trykke sort tekst og QR-koder i ren sort (K). Bed om et prøvetryk
  eller en digital korrektur.
- Den blå, lilla og indigo fag-flise bliver lidt mattere i tryk. Det grønne og det gule ligger tæt
  på det, I ser på skærmen.
- Plakaten: spørg, om de bruger en moderne RIP (PDF/X-4 eller Adobe APPE), så skyggerne under
  telefonerne bliver pæne. Kig efter striber i den store grønne flade på prøvetrykket.

## Print på skolens printer

- Vælg **100 %** eller **Faktisk størrelse**, aldrig "Tilpas til side". De to A4-filer beder selv
  om det (og om den rigtige vending), når de åbnes i fx Adobe Acrobat Reader.
- Dobbeltsidet: `A4-med-2-flyers` vender på **den korte kant**, `A5-paa-A4` vender på **den lange
  kant**. Det står også i margenen på arket.
- Print ét ark først. Hold det op mod lyset og tjek, at for- og bagside passer sammen.
- Skær ved mærkerne med en skæremaskine. Skæremærkerne holder sig 5 mm fra papirkanten, så en
  almindelig printer kan trykke dem.

## Tjekliste før I trykker

- [ ] Navnene, skolen og underviseren er udfyldt i `../team.json`, og `kontakt` er tilføjet.
- [ ] `build.js` kører uden ✗, og der står ingen pladsholdere til sidst.
- [ ] Billederne i `preview/` er læst igennem (stavning, navne, telefonnummer).
- [ ] Begge QR-koder er testet med en telefon på et prøvetryk, på 1 og 2 meters afstand. De
      fører til https://fixmatchh.netlify.app og https://fixmatchh.netlify.app/tilmeld/.
- [ ] Hjemmesiden og tilmeldingssiden er online. Åbn begge på en telefon på mobildata, ikke
      skolens wifi.
- [ ] Der er ikke føjet tekst til, som ikke står i `../pitch/plakat-og-flyer-tekst.md`.
- [ ] Papir og antal er bestilt (se ovenfor).

## Filerne i mappen

- `plakat.html` og `flyer.html`: layoutet. Åbn `flyer.html` i en browser for at se begge sider med
  skærekant (rød, stiplet) og 5 mm sikkerhedsafstand (blå, prikket).
- `build.js`: bygger alle PDF'er og billeder og tjekker dem.
- `assets/`: skærmbillederne fra appen i 3× (1170 × 2532 px, lys tilstand, dansk), QR-koderne som
  SVG, skrifterne (Schibsted Grotesk og Inter, begge under OFL) og fag-fliserne. Fag-fliserne
  tegnes igen af `build.js` ud fra appens `assets/brand/trade-art.json`.
- `pdf/` og `preview/`: laves af `build.js`.

**Nye skærmbilleder:** tag dem fra webudgaven i 390 × 844 punkter med `deviceScaleFactor: 3`, i
lys tilstand og på dansk. Gem dem under de samme navne i `assets/`, og byg igen.

**Ny adresse til en QR-kode:** lav en ny SVG med npm-pakken `qrcode`
(`errorCorrectionLevel: 'M'`, `margin: 0`), gem den under samme navn, og ret adressen i
`QR_CODES` øverst i `build.js`. Den hvide kant tilpasser sig selv kodens størrelse.
