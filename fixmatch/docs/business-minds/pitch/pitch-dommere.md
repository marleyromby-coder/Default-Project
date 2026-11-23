# FixMatch – standpitch til dommerne

Business Minds i Vejle. Dommerne kommer forbi standen, hører pitchen og stiller spørgsmål. Der er ingen slides. I har telefonen med appen, plakaten og flyerne.

| | |
|---|---|
| **Mål** | Dommerne skal huske én sætning ("Se prisen, før du ringer"), forstå, hvordan FixMatch tjener penge, og gå fra standen med en flyer. |
| **Længde** | Højst 4:00. Talt tekst: ca. **403 ord**, ca. 3:20 ved 120 ord i minuttet. Med demo-tryk og overleveringer (ca. 10–15 sekunder) er det **ca. 3:35**. Mål på stopuret: 3:20–3:45. Stop senest 3:55. Hver af jer taler ca. 1 minut. |
| **Roller** | **Marley** (idé og produkt) åbner og lukker. **Morgan** (salg, partnere og marketing) styrer telefonen, viser demoen og tager målgruppe og salg. **Oscar** (økonomi og jura) tager penge, status og næste skridt. Indtil sin tur tager Oscar tid og har backup-telefonen klar. |
| **I hånden** | Morgan: demo-telefonen, åben på forsiden. Marley: én flyer, klar til at række frem. Oscar: backup-telefonen og et stopur. Plakaten hænger bag jer, og QR-koden kan ses. Stikordskort i lommen, men læs ikke op. |

Rollerne er et forslag. Bytter I roller, så ret navnene her, i `dommer-spoergsmaal.md` og i `oevelsesplan.md`.

## Før standen åbner: demo-telefonen

Gør det aftenen før, og tjek det igen om morgenen.

1. Installér den nyeste testversion med demodata (version 0.9.0), fra TestFlight eller bygget med Xcode (`npm run ios:xcode`). Den skal være bygget fra koden den 21. november 2026 eller senere, så appen ser ud som plakaten: På VVS-listen har det første kort mærkerne "Bedste match" og "Billigst", og fanen "Bedst anmeldt" viser "★ 4,5 (19)". Sproget er dansk, og telefonen står i lys tilstand.
2. I behøver ikke oprette en bruger. Hos demo-firmaer viser Ring altid boksen "Eksempelvirksomhed", også uden bruger og i flytilstand (`src/lib/contact.ts`).
3. Placeringen skal være København K. Tryk på "Hvor?" på forsiden, og vælg **København K** under "Store byer i Danmark". Tryk ikke "Brug min nuværende placering": I Vejle giver den Vejle, og så viser listen andre firmaer. På forsiden står der nu "København K · inden for 25 km".
4. Demo-firmaet er **Hjertevarme VVS & Blik**. Det er det øverste kort under "Bedste match", har mærket Verificeret og er det samme firma som på plakaten og flyeren. Står det ikke øverst, så tjek placeringen, at "Vægtning" står på "Balanceret" (Pris 40 %, Afstand 30 %, Anmeldelser 30 %), og at ingen filtre er valgt.
5. Slå flytilstand til, og kør hele demoen igennem. Demo-firmaerne ligger inde i appen. Brug listen, ikke kortet, for Apple Kort kræver net.
6. Lysstyrke helt op. Forstyr ikke til. Lyden fra. Auto-Lås: Aldrig. Slå Guidet adgang til (Indstillinger → Tilgængelighed), så ingen kan forlade appen ved et uheld. Husk koden.
7. Oplad til 100 %, og hav en power bank i lommen.
8. Backup: Tag skærmbilleder af forsiden, VVS-listen, firmasiden og boksen "Eksempelvirksomhed". Læg dem i et album, der hedder "FixMatch demo", og mærk dem "Demo". Oscar har en backup-telefon med samme testversion.
9. Når dommerne nærmer sig: appen er åben på forsiden.

## Manuskriptet

Det, der står i [klammer], siges ikke. Noter med "Kilde" er til jer, hvis en dommer spørger, hvor noget kommer fra.

### 0:00 · Marley · Problemet og idéen (ca. 1 minut)

[Kig på dommerne. Start direkte.]

Forestil jer, at I lige er flyttet til en ny by. Det kunne være Aarhus eller København.

Pludselig går toilettet i stykker. I har brug for en VVS'er. Men hvem skal I ringe til? Hvem er tæt på? Hvad koster det? Og hvem kan I stole på?

I ender med at google, læse anmeldelser og ringe rundt. Selv efter flere opkald er det svært at sammenligne priserne.

Det problem vil vi løse. Vi hedder Marley, Morgan og Oscar, og vi står bag FixMatch.

FixMatch er en gratis iPhone-app, der samler håndværkere og mekanikere ét sted. Man sammenligner pris, afstand og anmeldelser og ser prisen, før man ringer.

Vi starter i Danmark, fordi vi hellere vil gøre ét land rigtig godt end mange lande halvt.

Vores mål er at gøre det lige så nemt at finde en håndværker som at bestille en taxa.

[Træd et halvt skridt til side. Morgan træder frem med telefonen.]

> Kilde: Danmark først: rapporten afsnit 4 og 8 (en konsulent rådede os til at starte i Danmark, og vi droppede den globale plan). Byerne er eksempler, ikke tal.

### 1:00 · Morgan · Sådan virker appen (ca. 1 minut)

[Hold telefonen i brysthøjde, med skærmen mod dommerne. Peg på mærket "Demoversion".]

Lad mig vise jer det. Det her er vores testversion med demo-firmaer.

[Tryk på flisen VVS'er.]

Dit afløb er stoppet. Du åbner FixMatch og vælger VVS'er. Du kan også skrive problemet og dit budget med dine egne ord.

Nu ser du VVS'erne i nærheden med deres egne timepriser. Du kan sortere efter bedste match, billigste, nærmeste eller bedst anmeldt og se dem på et kort. Rækkefølgen kan ikke købes.

[Peg på fanerne og på linjen "Rækkefølgen kan ikke købes". Tryk så på "Se priser" på det øverste kort, Hjertevarme VVS & Blik.]

Her er priserne, og her kan man se, at vi har tjekket CVR, ejer og autorisation.

[Peg på "Timepris 560–660 kr. inkl. moms" og på mærket "Verificeret". Tryk på den grønne knap "Ring +45 10 21 91 33". Boksen "Eksempelvirksomhed" kommer frem.]

Så trykker jeg Ring og taler direkte med firmaet. Ingen mellemled. I demoen er opkald slået fra.

[Tryk OK. Sænk telefonen.]

Kun brugere, der har kontaktet firmaet gennem FixMatch, kan anmelde det. Én gang hver.

På sigt vil vi også gøre det muligt at booke en tid direkte i appen.

[Vend dig mod Oscar.]

> Kilde: Rangering og "kan ikke købes": `src/data/content.ts` ("Sådan rangerer vi"). Verificeret er ikke et kvalitetsstempel: `content.ts` ("Sådan verificerer vi"). Booking findes ikke i appen endnu; sig "på sigt".

### 2:05 · Oscar · Forretningsmodel og fremtid (ca. 1 minut)

Hvordan tjener FixMatch så penge?

Vores målgruppe er boligejere, lejere og bilejere, der har brug for en håndværker eller mekaniker.

Appen er gratis for kunderne. Firmaerne betaler aldrig pr. kunde eller pr. opkald, og profilen er gratis.

Vi tjener penge på et frivilligt Pro-abonnement til firmaerne med flere billeder og priser. Vores forslag er 299 til 499 kroner om måneden. Pro giver aldrig en bedre placering. Driften koster os omkring 9.900 kroner om året, så tre Pro-kunder dækker den.

Vi har ingen rigtige brugere endnu. Vi starter med firmaerne, fordi en app uden håndværkere er tom. Lige nu samler vi de første 40 firmaer i Danmark.

Når Danmark virker, kommer Sverige, Norge, Tyskland og Storbritannien. De er allerede bygget ind i appen.

[Peg på QR-koden på plakaten. Marley rækker en flyer frem.]

Scan QR-koden, og prøv det selv. FixMatch. Se prisen, før du ringer.

[Ca. 3:30. Stop. Smil. Vent på spørgsmål.]

> **Tidstjek:** Starter Oscar senere end 2:20, så spring sætningen om Sverige, Norge, Tyskland og Storbritannien over. Skær aldrig i demoen, i "demo-firmaer", i "ingen rigtige brugere" eller i slutningen.
>
> Kilde: Rapporten afsnit 5: Pro-prisen er et forslag, 9.900 kr. i omkostninger, break-even 3 × 299 × 12 = 10.764 kr. Ingen rigtige brugere: talepapiret og rapportens SWOT. De fire lande: afsnit 8 og README.

## Demo-vejen trin for trin

Teksterne i kolonnen "Skærmen viser" er tjekket i webudgaven af appen den 20. november 2026 (dansk, lys tilstand, København K, tirsdag kl. 10.12, med en bruger oprettet).

| # | Gør | Skærmen viser | Morgan siger |
|---|---|---|---|
| 1 | Hold telefonen mod dommerne. Forsiden er åben. Peg på "Demoversion". | Forsiden: "Se prisen, før du ringer.", mærket "Demoversion", "Hvor? København K · inden for 25 km" og de otte fag-fliser med "fra"-priser | "Lad mig vise jer det. Det her er vores testversion med demo-firmaer." |
| 2 | Tryk på flisen **VVS'er** ("fra 560 kr."). | "VVS'ere · Nær København K". Listen med "fra"-pris pr. time, afstand og anmeldelser. Fanen "Bedste match" er valgt. | "Dit afløb er stoppet. Du åbner FixMatch og vælger VVS'er …" |
| 3 | Peg på fanerne. Tryk ikke. Peg så på "Rækkefølgen kan ikke købes". | Bedste match **82/100** · Billigste **560 kr./t** · Nærmeste **2,6 km** · Bedst anmeldt **★ 4,5 (19)**. Over listen: "6 VVS'ere · efter match" og "Rækkefølgen kan ikke købes" | "Nu ser du VVS'erne i nærheden med deres egne timepriser …" |
| 4 | Tryk på **Se priser** på det øverste kort. | Kortet: mærkerne "Bedste match" og "Billigst", **Hjertevarme VVS & Blik** med Verificeret-tegnet efter navnet, "★ 3,5 (2) · 2,6 km", "fra 560 kr. pr. time". Firmasiden åbner: "Match 82 af 100 · Timepris 560–660 kr. inkl. moms · Afstand 2,6 km fra København K" | "Her er priserne, og her kan man se …" |
| 5 | Peg på **Verificeret** under navnet. | Mærkerne "Verificeret", "Autoriseret VVS-installatør" og "Demo". Under dem: "3,5 · 2 anmeldelser fra brugere via FixMatch" og "Fiktiv eksempelvirksomhed …" | "… at vi har tjekket CVR, ejer og autorisation." |
| 6 | Tryk på den grønne knap **Ring +45 10 21 91 33** nederst. | Boksen **"Eksempelvirksomhed"**: "Hjertevarme VVS & Blik er en fiktiv demo-virksomhed. I den færdige app ringer knappen direkte op til virksomheden. Nummeret +45 10 21 91 33 er fiktivt, så opkald er slået fra." Knap: OK | "Så trykker jeg Ring og taler direkte med firmaet …" |
| 7 | Tryk **OK**, og sænk telefonen. | Firmasiden igen | "Kun brugere, der har kontaktet firmaet gennem FixMatch, kan anmelde det …" |

Demoen tager ca. 45 sekunder. Tal, mens du trykker. Vent aldrig mere end 3 sekunder på skærmen. Peg ikke på åbningstiderne: De følger klokken, og efter kl. 16 står der ikke "Åben til 16.00".

**Spørger en dommer "Hvad koster et stoppet afløb så?"**, så rul lidt ned på firmasiden til "Eksempelpriser": "Stoppet afløb 1.100–2.600 kr." Sig: "Hos det her demo-firma står der 1.100 til 2.600 kroner. Tallene er opdigtede. I den rigtige app er det firmaernes egne priser." Sig ikke, om et bestemt tilbud er for dyrt.

### Hvis noget går galt

- **Appen fryser eller lukker:** Sig "Teknikken driller, så her er de samme skærme." Oscar peger på skærmbillederne på plakaten (Find, Resultater, Virksomhed), eller Morgan åbner albummet "FixMatch demo". Sig de samme sætninger som i manuskriptet.
- **Ring åbner "Opret en bruger for at kontakte virksomheden":** Så er testversionen for gammel. Tryk "Annuller" øverst til venstre. Sig: "Her ringer man direkte. I demoen er opkald slået fra." Opret ikke en bruger foran dommerne.
- **Hjertevarme står ikke øverst, eller listen viser en anden by:** Fortsæt roligt: Tryk på Hjertevarme VVS & Blik, hvor den står, eller brug plakaten. Ret placeringen og vægtningen bagefter (se "Før standen åbner").
- **Telefonen er død:** Tag backup-telefonen. Virker den heller ikke, så brug plakaten.
- **Dommerne kan ikke se skærmen:** Peg på skærmbilledet af VVS-listen på plakaten.
- **Der er ingen net:** Det gør ikke noget. Demoen kører i flytilstand. Undgå bare kortet.

## 60-sekunders-versionen

Når dommerne har travlt, eller der er kø ved standen. Én taler, helst Marley. Telefonen er åben på VVS-listen. **131 ord skrevet, ca. 138 udtalt: ca. 70 sekunder ved 120 ord i minuttet og ca. 60–65 sekunder i et lidt hurtigere tempo.** Er der kun et minut, så spring "12 procent af boligejerne …" over.

Hvad koster det at få renset et stoppet afløb? De fleste aner det ikke. 12 procent af boligejerne har dårlige erfaringer med håndværkere.

Derfor har vi bygget FixMatch: en gratis iPhone-app, hvor man ser prisen, før man ringer.

[Vis telefonen.] Det her er demo-firmaer. Man ser timepris, afstand og anmeldelser fra brugere, der har kontaktet firmaet gennem FixMatch. Rækkefølgen kan ikke købes. Så ringer man direkte, uden gebyr pr. kunde.

Brugerne betaler aldrig. Firmaerne kan købe Pro, som vi foreslår til 299 til 499 kroner om måneden. Driften koster 9.900 kroner om året, så break-even er tre betalende firmaer.

Appen kører som testversion, og vi har ingen rigtige brugere endnu. Næste skridt er 40 verificerede firmaer i Danmark. Kender I en håndværker? Så giv dem en flyer.

FixMatch. Se prisen, før du ringer.

## Hvis vi kun har 30 sekunder

Fx når en dommer allerede er på vej videre. **63 ord, ca. 30 sekunder ved 120 ord i minuttet.**

FixMatch er en gratis iPhone-app, hvor man ser håndværkernes egne priser, før man ringer. Man sammenligner op til tre på pris, afstand og anmeldelser fra brugere via FixMatch og ringer direkte. Firmaerne betaler aldrig pr. kunde, og rækkefølgen kan ikke købes. Appen kører som testversion, og nu samler vi de første 40 firmaer i Danmark. Tag en flyer. Se prisen, før du ringer.

## Slutreplik

Når spørgsmålene er slut, eller dommerne går videre. Marley siger:

"Tak, fordi I kom forbi. Tag en flyer med, og kender I en håndværker, så giv den videre. Se prisen, før du ringer."

## Kildenoter samlet

Til jer, hvis en dommer spørger "Hvor har I det fra?". Siges ikke i pitchen.

| Tal eller påstand | Kilde |
|---|---|
| 12 % af boligejerne har dårlige erfaringer; 1.156 klager over håndværkere til ankenævnene i 2022 (siges "over 1.100") | Bolius, "Vi stoler på vores håndværkere, men …" (Realdania og Bolius 2024; ankenævnenes tal for 2022), rapportens kilde [1] |
| Sofie, 32, rækkehus i Valby, tilbud på 3.200 kr. | Rapporten afsnit 3 (persona, opdigtet) |
| Unge boligejere i storbyen (25–40 år) er mindre loyale over for "deres" håndværker | Rapporten afsnit 3, kilde [5] (TEKNIQ/Bolius) |
| 67 % vægter kvaliteten højest, 18 % prisen | Rapporten afsnit 3, kilde [5] (TEKNIQ/YouGov) |
| Rangering på pris, afstand og anmeldelser; kan ikke købes | `src/data/content.ts` ("Sådan rangerer vi"); `docs/jura/anmeldelser.md` |
| Verificeret = CVR, ejer og autorisation, ikke en kvalitetsgaranti | `src/data/content.ts`; README |
| Tilbudstjek: "Det kan ingen af konkurrenterne, vi har tjekket" | Rapporten "Kort fortalt" og afsnit 3, kilde [9] (egen konkurrentanalyse af 3byggetilbud, Handyhand, Autobutler, Anmeld Håndværker og Fikset) |
| Håndværkerfradraget kræver faktura | Rapporten afsnit 2, kilde [4] |
| Ca. 2.100 betalende firmaer hos 3byggetilbud | Rapporten afsnit 3, kilde [2] |
| Pro 299–499 kr./md. (forslag), aldrig en bedre plads | Rapporten afsnit 4–5 og BMC; talepapiret |
| Drift 9.900 kr./år; break-even 3 × 299 × 12 = 10.764 kr.; år 1 uden indtægt | Rapporten afsnit 5 |
| Testversion med demo-firmaer, ingen rigtige brugere | Talepapiret; rapporten SWOT (afsnit 8); README |
| 40 verificerede firmaer på 90 dage | Rapporten afsnit 4 (90-dagesmål) og afsnit 8 (port 1) |
| Fire lande klar i koden | Rapporten afsnit 8; README |
| Over 800 fejl i Xcode; konsulenten og den globale plan | Rapporten afsnit 6 og 7 |
| Hjertevarme VVS & Blik og alle tal på demo-telefonen (82/100, 560 kr., 2,6 km, ★ 4,5 (19) osv.) | Demo-data i appen (`scripts/generate-demo-data.js`). Firmaerne og tallene er opdigtede. Brug dem kun til at vise, hvordan appen virker |
