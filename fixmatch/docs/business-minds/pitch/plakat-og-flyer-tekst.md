# FixMatch – tekst til plakat og flyer

Teksten til plakaten (A1 eller A2, stående) og flyeren (A5, to sider) til standen i Vejle. Layoutet laves senere. Her står teksten, QR-koderne, hvilke skærme fra appen der skal med, og noter til layoutet.

Alt her følger rapporten og talepapiret. Skærmbillederne viser demo-firmaer, så de skal mærkes "Demo".

## QR-koder

| Hvor | Peger på | Tekst ved koden |
|---|---|---|
| Plakaten (stor kode) og flyerens forside | https://fixmatchh.netlify.app | "Scan og se, hvordan den virker." |
| Plakaten (lille kode) og flyerens bagside | https://fixmatchh.netlify.app/tilmeld/ | "Tilmeld jer gratis." |

- Lav koderne som SVG eller PDF (vektor), ikke som et skærmbillede.
- Sort kode på hvid bund med en hvid kant rundt om (mindst 4 felter af koden). Læg aldrig koden direkte på det grønne panel eller på et foto.
- Scan begge koder fra prøvetrykket, på 1 og 2 meters afstand, før I trykker resten. Tjek, at siderne er online.
- Koden fører til hjemmesiden, ikke til App Store. Skriv derfor aldrig "Hent appen" ved koden.

## Plakat (A1 eller A2, stående)

**Ord på plakaten:** 53 ord i stor tekst (logo, overskrift, underlinje, trin, løfte og teksten ved QR-koderne), der skal kunne læses på 2 meters afstand, plus 16 ord i den lille fodlinje. I alt 69 ord.

### Tekst

**LOGO:** FixMatch

**OVERSKRIFT:**
Se prisen, før du ringer.

**UNDERLINJE:**
Find og sammenlign håndværkere og mekanikere i København. Gratis iPhone-app.

**TRE TRIN** (hvert trin står over sit skærmbillede):
1. Vælg et fag, eller beskriv problemet.
2. Se priserne, og sammenlign op til tre.
3. Ring direkte til firmaet.

**LØFTE** (én linje under trinene):
Rækkefølgen kan ikke købes. Intet gebyr pr. kunde.

**STOR QR-KODE** → https://fixmatchh.netlify.app
Scan og se, hvordan den virker.

**LILLE QR-KODE** → https://fixmatchh.netlify.app/tilmeld/
Håndværker i København? Tilmeld jer gratis.

**FODLINJE** (lille):
Testversion med demo-firmaer. Skærmbillederne er fra demoen.
[Navn 1] · [Navn 2] · [Navn 3] · [Navn 4] · [Skolens navn] · Business Minds 2026/2027

### Skærme på plakaten

Tre telefoner på række, én for hvert trin. Hver skærm får et lille mærke: "Demo".

| Trin | Skærm i appen | Det skal kunne ses |
|---|---|---|
| 1 | **Find** (forsiden) | De farvede fag-fliser og knappen "Sammenlign priser" |
| 2 | **Resultater** (VVS'er) | Listen med timepriser, afstand og anmeldelser. Fanen "Bedste match" er valgt. Mærkerne "Billigst" og "Nærmest" ses på kortene |
| 3 | **Virksomhed** (det VVS-demo-firma, I bruger i demoen) | Priserne, mærket Verificeret og knappen Ring |

- Brug rigtige skærmbilleder fra testversionen, ikke konceptbillederne i `docs/design/ref/`. Så viser plakaten det samme som telefonen. Tag dem med placeringen sat til København og i lys tilstand.
- Det er de samme tre skærme, som demoen viser. Fejler telefonen, peger I på plakaten (se `pitch-dommere.md`).
- Skærmbilledet fra trin 2 skal være stort nok til, at en dommer kan se priserne på 1 meters afstand.

### Noter til layoutet

- **Farver** fra `docs/design/designsystem.md`: Overskriften står i hvidt på det smaragdgrønne panel (`#007A56` → `#00614A`). Baggrunden er lys (`#F1F5F3`). Solgul (`#FFB800`) bruges kun ét sted: rammen om den store QR-kode, og så prikken i logoet. Brug aldrig solgul som tekst på hvid.
- **Skrift:** Schibsted Grotesk til al tekst (gratis på Google Fonts). Overskriften i vægt 900 med stram spatiering, underlinje og trin i 700.
- **Størrelser på A1** (594 × 841 mm): overskrift mindst 200 pt, underlinje mindst 72 pt, trin mindst 60 pt, fodlinje mindst 24 pt. Stor QR-kode mindst 12 × 12 cm, lille mindst 8 × 8 cm.
- **Størrelser på A2** (420 × 594 mm): overskrift mindst 140 pt, underlinje mindst 50 pt, trin mindst 42 pt, fodlinje mindst 18 pt. Stor QR-kode mindst 9 × 9 cm, lille mindst 6 × 6 cm.
- **Rækkefølge for øjet:** overskrift → tre skærme → stor QR-kode. Placér den store QR-kode i brysthøjde, når plakaten hænger, ikke helt nede ved gulvet.
- **Tryk:** 3 mm beskæring (bleed) hele vejen rundt og mindst 20 mm luft til kanten på A1 (15 mm på A2). Gem som PDF med fonte indlejret.

## Flyer (A5, to sider)

**Ord på flyeren:** forsiden 51 ord, bagsiden 134 ord. I alt 185 ord.

### Forside

**OVERSKRIFT:**
Hvad koster en VVS'er? Se det, før du ringer.

**TRE PUNKTER:**
- Firmaernes egne priser, før du ringer
- Sammenlign op til tre på pris, afstand og anmeldelser fra brugere via FixMatch
- Tilbudstjek: Er dit tilbud lavt, normalt eller højt?

**QR-KODE** → https://fixmatchh.netlify.app
Scan og se, hvordan den virker.

**BUNDLINJE:**
FixMatch · Gratis iPhone-app · Lige nu i test med demo-firmaer

### Bagside

**Til boligejere**
Altid gratis. Du ringer direkte til firmaet. Anmeldelserne kommer kun fra brugere, der har kontaktet firmaet gennem FixMatch. Rækkefølgen kan ikke købes.

**Til håndværkere og værksteder**
Gratis profil og gratis Verificeret-mærke: Vi tjekker CVR, ejer og autorisation. Aldrig betaling pr. kunde. I godkender alt, der står om jer, og kan komme ud når som helst. Det tager tre minutter at komme med.

**QR-KODE** → https://fixmatchh.netlify.app/tilmeld/
Tilmeld jer gratis.

**Sådan tjener vi penge**
Brugerne betaler aldrig. Firmaer kan vælge et frivilligt Pro-abonnement med flere billeder og priser (forslag: 299–499 kr./md.). Pro giver aldrig en bedre plads.

**Lige nu**
Vi samler de første 40 firmaer i København. Kender du en håndværker? Så giv flyeren videre.

**Kontakt:** [Navn] · [telefon] · [e-mail]
[Navn 1] · [Navn 2] · [Navn 3] · [Navn 4] · [Skolens navn] · Business Minds 2026/2027

_Lille tekst nederst:_ Verificeret er ikke en garanti for kvaliteten af arbejdet.

### Skærme på flyeren

| Side | Skærm i appen | Hvorfor |
|---|---|---|
| Forside | **Resultater** (VVS-listen med priser), mærket "Demo" | Viser løftet "Se det, før du ringer" |
| Forside, lille (valgfri) | **Tilbudstjek** med resultatet "normal pris", mærket "Demo" | Viser det tredje punkt |
| Bagside | Ingen skærme | Teksten skal have plads, og QR-koden til tilmelding skal stå tydeligt |

### Noter til layoutet

- Samme farver og skrift som plakaten. Overskriften på forsiden står på det grønne panel.
- QR-koderne skal være mindst 3 × 3 cm.
- Kontaktlinjen skal udfyldes, før I trykker. Brug en adresse eller et nummer, som nogen faktisk tjekker efter Vejle.
- Tryk dobbeltsidet med 3 mm beskæring.

## Kilder til teksten

| Tekst | Kilde |
|---|---|
| "Se prisen, før du ringer." | Rapporten afsnit 4 (positionering) |
| Håndværkere og mekanikere i København, gratis iPhone-app | Rapporten "Kort fortalt" og afsnit 3 |
| Vælg et fag, eller beskriv problemet | Rapporten afsnit 1 ("Ideen") |
| Sammenlign op til tre | `src/state/app-state.tsx` (`MAX_COMPARE = 3`) |
| Rækkefølgen kan ikke købes; anmeldelser fra brugere via FixMatch | `src/data/content.ts`; `docs/jura/anmeldelser.md` |
| Intet gebyr pr. kunde; Pro 299–499 kr./md. (forslag), aldrig en bedre plads | Rapporten afsnit 4–5 og BMC; talepapiret |
| Verificeret: CVR, ejer og autorisation; ikke en kvalitetsgaranti | `content.ts` ("Sådan verificerer vi") |
| I godkender alt; kan komme ud når som helst; tre minutter | Talepapiret (pitchen på 30 sekunder) |
| Tilbudstjek: lavt, normalt eller højt | Rapporten "Kort fortalt" |
| De første 40 firmaer i København | Rapporten afsnit 4 og 8; talepapiret |
| Testversion med demo-firmaer | README; talepapiret ("Mærk skærmbilleder 'Demo'") |
