# FixMatch-design: "Prisen i centrum"

Holdet valgte dette design den 17. nov. 2026 blandt tre koncepter. Det er koncept A med de farverige fag-fliser fra koncept B. Målet er, at appen skal se professionel ud og samtidig være indbydende, så man har lyst til at sammenligne priser i den. Følelsen er inspireret af en prissammenligner til rejser, men FixMatch har sit eget udtryk. Vi bruger aldrig en anden apps navn, farver eller grafik.

Referencebilleder ligger i `ref/`:

- `koncept-a-oversigt.jpg` viser alle fire skærme, paletten og typografien.
- `koncept-a-skaerm-1.jpg` til `-4.jpg` er Find, Resultater, Virksomhed og Sammenlign.
- `koncept-a-palet.jpg` viser farverne i lys og mørk tilstand samt typografien.
- `koncept-b-fagfliser.jpg` viser de otte fag-fliser med illustrationer, og `koncept-b-oversigt.jpg` viser koncept B samlet.

## Farver

Farverne er tjekket for kontrast (WCAG 2.2). Brødtekst har mindst 4,5:1, og stor tekst og ikoner har mindst 3:1.

| Rolle | Lys | Mørk |
|---|---|---|
| Baggrund | `#F1F5F3` | `#0A1210` |
| Kort | `#FFFFFF` | `#131D1A` |
| Kant | `#DFE7E3` | `#25342E` |
| Fyld (felter, chips) | `#E7EEEA` | `#20302A` |
| Tekst | `#0B1A15` | `#ECF4F0` |
| Tekst 2 | `#41524C` | `#A6B8B1` |
| Tekst 3 | `#5C6D66` | `#889B94` |
| Panel (top, gradient) | `#007A56` → `#00614A` | `#0B5E48` → `#08443A` |
| Tekst på panel | `#FFFFFF`, sekundær `#E6F7EF` | `#FFFFFF`, sekundær `#D5EFE4` |
| Brand (knapper, ikoner) | `#00805C`, knaptekst `#FFFFFF` | `#2FD39C`, knaptekst `#03140E` |
| Brand-tekst | `#00704F` | `#45DCA8` |
| Brand blød | `#DCF4E9` | `#0E2C22` |
| Solgul accent | `#FFB800`, tekst på den `#1A1400` | `#FFC21F`, tekst `#1A1400` |
| Solgul blød | `#FFF3CC`, tekst `#7F5300` | `#2C250F`, tekst `#FFCF4D` |
| Koral (akut) | `#E8553D`, tekst `#B42A18` på `#FDE8E4` | `#FF7A5C`, tekst `#FF9B85` |
| Himmel blød | `#E0EFFA`, tekst `#0A5F8C` | `#10283A`, tekst `#7CC4F2` |
| Blæk (valgt chip, mørk bjælke) | `#0B1A15` | `#22322C` |

Hver farve har sin opgave:

- **Solgul** er kun til den vigtigste handling på en skærm ("Sammenlign priser"), til "Billigst" og til prikken i logoet. Brug den aldrig som tekst på hvid.
- **Himmel** er kun til "Nærmest".
- **Koral** er kun til akut og fare.
- **Fagfarver** er kun til fag-fliser og små fagmarkører, fx avatar-farvetone og ikon. Brug dem aldrig til brødtekst eller priser.

### Fagfarver (fra koncept B)

| Fag | Flise | Dyb |
|---|---|---|
| VVS'er | `#2E77F0` | `#1A56C9` |
| Elektriker | `#FFBE1A` | `#8F5B00` |
| Tømrer | `#F47B2A` | `#A84A10` |
| Murer | `#DB4A3A` | `#9C2A1D` |
| Mekaniker | `#4B4FD8` | `#2F2FA0` |
| Maler | `#EE5A9B` | `#B02F69` |
| Tagdækker | `#13A08F` | `#0B6B60` |
| Låsesmed | `#8B5CF6` | `#5B32C2` |

Hver flise er et kvadrat med afrundede hjørner (ca. 22 pt radius) i fagets farve. På det sidder en enkel, flad illustration i hvid og den dybe farve, med en lysere geometrisk form som højlys. Illustrationerne er:

- VVS: vandhane med dråbe
- El: lyn i en hvid cirkel
- Tømrer: hammer
- Murer: mursten
- Mekaniker: bil
- Maler: malerrulle
- Tagdækker: hus med tag
- Låsesmed: nøgle

Fagets navn står under flisen, og under det står "fra X kr." med den laveste timepris i nærheden. Linjen vises kun, når der findes en pris.

## Skrift

- **Overskrifter, priser, firmanavne og knapper** sættes i Schibsted Grotesk (`@expo-google-fonts/schibsted-grotesk`, vægt 600/700/800/900) med stram spatiering. Brug ikke tabeltal i Schibsted, fordi komma og punktum så bliver for brede.
- **Brødtekst** sættes i SF Pro (systemskrift) med Dynamic Type.

| Stil | Størrelse/linje | Vægt | Spatiering |
|---|---|---|---|
| Stor titel | 34/38 | 800 | −3,5 % |
| Pris XL | 28/32 | 800 | −3,5 % |
| Titel 2 | 22/26 | 800 | −3 % |
| Overskrift | 17/22 | 700 | −1,5 % |
| Brødtekst (SF Pro) | 17/22 | 400 | |
| Fodnote (SF Pro) | 13/18 | 500 | |
| Mærkat (SF Pro) | 12/16 | 700 | |

**Ordmærke:** "fixmatch" i Schibsted Grotesk Black med en solgul prik. Det er hvidt på panelet og blæk på lys baggrund.

## Skærme og komponenter

1. **Find.** Øverst sidder et farvet panel med afrundede bundhjørner. Det rummer ordmærket, Demoversion-mærket og "Se prisen, før du ringer." med et solgult punktum. Under det kommer et hvidt kort med "Hvad skal laves?" og "Hvor?" og en stor solgul knap, "Sammenlign priser". Derefter følger "Vælg fag" med fag-fliserne, kortet "Beskriv dit problem" i solgul blød og "Hvem har tid i dag?".
2. **Resultater.** Øverst er der et panelbånd med titel og sted, og et hvidt kort med sorteringsfaner overlapper båndet. Fanerne viser den vindende værdi: Bedste match 82/100 · Billigste 560 kr./t · Nærmeste 2,6 km · Bedst anmeldt ★ 4,5. Værdierne beregnes ud fra den viste liste med samme regler som sorteringen. "Bedst anmeldt" tæller kun virksomheder med anmeldelser og viser intet tal, når ingen har nogen. Filterchips får blæk, når de er valgt. Linjen "Rækkefølgen kan ikke købes" har et skjold foran.
3. **Resultatkort.** Venstre side har initialer, navn, Verificeret-mærke, tagline, stjerner (kun hvis der er anmeldelser), afstand, åbningsstatus og "Sammenlign". Højre side har "fra 560 kr." stort, "pr. time" og knappen "Se priser". Et kort kan højst have to små bånd (Bedste match i brand, Billigst i solgul, Nærmest i himmel), og kun det kort, der vinder dem, får dem.
4. **Sammenlign-bjælke.** En mørk bjælke i blæk med "N valgt" og en solgul "Sammenlign"-knap.
5. **Virksomhed.** Panel-hero med initialer, navn og mærker (Verificeret, Autoriseret, Demo). Nøgletalskortet (Match, Timepris i brand, Afstand) overlapper heroen. Under det kommer en anmeldelsesbjælke med rigtige tal. Derefter kommer en prisniveau-bjælke, der viser, hvor timeprisen ligger blandt de samme virksomheder og efter samme regel som `priceLevel` i `src/lib/ranking.ts`. Den bruger neutrale ord (Lav pris / Middel / Høj pris) og skriver, hvad der sammenlignes med, fx "blandt 6 VVS'ere inden for 25 km". Så kommer prislisten med fede intervaller. Nederst er en fast "Ring +45 …"-knap med en sammenlign-knap ved siden af.
6. **Sammenlign.** Vinderceller har farve: solgul for billigst, himmel for nærmest og brand for bedst anmeldt eller bedste match. Hver kolonne har en Ring-knap.
7. **Øvrige skærme** bruger samme panel eller rene store titler, de nye kort, chips og knapper. Akut bruger koral til 112-linjen.

## Regler, der ikke må brydes

- Demo-mærkning ("Demo", "Demoversion") skal være synlig overalt, hvor der er demo-virksomheder.
- Anmeldelser kommer fra "brugere, der har kontaktet virksomheden gennem FixMatch". Rækkefølgen afgøres af pris, afstand og anmeldelser, og den kan ikke købes.
- Delte priser er "priser, som brugere selv har delt". Verificeret er et mærke for de virksomheder, FixMatch selv har tjekket (CVR, ejer og autorisation).
- Sammenligninger (prisniveau, "Billigst", sorteringsfaner) skal være korrekte og forklare, hvad der sammenlignes med (markedsføringsloven).
- Appen skal virke med VoiceOver, have mindst 44 pt trykflader, Dynamic Type og mørk tilstand, og tilpasse sig brede skærme og iPhone Duo.
