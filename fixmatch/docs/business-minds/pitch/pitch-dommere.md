# FixMatch – standpitch til dommerne

Business Minds i Vejle. Dommerne kommer forbi standen, hører pitchen og stiller spørgsmål. Der er ingen slides. I har telefonen med appen, plakaten og flyerne.

| | |
|---|---|
| **Mål** | Dommerne skal huske én sætning ("Se prisen, før du ringer"), forstå, hvordan FixMatch tjener penge, og gå fra standen med en flyer. |
| **Længde** | Højst 4:00. Mål: 3:20–3:30. Talt tekst: **409 ord** skrevet, **ca. 430 ord** udtalt (tal som "1.156" siges med flere ord). Det er ca. 3:15 ved 2,2 ord i sekundet. Med tryk på telefonen, pauser og overleveringer bliver det **ca. 3:27**. Stop senest 3:40. |
| **Roller** | **[Navn 1]** (idé og produkt) åbner og lukker. **[Navn 2]** (salg og partnere) styrer telefonen, viser demoen og tager målgruppe og salg. **[Navn 3]** (økonomi og jura) tager penge, status og næste skridt. **[Navn 4]** (marketing), hvis I er fire: tager tid, rækker flyers frem og holder backup-telefonen klar. |
| **I hånden** | [Navn 2]: demo-telefonen, åben på forsiden. [Navn 1]: én flyer, klar til at række frem. [Navn 4]: backup-telefonen og et stopur. Plakaten hænger bag jer, og QR-koden kan ses. Stikordskort i lommen, men læs ikke op. |

Navnene er pladsholdere (`team.json`). Skriv jeres egne navne ind, før I printer.

## Før standen åbner: demo-telefonen

Gør det aftenen før, og tjek det igen om morgenen.

1. Installér testversionen fra TestFlight med demodata (version 0.9.0). Sproget er dansk, og telefonen står i lys tilstand.
2. Opret en bruger i appen, mens I har net. Første gang man trykker Ring, beder appen om en bruger (`src/lib/contact.ts`), og det må ikke ske midt i pitchen.
3. Sæt placeringen til København (tryk på placeringen øverst på forsiden).
4. Vælg på forhånd ét VVS-demo-firma med Verificeret-mærke og priser, som ligger højt under "Bedste match". Skriv navnet på jeres stikordskort.
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

> **Hvis en dommer svarer** ("1.500 kroner?"): "Måske! Men det kan man ikke se nogen steder, før man har ringet. Det vidste Sofie heller ikke." Siger dommeren "Det ved jeg ikke": "Nej. Det vidste Sofie heller ikke." Fortsæt derfra.
>
> Kilde: Sofie er rapportens persona (afsnit 3). Hun er opdigtet, og det siger I lige bagefter.

### 0:22 · [Navn 1] · Problemet og hvem vi er

Sofie er opdigtet, men hun er vores målgruppe: unge boligejere i storbyen. Tallene er ægte: 12 procent af boligejerne har dårlige erfaringer med håndværkere, og ankenævnene fik 1.156 klager over håndværkere i 2022.

Vi er [Navn 1], [Navn 2] og [Navn 3] fra FixMatch: en gratis iPhone-app, hvor man ser prisen, før man ringer.

[Træd et halvt skridt til side. [Navn 2] træder frem med telefonen.]

> Kilde: 12 % og 1.156 klager: rapporten, "Kort fortalt", kilde [1]. Målgruppen 25–40 år: afsnit 3, kilde [5].

### 0:48 · [Navn 2] · Demoen

[Hold telefonen i brysthøjde, med skærmen mod dommerne. Tal til dem, ikke til skærmen. Hold en pause på et sekund efter hvert tryk.]

Det her er demo-firmaer. Alt er opdigtet.

[Tryk på flisen VVS'er.]

VVS'er. Her er timepris, afstand og anmeldelser fra brugere, der har kontaktet firmaet gennem FixMatch.

[Peg på fanerne øverst: Bedste match, Billigste, Nærmeste, Bedst anmeldt. Tryk ikke.]

Man vælger selv, hvad der vejer mest. Rækkefølgen kan ikke købes.

[Tryk på det firma, I har valgt.]

Her er firmaets egne priser. Før hun ringer.

[Peg på mærket Verificeret.]

I den rigtige app betyder Verificeret: Vi har selv tjekket CVR, ejer og autorisation. Det er ikke et kvalitetsstempel.

[Tryk Ring. Boksen "Eksempelvirksomhed" kommer frem.]

Så ringer hun direkte. Intet gebyr pr. kunde. I demoen er opkald slået fra.

[Luk boksen. Sænk telefonen.]

> Kilde: Rangering og "kan ikke købes": `src/data/content.ts` ("Sådan rangerer vi"). Verificeret: `content.ts` ("Sådan verificerer vi") og README. Boksen "Eksempelvirksomhed": `src/lib/contact.ts`. Demoen viser "Bedste match" og ikke "Billigste", fordi rapportens kilde [5] siger, at 67 % vægter kvaliteten højest.

### 1:29 · [Navn 2] · Tilbudstjek og bæredygtighed

Med Tilbudstjek ser hun, om et tilbud er lavt, normalt eller højt. Det gør ingen danske konkurrenter.

Det er også bæredygtigt: Man kan vælge lokalt, og Tilbudstjek viser håndværkerfradraget, som kræver faktura i stedet for sort arbejde.

> Kilde: Tilbudstjek og "ingen danske konkurrenter": rapporten, "Kort fortalt" og afsnit 3, kilde [9] (vores egen konkurrentanalyse). Bæredygtighed: afsnit 2.

### 1:45 · [Navn 2] · Høne og æg

Men en app uden håndværkere er tom. Det er høne og æg. Derfor starter vi med firmaerne i København. Markedslederen 3byggetilbud har cirka 2.100 firmaer, der betaler for kunder. Boligejerne kommer bagefter, via TikTok-videoer om, hvad en opgave koster.

Og hvordan tjener vi så penge? [Navn 3].

[Vend dig mod [Navn 3].]

> Kilde: Høne og æg og København først: rapporten afsnit 4. 2.100 betalende firmaer: afsnit 3, kilde [2]. TikTok: afsnit 4 (4P og AIDA).

### 2:07 · [Navn 3] · Penge

Brugerne betaler aldrig. Firmaerne kan købe Pro: flere billeder og priser, aldrig en bedre plads. Vi foreslår 299 til 499 kroner om måneden. Driften koster 9.900 kroner om året. Så break-even er tre betalende firmaer. Det første år tager vi ingen penge.

> **Tidstjek:** Starter [Navn 3] senere end 2:20, så spring "Fire lande mere er klar i koden" over, og [Navn 1] springer sætningen om Xcode over. Det sparer ca. 6 sekunder. Skær aldrig i demoen, i "demo-firmaer", i "ingen rigtige brugere" eller i bønnen.
>
> Kilde: Rapporten afsnit 5: Pro-prisen er et forslag, 9.900 kr. i omkostninger, break-even 3 × 299 × 12 = 10.764 kr., og år 1 er uden indtægt. "Flere billeder og priser": talepapiret.

### 2:31 · [Navn 3] · Status og næste skridt

Appen er bygget og kører som testversion med demo-firmaer. Vi har ingen rigtige brugere endnu. I denne uge ringede vi til [X] firmaer. [Y] vil gerne være med.

Næste skridt: 40 verificerede firmaer på 90 dage. Så CVR-nummer og App Store. Fire lande mere er klar i koden.

> **Kun det, der er sandt.** Sætningen med [X] og [Y] siges kun, hvis I faktisk har ringet (se `oevelsesplan.md`, dag 1–2). Har ingen sagt ja, så sig i stedet: "Vi har ingen rigtige firmaer i appen endnu. Det er det, vi gør nu."
>
> Kilde: Testversion og ingen rigtige brugere: talepapiret og rapportens SWOT. 40 firmaer på 90 dage: rapporten afsnit 4 og 8. Fire lande (Sverige, Norge, Tyskland, Storbritannien): afsnit 8 og README.

### 2:53 · [Navn 1] · Hvorfor os, bønnen og slutningen

Hvorfor os? Vi har selv bygget appen. Da Xcode viste over 800 fejl, rettede vi dem. Da en konsulent sagde "start i Danmark", droppede vi den globale plan. Og vi tør ringe til firmaerne.

[Ræk en flyer frem. Peg på QR-koden på plakaten.]

Kender I en håndværker i København? Så giv dem en flyer. Vi skal bruge 40.

[Pause. Kig på dommerne.]

Sofie skal ikke kende en VVS'er. Hun skal bare kunne se prisen, før hun ringer.

FixMatch. Se prisen, før du ringer.

[Ca. 3:27. Stop. Smil. Vent på spørgsmål.]

> Kilde: 800 fejl, konsulenten og den globale plan: rapporten afsnit 6 og 7. "Vi tør ringe": afsnit 4. Spørger en dommer, hvad Xcode er: "Apples program til at bygge iPhone-apps."

## Demo-vejen trin for trin

| # | Gør | Skærmen viser | [Navn 2] siger |
|---|---|---|---|
| 1 | Hold telefonen mod dommerne. Forsiden er åben. | Forsiden med de farvede fag-fliser | "Det her er demo-firmaer. Alt er opdigtet." |
| 2 | Tryk på flisen **VVS'er**. | Listen over VVS'ere med timepris, afstand og anmeldelser. Fanen "Bedste match" er valgt. | "VVS'er. Her er timepris, afstand og anmeldelser …" |
| 3 | Peg på fanerne. Tryk ikke. | Bedste match · Billigste · Nærmeste · Bedst anmeldt | "Man vælger selv, hvad der vejer mest …" |
| 4 | Tryk på det firma, I har valgt. | Firmasiden med priser, afstand og mærket Verificeret | "Her er firmaets egne priser. Før hun ringer." |
| 5 | Peg på **Verificeret**. | Samme side | "I den rigtige app betyder Verificeret …" |
| 6 | Tryk **Ring**. | Boksen "Eksempelvirksomhed": firmaet er en fiktiv demo-virksomhed, og opkald er slået fra | "Så ringer hun direkte …" |
| 7 | Luk boksen, og sænk telefonen. | Firmasiden | Videre til Tilbudstjek |

Demoen tager ca. 40 sekunder. Tal, mens du trykker. Vent aldrig mere end 3 sekunder på skærmen.

### Hvis noget går galt

- **Appen fryser eller lukker:** Sig "Teknikken driller, så her er de samme skærme." [Navn 4] peger på skærmbillederne på plakaten (Find, Resultater, Virksomhed), eller [Navn 2] åbner albummet "FixMatch demo". Sig de samme sætninger som i manuskriptet.
- **Ring beder om login:** Luk boksen. Sig: "Her ringer man direkte. I demoen er opkald slået fra." Log ikke ind foran dommerne.
- **Telefonen er død:** Tag backup-telefonen. Virker den heller ikke, så brug plakaten.
- **Dommerne kan ikke se skærmen:** Peg på skærmbilledet af VVS-listen på plakaten.
- **Der er ingen net:** Det gør ikke noget. Demoen kører i flytilstand. Undgå bare kortet.

## 60-sekunders-versionen

Når dommerne har travlt, eller der er kø ved standen. Én taler, helst [Navn 1]. Telefonen er åben på VVS-listen. **131 ord skrevet, ca. 140 udtalt, ca. 60–65 sekunder.**

Hvad koster det at få renset et stoppet afløb? De fleste aner det ikke. 12 procent af boligejerne har dårlige erfaringer med håndværkere.

Derfor har vi bygget FixMatch: en gratis iPhone-app, hvor man ser prisen, før man ringer.

[Vis telefonen.] Det her er demo-firmaer. Man ser timepris, afstand og anmeldelser fra brugere, der har kontaktet firmaet gennem FixMatch. Rækkefølgen kan ikke købes. Så ringer man direkte, uden gebyr pr. kunde.

Brugerne betaler aldrig. Firmaerne kan købe Pro, som vi foreslår til 299 til 499 kroner om måneden. Driften koster 9.900 kroner om året, så break-even er tre betalende firmaer.

Appen kører som testversion, og vi har ingen rigtige brugere endnu. Næste skridt er 40 verificerede firmaer i København. Kender I en håndværker? Så giv dem en flyer.

FixMatch. Se prisen, før du ringer.

## Hvis vi kun har 30 sekunder

Fx når en dommer allerede er på vej videre. **63 ord, ca. 30 sekunder.**

FixMatch er en gratis iPhone-app, hvor man ser håndværkernes egne priser, før man ringer. Man sammenligner op til tre på pris, afstand og anmeldelser fra brugere via FixMatch og ringer direkte. Firmaerne betaler aldrig pr. kunde, og rækkefølgen kan ikke købes. Appen kører som testversion, og nu samler vi de første 40 firmaer i København. Tag en flyer. Se prisen, før du ringer.

## Slutreplik

Når spørgsmålene er slut, eller dommerne går videre. [Navn 1] siger:

"Tak, fordi I kom forbi. Tag en flyer med, og kender I en håndværker i København, så giv den videre. Se prisen, før du ringer."

## Kildenoter samlet

Til jer, hvis en dommer spørger "Hvor har I det fra?". Siges ikke i pitchen.

| Tal eller påstand | Kilde |
|---|---|
| 12 % af boligejerne har dårlige erfaringer; 1.156 klager over håndværkere til ankenævnene i 2022 | Rapporten, "Kort fortalt", kilde [1] (vores egen analyse "Marked, navn og jura") |
| Sofie, 32, rækkehus i Valby, tilbud på 3.200 kr. | Rapporten afsnit 3 (persona, opdigtet) |
| Unge boligejere i storbyen (25–40 år) er mindre loyale over for "deres" håndværker | Rapporten afsnit 3, kilde [5] (TEKNIQ/Bolius) |
| 67 % vægter kvaliteten højest, 18 % prisen | Rapporten afsnit 3, kilde [5] (TEKNIQ/YouGov) |
| Rangering på pris, afstand og anmeldelser; kan ikke købes | `src/data/content.ts` ("Sådan rangerer vi"); `docs/jura/anmeldelser.md` |
| Verificeret = CVR, ejer og autorisation, ikke en kvalitetsgaranti | `src/data/content.ts`; README |
| Tilbudstjek: "Det gør ingen danske konkurrenter" | Rapporten "Kort fortalt" og afsnit 3, kilde [9] (egen konkurrentanalyse af 3byggetilbud, Handyhand, Autobutler, Anmeld Håndværker og Fikset) |
| Håndværkerfradraget kræver faktura | Rapporten afsnit 2, kilde [4] |
| Ca. 2.100 betalende firmaer hos 3byggetilbud | Rapporten afsnit 3, kilde [2] |
| Pro 299–499 kr./md. (forslag), aldrig en bedre plads | Rapporten afsnit 4–5 og BMC; talepapiret |
| Drift 9.900 kr./år; break-even 3 × 299 × 12 = 10.764 kr.; år 1 uden indtægt | Rapporten afsnit 5 |
| Testversion med demo-firmaer, ingen rigtige brugere | Talepapiret; rapporten SWOT (afsnit 8); README |
| 40 verificerede firmaer på 90 dage | Rapporten afsnit 4 (90-dagesmål) og afsnit 8 (port 1) |
| Fire lande klar i koden | Rapporten afsnit 8; README |
| Over 800 fejl i Xcode; konsulenten og den globale plan | Rapporten afsnit 6 og 7 |
