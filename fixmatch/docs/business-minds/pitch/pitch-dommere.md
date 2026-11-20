# FixMatch – standpitch til dommerne

Business Minds i Vejle. Dommerne kommer forbi standen, hører pitchen og stiller spørgsmål. Der er ingen slides. I har telefonen med appen, plakaten og flyerne.

| | |
|---|---|
| **Mål** | Dommerne skal huske én sætning ("Se prisen, før du ringer"), forstå, hvordan FixMatch tjener penge, og gå fra standen med en flyer. |
| **Længde** | Højst 4:00. Talt tekst: **413 ord** skrevet, **ca. 429 ord** udtalt (tal som "9.900" siges med flere ord). Ved 120 ord i minuttet er det ca. 3:34. Demo-øjeblikket (tryk og pauser på telefonen) tager ca. 5 sekunder, højst 20, og pauser og overleveringer ca. 8 sekunder. I alt **ca. 3:48** ved 120 ord i minuttet og ca. 3:30, hvis I taler lidt hurtigere (130 ord i minuttet). Mål på stopuret: 3:30–3:45. Stop senest 3:55. Tiderne i manuskriptet er regnet ved 120 ord i minuttet. |
| **Roller** | **[Navn 1]** (idé og produkt) åbner og lukker. **[Navn 2]** (salg og partnere) styrer telefonen, viser demoen og tager målgruppe og salg. **[Navn 3]** (økonomi og jura) tager penge, status og næste skridt. **[Navn 4]** (marketing), hvis I er fire: tager tid, rækker flyers frem og holder backup-telefonen klar. |
| **I hånden** | [Navn 2]: demo-telefonen, åben på forsiden. [Navn 1]: én flyer, klar til at række frem. [Navn 4]: backup-telefonen og et stopur. Plakaten hænger bag jer, og QR-koden kan ses. Stikordskort i lommen, men læs ikke op. |

Navnene er pladsholdere (`team.json`). Skriv jeres egne navne ind, før I printer.

## Før standen åbner: demo-telefonen

Gør det aftenen før, og tjek det igen om morgenen.

1. Installér den nyeste testversion fra TestFlight med demodata (version 0.9.0). Den skal være bygget fra koden den 20. november 2026 efter kl. 18 (commit 6fa499a eller nyere), så appen ser ud som plakaten: På VVS-listen har det første kort mærkerne "Bedste match" og "Billigst", og fanen "Bedst anmeldt" viser "★ 4,5 (19)". Sproget er dansk, og telefonen står i lys tilstand.
2. Opret en bruger i appen, mens I har net. Uden en bruger åbner Ring skærmen "Opret en bruger for at kontakte virksomheden" (`src/lib/contact.ts`), og det må ikke ske midt i pitchen.
3. Placeringen skal være København K. Tryk på "Hvor?" på forsiden, og vælg **København K** under "Store byer i Danmark". Tryk ikke "Brug min nuværende placering": I Vejle giver den Vejle, og så viser listen andre firmaer. På forsiden står der nu "København K · inden for 25 km".
4. Demo-firmaet er **Hjertevarme VVS & Blik**. Det er det øverste kort under "Bedste match", har mærket Verificeret og er det samme firma som på plakaten og flyeren. Står det ikke øverst, så tjek placeringen, at "Vægtning" står på "Balanceret" (Pris 40 %, Afstand 30 %, Anmeldelser 30 %), og at ingen filtre er valgt.
5. Slå flytilstand til, og kør hele demoen igennem. Demo-firmaerne ligger inde i appen. Brug listen, ikke kortet, for Apple Kort kræver net.
6. Lysstyrke helt op. Forstyr ikke til. Lyden fra. Auto-Lås: Aldrig. Slå Guidet adgang til (Indstillinger → Tilgængelighed), så ingen kan forlade appen ved et uheld. Husk koden.
7. Oplad til 100 %, og hav en power bank i lommen.
8. Backup: Tag skærmbilleder af forsiden, VVS-listen, firmasiden og boksen "Eksempelvirksomhed". Læg dem i et album, der hedder "FixMatch demo", og mærk dem "Demo". [Navn 4] har en backup-telefon med samme testversion.
9. Når dommerne nærmer sig: appen er åben på forsiden.

## Manuskriptet

Det, der står i [klammer], siges ikke. Noter med "Kilde" er til jer, hvis en dommer spørger, hvor et tal kommer fra.

### 0:00 · [Navn 1] · Spørgsmålet og Sofie

[Kig på dommerne. Ingen "Hej, vi er …". Start direkte.]

Hvad koster det at få renset et stoppet afløb?

[Pause, 2 sekunder.]

Det vidste Sofie heller ikke. Hun har lige købt rækkehus i Valby og kender ingen VVS'er. Hun har fået et tilbud på 3.200 kroner. Er det fair? Kan hun stole på firmaet?

> **Hvis en dommer svarer** ("1.500 kroner?"): "Måske! Men det står sjældent nogen steder, før man har ringet. Det vidste Sofie heller ikke." Siger dommeren "Det ved jeg ikke": "Nej. Det vidste Sofie heller ikke." Fortsæt derfra.
>
> Kilde: Sofie er rapportens persona (afsnit 3). Hun er opdigtet, og det siger I lige bagefter.

### 0:24 · [Navn 1] · Problemet og hvem vi er

Sofie er opdigtet, men hun er vores målgruppe: unge boligejere i storbyen. Tallene er ægte. 12 procent af boligejerne har dårlige erfaringer med håndværkere. Og i 2022 fik ankenævnene over 1.100 klager over håndværkere.

Vi er [Navn 1], [Navn 2] og [Navn 3] fra FixMatch. En gratis iPhone-app, hvor man ser prisen, før man ringer.

[Træd et halvt skridt til side. [Navn 2] træder frem med telefonen.]

> Kilde: 12 % (Realdania og Bolius, "Danskerne i det byggede miljø" 2024; i Region Hovedstaden 16 %) og 1.156 klager i 2022 (715 + 181 + 260 til de tre ankenævn; siges "over 1.100"): bolius.dk, "Vi stoler på vores håndværkere, men …", rapportens kilde [1]. Målgruppen 25–40 år: afsnit 3, kilde [5].

### 0:53 · [Navn 2] · Demoen

[Hold telefonen i brysthøjde, med skærmen mod dommerne. Tal til dem, ikke til skærmen. Hold en pause på et sekund efter hvert tryk.]

[Peg på mærket "Demoversion" øverst på forsiden.]

Det her er demo-firmaer. Alt er opdigtet.

[Tryk på flisen VVS'er.]

VVS'er. Her er timepris, afstand og anmeldelser fra brugere, der har kontaktet firmaet gennem FixMatch.

[Peg på fanerne øverst: "Bedste match 82/100", "Billigste 560 kr./t", "Nærmeste 2,6 km" og "Bedst anmeldt ★ 4,5 (19)". Tryk ikke.]

Man vælger selv, hvad der vejer mest. Rækkefølgen kan ikke købes.

[Peg på linjen "Rækkefølgen kan ikke købes" lige over listen. Tryk så på "Se priser" på det øverste kort, Hjertevarme VVS & Blik.]

Her er firmaets egne priser. Før hun ringer.

[Peg på "Timepris 560–660 kr. inkl. moms". Peg så på mærket "Verificeret" under navnet.]

I den rigtige app betyder Verificeret, at vi selv har tjekket CVR, ejer og autorisation. Det er ikke et kvalitetsstempel.

[Tryk på den grønne knap nederst: "Ring +45 10 21 91 33". Boksen "Eksempelvirksomhed" kommer frem: "Hjertevarme VVS & Blik er en fiktiv demo-virksomhed. … opkald er slået fra."]

Så ringer hun direkte. Firmaet betaler ikke pr. kunde. I demoen er opkald slået fra.

[Tryk OK. Sænk telefonen.]

> Kilde: Rangering og "kan ikke købes": `src/data/content.ts` ("Sådan rangerer vi"). Verificeret: `content.ts` ("Sådan verificerer vi") og README. Boksen "Eksempelvirksomhed": `src/lib/contact.ts`. Demoen viser "Bedste match" og ikke "Billigste", fordi rapportens kilde [5] siger, at 67 % vægter kvaliteten højest. At Hjertevarme også har mærket "Billigst", er et tilfælde i demo-dataene, ikke en regel (se `dommer-spoergsmaal.md`, spørgsmål 6).

### 1:36 · [Navn 2] · Tilbudstjek og bæredygtighed

Med Tilbudstjek ser hun, om hendes tilbud er lavt, normalt eller højt. Det kan ingen af konkurrenterne, vi har tjekket.

Det er også bæredygtigt. Man kan vælge lokalt, og Tilbudstjek viser håndværkerfradraget, som kræver faktura. Det taler imod sort arbejde.

> Kilde: Tilbudstjek og "ingen af konkurrenterne, vi har tjekket": rapporten, "Kort fortalt" og afsnit 3, kilde [9] (vores egen konkurrentanalyse af 3byggetilbud, Handyhand, Autobutler, Anmeld Håndværker og Fikset). Tilbudstjek viser håndværkerfradraget i kroner, og fradraget kræver faktura: afsnit 2, kilde [4]. Sig ikke, om Sofies tilbud på 3.200 kroner er lavt eller højt. Det står ingen steder.

### 1:56 · [Navn 2] · Høne og æg

Men en app uden håndværkere er tom. Det er høne og æg. Derfor starter vi med firmaerne i København. Markedslederen 3byggetilbud har cirka 2.100 firmaer, der betaler for kunder. Bagefter når vi boligejerne med TikTok-videoer om priser.

Og hvordan tjener vi så penge? [Navn 3].

[Vend dig mod [Navn 3].]

> Kilde: Høne og æg og København først: rapporten afsnit 4. 2.100 betalende firmaer: afsnit 3, kilde [2]. TikTok: afsnit 4 (4P og AIDA).

### 2:20 · [Navn 3] · Penge

Brugerne betaler aldrig. Firmaerne kan købe Pro med flere billeder og priser. Men aldrig en bedre plads. Vi foreslår 299 til 499 kroner om måneden. Driften koster 9.900 kroner om året, så break-even er tre betalende firmaer. Det første år tager vi ingen penge.

> **Tidstjek:** Starter [Navn 3] senere end 2:30, så spring "Fire lande mere er klar i koden" over, og [Navn 1] springer sætningen om Xcode over. Det sparer ca. 8 sekunder. Skær aldrig i demoen, i "demo-firmaer", i "ingen rigtige brugere" eller i bønnen.
>
> Kilde: Rapporten afsnit 5: Pro-prisen er et forslag, 9.900 kr. i omkostninger, break-even 3 × 299 × 12 = 10.764 kr., og år 1 er uden indtægt. "Flere billeder og priser": talepapiret.

### 2:46 · [Navn 3] · Status og næste skridt

Appen kører som testversion med demo-firmaer. Vi har ingen rigtige brugere endnu. De sidste dage har vi ringet til [X] firmaer. [Y] vil gerne være med.

Næste skridt: 40 verificerede firmaer på 90 dage. Så CVR-nummer og App Store. Fire lande mere er klar i koden.

> **Kun det, der er sandt.** Sætningen med [X] og [Y] siges kun, hvis I faktisk har ringet (se `oevelsesplan.md`, fredag og mandag). Har ingen sagt ja, så sig i stedet: "Vi har ingen rigtige firmaer i appen endnu. Det er det, vi gør nu."
>
> Kilde: Testversion og ingen rigtige brugere: talepapiret og rapportens SWOT. 40 firmaer på 90 dage: rapporten afsnit 4 og 8. Fire lande (Sverige, Norge, Tyskland, Storbritannien): afsnit 8 og README.

### 3:10 · [Navn 1] · Hvorfor os, bønnen og slutningen

Hvorfor os? Vi har selv bygget appen. Da Xcode viste over 800 fejl, rettede vi dem. Da en konsulent sagde "start i Danmark", droppede vi den globale plan. Og vi tør ringe til firmaerne.

[Ræk en flyer frem. Peg på QR-koden på plakaten.]

Kender I en håndværker i København? Så giv dem en flyer. Vi skal bruge 40.

[Pause. Kig på dommerne.]

Sofie skal ikke kende en VVS'er. Hun skal bare kunne se prisen, før hun ringer.

FixMatch. Se prisen, før du ringer.

[Ca. 3:48 ved 120 ord i minuttet. Stop. Smil. Vent på spørgsmål.]

> Kilde: 800 fejl, konsulenten og den globale plan: rapporten afsnit 6 og 7. "Vi tør ringe": afsnit 4. Spørger en dommer, hvad Xcode er: "Apples program til at bygge iPhone-apps."

## Demo-vejen trin for trin

Teksterne i kolonnen "Skærmen viser" er tjekket i webudgaven af appen den 20. november 2026 (dansk, lys tilstand, København K, tirsdag kl. 10.12, med en bruger oprettet).

| # | Gør | Skærmen viser | [Navn 2] siger |
|---|---|---|---|
| 1 | Hold telefonen mod dommerne. Forsiden er åben. Peg på "Demoversion". | Forsiden: "Se prisen, før du ringer.", mærket "Demoversion", "Hvor? København K · inden for 25 km" og de otte fag-fliser med "fra"-priser | "Det her er demo-firmaer. Alt er opdigtet." |
| 2 | Tryk på flisen **VVS'er** ("fra 560 kr."). | "VVS'ere · Nær København K". Listen med "fra"-pris pr. time, afstand og anmeldelser. Fanen "Bedste match" er valgt. | "VVS'er. Her er timepris, afstand og anmeldelser …" |
| 3 | Peg på fanerne. Tryk ikke. Peg så på "Rækkefølgen kan ikke købes". | Bedste match **82/100** · Billigste **560 kr./t** · Nærmeste **2,6 km** · Bedst anmeldt **★ 4,5 (19)**. Over listen: "6 VVS'ere · efter match" og "Rækkefølgen kan ikke købes" | "Man vælger selv, hvad der vejer mest …" |
| 4 | Tryk på **Se priser** på det øverste kort. | Kortet: mærkerne "Bedste match" og "Billigst", **Hjertevarme VVS & Blik** med Verificeret-tegnet efter navnet, "★ 3,5 (2) · 2,6 km", "fra 560 kr. pr. time". Firmasiden åbner: "Match 82 af 100 · Timepris 560–660 kr. inkl. moms · Afstand 2,6 km fra København K" | "Her er firmaets egne priser. Før hun ringer." |
| 5 | Peg på **Verificeret** under navnet. | Mærkerne "Verificeret", "Autoriseret VVS-installatør" og "Demo". Under dem: "3,5 · 2 anmeldelser fra brugere via FixMatch" og "Fiktiv eksempelvirksomhed …" | "I den rigtige app betyder Verificeret …" |
| 6 | Tryk på den grønne knap **Ring +45 10 21 91 33** nederst. | Boksen **"Eksempelvirksomhed"**: "Hjertevarme VVS & Blik er en fiktiv demo-virksomhed. I den færdige app ringer knappen direkte op til virksomheden. Nummeret +45 10 21 91 33 er fiktivt, så opkald er slået fra." Knap: OK | "Så ringer hun direkte …" |
| 7 | Tryk **OK**, og sænk telefonen. | Firmasiden igen | Videre til Tilbudstjek |

Demoen tager ca. 45 sekunder. Tal, mens du trykker. Vent aldrig mere end 3 sekunder på skærmen. Peg ikke på åbningstiderne: De følger klokken, og efter kl. 16 står der ikke "Åben til 16.00".

**Spørger en dommer "Hvad koster et stoppet afløb så?"**, så rul lidt ned på firmasiden til "Eksempelpriser": "Stoppet afløb 1.100–2.600 kr." Sig: "Hos det her demo-firma står der 1.100 til 2.600 kroner. Tallene er opdigtede. I den rigtige app er det firmaernes egne priser." Sig ikke, om Sofies tilbud på 3.200 kroner er for dyrt.

### Hvis noget går galt

- **Appen fryser eller lukker:** Sig "Teknikken driller, så her er de samme skærme." [Navn 4] peger på skærmbillederne på plakaten (Find, Resultater, Virksomhed), eller [Navn 2] åbner albummet "FixMatch demo". Sig de samme sætninger som i manuskriptet.
- **Ring åbner "Opret en bruger for at kontakte virksomheden":** Tryk "Annuller" øverst til venstre. Sig: "Her ringer man direkte. I demoen er opkald slået fra." Opret ikke en bruger foran dommerne.
- **Hjertevarme står ikke øverst, eller listen viser en anden by:** Fortsæt roligt: Tryk på Hjertevarme VVS & Blik, hvor den står, eller brug plakaten. Ret placeringen og vægtningen bagefter (se "Før standen åbner").
- **Telefonen er død:** Tag backup-telefonen. Virker den heller ikke, så brug plakaten.
- **Dommerne kan ikke se skærmen:** Peg på skærmbilledet af VVS-listen på plakaten.
- **Der er ingen net:** Det gør ikke noget. Demoen kører i flytilstand. Undgå bare kortet.

## 60-sekunders-versionen

Når dommerne har travlt, eller der er kø ved standen. Én taler, helst [Navn 1]. Telefonen er åben på VVS-listen. **131 ord skrevet, ca. 138 udtalt: ca. 70 sekunder ved 120 ord i minuttet og ca. 60–65 sekunder i et lidt hurtigere tempo.** Er der kun et minut, så spring "12 procent af boligejerne …" over.

Hvad koster det at få renset et stoppet afløb? De fleste aner det ikke. 12 procent af boligejerne har dårlige erfaringer med håndværkere.

Derfor har vi bygget FixMatch: en gratis iPhone-app, hvor man ser prisen, før man ringer.

[Vis telefonen.] Det her er demo-firmaer. Man ser timepris, afstand og anmeldelser fra brugere, der har kontaktet firmaet gennem FixMatch. Rækkefølgen kan ikke købes. Så ringer man direkte, uden gebyr pr. kunde.

Brugerne betaler aldrig. Firmaerne kan købe Pro, som vi foreslår til 299 til 499 kroner om måneden. Driften koster 9.900 kroner om året, så break-even er tre betalende firmaer.

Appen kører som testversion, og vi har ingen rigtige brugere endnu. Næste skridt er 40 verificerede firmaer i København. Kender I en håndværker? Så giv dem en flyer.

FixMatch. Se prisen, før du ringer.

## Hvis vi kun har 30 sekunder

Fx når en dommer allerede er på vej videre. **63 ord, ca. 30 sekunder ved 120 ord i minuttet.**

FixMatch er en gratis iPhone-app, hvor man ser håndværkernes egne priser, før man ringer. Man sammenligner op til tre på pris, afstand og anmeldelser fra brugere via FixMatch og ringer direkte. Firmaerne betaler aldrig pr. kunde, og rækkefølgen kan ikke købes. Appen kører som testversion, og nu samler vi de første 40 firmaer i København. Tag en flyer. Se prisen, før du ringer.

## Slutreplik

Når spørgsmålene er slut, eller dommerne går videre. [Navn 1] siger:

"Tak, fordi I kom forbi. Tag en flyer med, og kender I en håndværker i København, så giv den videre. Se prisen, før du ringer."

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
