# FixMatch – dommernes spørgsmål og vores svar

Til spørgsmålene efter standpitchen. Svarene er korte, så de kan siges højt på 15–30 sekunder. Lær indholdet, ikke ordene.

**Sådan svarer I:**

- Den, der har området, svarer: [Navn 1] idé og produkt, [Navn 2] salg og partnere, [Navn 3] økonomi og jura, [Navn 4] marketing.
- Svar først på spørgsmålet i én sætning. Forklar derefter, hvis der er tid.
- Ved I det ikke, så sig det: "Det ved vi ikke endnu. Sådan vil vi finde ud af det: …" Se afsnittet "Svar vi ikke har endnu".
- Kilden under hvert svar er til jer. Spørger en dommer "Hvor har I det fra?", så sig kilden.
- [Klammer] skal udfyldes, før I tager til Vejle. Står der stadig en klamme, så brug det ærlige reservesvar.

## Idé og produkt

**1. Hvorfor skal jeg ikke bare bruge Google Maps? Der er jo anmeldelser og et telefonnummer.**
Google Maps er god til at finde et firma, men der står sjældent en pris. Hos os ser man firmaernes egne priser, før man ringer. Man kan sammenligne op til tre, tjekke et tilbud med Tilbudstjek og se, hvem vi har tjekket med Verificeret. Og rækkefølgen kan ikke købes.
_Kilde: rapporten "Kort fortalt" og afsnit 3; `src/state/app-state.tsx` (op til 3 i sammenligningen); `src/data/content.ts` ("Sådan rangerer vi")._

**2. Jeres egen kilde siger, at 67 % vælger efter kvalitet og kun 18 % efter pris. Hvorfor sælger I så på pris?**
Det er rigtigt, og derfor sælger vi ikke kun på pris. Kunden har mest brug for tryghed, så Verificeret og anmeldelserne står lige så tydeligt som prisen. Listen starter på "Bedste match", ikke på "Billigste", og man vælger selv, hvad der vejer mest. Prisen er bare det, ingen andre viser før kontakt.
_Kilde: rapporten afsnit 3, kilde [5] (TEKNIQ/YouGov); `src/app/kategori/[id].tsx` (standard er "Bedste match"); `content.ts`._

**3. Hvad hvis et firma skriver en lav pris og så tager mere? Hvem holder priserne opdaterede?**
Priserne er firmaets egne, inklusive moms. De er et udgangspunkt, ikke et fast tilbud. Firmaet bekræfter mindst hver sjette måned, at de er aktuelle. Og brugere, der har kontaktet firmaet gennem FixMatch, kan dele, hvad de betalte, og skrive en anmeldelse. Så kan andre se det, hvis prisen ikke holdt.
_Kilde: `docs/jura/samtykke-virksomhed.md` (inkl. moms, bekræftes mindst hver 6. måned); talepapiret ("et udgangspunkt, ikke et fast tilbud"); `content.ts` (delte priser og anmeldelser)._

**4. Hvorfor skulle en håndværker vise sine priser, så konkurrenten bare kan gå 50 kroner under? Er det ikke jeres største risiko?**
Jo, det er en af de største. "Firmaer, der ikke vil vise priser" står som en trussel i vores SWOT. Derfor vælger firmaet selv, hvilke priser det viser, fx timepris, kørsel og et par typiske opgaver. Og rækkefølgen er ikke kun pris. Afstand og anmeldelser tæller også, så det billigste firma vinder ikke automatisk.
_Kilde: rapporten afsnit 8 (SWOT); talepapiret ("Jeg kan ikke give en pris …"); `content.ts` ("Sådan rangerer vi")._

**5. Hvorfor både håndværkere og mekanikere, når jeres målgruppe er unge boligejere?**
Vores brugere er boligejere, lejere og bilister, og problemet er det samme: Man ved ikke, hvad det bør koste. Mekaniker er ét af vores otte fag. Men vi starter med de unge boligejere i København, og det er dem, vi markedsfører til først.
_Kilde: rapporten "Kort fortalt" og afsnit 3 (segmentering, 8 fag)._

## Marked og konkurrenter

**6. Hvor stort er markedet?**
Danmark har ca. 2,8 millioner husstande, og bygge og anlæg beskæftiger ca. 197.000 personer. Markedslederen 3byggetilbud formidler over 70.000 opgaver om året til ca. 2.100 betalende firmaer, og porteføljen bag blev solgt for 550 millioner norske kroner i 2025. Samtidig steg håndværkerpriserne 4,3 % i 2025, og firmaerne får færre opgaver. Så kunderne mangler overblik, og firmaerne mangler kunder.
_Kilde: rapporten afsnit 1 og 3, kilde [2], [3], [6], [7] og [8]._

**7. Hvem er jeres konkurrenter, og hvorfor vinder I? Hvordan ved I, at ingen andre har Tilbudstjek?**
3byggetilbud, Handyhand, Autobutler, Anmeld Håndværker og nye Fikset. Ifølge vores egen konkurrentanalyse viser ingen af dem prisen før kontakt, og ingen vurderer et tilbud, man allerede har fået. 3byggetilbuds model virker. De 2.100 betalende firmaer viser, at firmaerne betaler for kunder. Vi er et andet valg: Kunden ser prisen først, og firmaet betaler ikke pr. kunde. Man kan sagtens bruge begge.
_Kilde: rapporten afsnit 3 (konkurrentanalysen og positioneringskortet), kilde [9] (egen analyse); talepapiret ("Jeg bruger allerede 3byggetilbud")._

**8. Hvad gør I, hvis en stor portal kopierer jer, eller folk bare spørger ChatGPT om prisen?**
Det er reelle trusler, og begge står i vores Porter- og SWOT-analyse. En chatbot giver et estimat. Vi viser, hvad firmaerne i området selv siger, de tager, og man kan ringe til dem med det samme. Vores forsvar bliver data, andre ikke har: firmaernes egne priser, priser, som brugere selv har delt, og vores egne anmeldelser. Den data har vi ikke endnu. Den kommer med de første firmaer.
_Kilde: rapporten afsnit 3 (Porters fem kræfter), afsnit 5 (konkurrencefordele) og afsnit 8 (SWOT)._

## Salg og markedsføring

**9. Høne og æg: Hvordan får I firmaer uden brugere og brugere uden firmaer?**
Vi starter med firmaerne i én by, København, fordi en app uden håndværkere er tom. Målet for de første 90 dage er 300 firmaer på listen, 150 samtaler, 60 tilmeldte og 40 live, mindst tre i hvert fag. Vi finder dem i CVR og på Google Maps og ringer eller kommer forbi. Det er gratis for firmaerne, så de har intet at tabe. Først derefter går vi efter boligejerne med korte videoer på TikTok og Instagram om, hvad en opgave koster.
_Kilde: rapporten afsnit 4 (salgsstrategi, 90-dagesmål, 4P og AIDA)._

**10. Hvor mange firmaer har I talt med, og hvad sagde de?**
[Udfyld efter jeres opkald: "I denne uge ringede vi til [X] firmaer i København. [Y] vil gerne være med, når vi går live. En [fag] sagde: '[citat]'. Dem, der sagde nej, sagde typisk: '[grund]'."]
Har I ikke ringet, eller har ingen sagt ja, så sig ærligt: "Vi har ingen rigtige firmaer i appen endnu. Det er præcis det, vi gør nu, og målet er 40 på 90 dage."
_Kilde: rapporten afsnit 3 og 7 (pladsholderne for reaktioner og antal skal udfyldes); afsnit 4 (90-dagesmål)._

**11. Hvor mange brugere eller downloads har I?**
Ingen rigtige brugere endnu. Appen kører som testversion i TestFlight med demo-firmaer og er ikke i App Store. Vi starter bevidst med firmaerne, og vi lover dem ikke et bestemt antal opkald.
_Kilde: talepapiret ("Hvor mange brugere har I?"); rapporten SWOT (afsnit 8); `docs/lancering/global-lancering.md`._

**12. Må I overhovedet ringe til firmaerne?**
Ja, men med regler. Vi ringer kun til firmaets almindelige nummer. Vi tjekker Robinsonlisten for enkeltmandsfirmaer, og er et firma reklamebeskyttet i CVR, bruger vi ikke de kontaktoplysninger. Siger de nej, ringer vi ikke igen. SMS eller mail sender vi først efter et ja.
_Kilde: talepapiret ("Før I ringer"); `docs/jura/kontakt-af-virksomheder.md`._

## Økonomi

**13. Hvordan tjener I penge?**
Brugerne betaler aldrig. Firmaerne kan vælge et frivilligt Pro-abonnement med flere billeder og priser på flere opgaver. Vi foreslår 299 til 499 kroner om måneden. Senere kan der komme en annonceplads, men den er altid mærket "Annonce" og ændrer ikke rækkefølgen. Hverken Pro eller annoncer kan købe en bedre plads.
_Kilde: rapporten afsnit 4–5 og BMC; talepapiret ("Hvordan tjener I penge"); `docs/jura/privatlivspolitik.md` (annoncer mærket "Annonce")._

**14. Hvis Pro ikke giver en bedre plads, hvorfor skulle et firma så betale? Og hvordan har I sat prisen?**
Pro giver flere billeder og priser på flere opgaver, så kunden ved mere, før hun ringer. Ikke en bedre plads. Prisen er et forslag ud fra konkurrenterne. I Storbritannien koster ét lead 5 til 40 pund, og det deles med 3–4 firmaer. Hos os er prisen fast, og ét ekstra job om måneden betaler den. Men vi har ikke testet betalingsviljen endnu. Derfor sælger vi først Pro i port 3, når brugerne kommer igen, og firmaerne får opkald.
_Kilde: rapporten afsnit 5 (prissætning, kilde [9]) og afsnit 8 (portene); talepapiret._

**15. Hvem betaler de 9.900 kroner det første år, når I ikke har indtægter? Og i rapporten står, at de første 100 firmaer får Pro gratis. Hvordan passer det med break-even ved tre?**
Det første år tager vi ingen penge, fordi appen er i test, og vi skal stifte et ApS, før vi tager betaling. [Udfyld, kun hvis det er sandt: "Driften det første år betaler vi selv" / "… betaler skolen" / "… dækker vi med …".]
"De første 100 får Pro gratis" er en idé i rapporten, som vi ikke har besluttet. Gør vi det, flytter break-even sig: Så skal vi have tre betalende ud over de gratis. Men driften koster stadig kun 9.900 kroner om året.
_Kilde: rapporten afsnit 5 (penetrationsstrategi, omkostninger, regneeksempel: år 1 = 0 kr.); talepapiret ("Det skal I undgå"). Rapporten siger ikke, hvem der betaler år 1._

**16. Hvad tjener I om tre år?**
Vi har lavet et regneeksempel, ikke en prognose. År 1 er test og lancering i København uden indtægt. År 2: 50 betalende firmaer à 299 kroner giver 179.400 kroner. År 3: 200 à 399 kroner giver 957.600 kroner. Når vi vokser, kommer der nye udgifter til løn, jura og moms.
_Kilde: rapporten afsnit 5 (tabellen "Regneeksempel, ikke prognose")._

**17. Hvad vil I bruge præmiepenge på?**
[Tilpas til holdets beslutning.] På det, der står mellem os og App Store: at stifte et ApS med CVR-nummer, juridisk rådgivning og databehandleraftaler. Derudover varemærket og lanceringen i København. Hele første års drift koster 9.900 kroner, så pengene går til at vokse, ikke til at overleve.
_Kilde: rapporten afsnit 5 (omkostninger) og afsnit 8 (næste skridt). Rapporten nævner ikke præmiepenge, så svaret er et forslag._

## Tryghed, anmeldelser og jura

**18. Kan man stole på anmeldelserne? Kan et firma snyde?**
Kun brugere, der har trykket Ring eller skrevet til firmaet i FixMatch, kan anmelde det, og kun én gang hver. Vi siger åbent, at vi ikke kan se, om opkaldet blev besvaret, eller om opgaven blev udført. Vi viser alle anmeldelser, også de dårlige, og ingen kan betale for at fjerne en. Anmeldelser, der bryder reglerne, bliver skjult.
_Kilde: `docs/jura/anmeldelser.md` (markedsføringsloven § 6 b); `content.ts` ("Om anmeldelser")._

**19. Hvad betyder Verificeret? Tjekker I kvaliteten?**
Nej. Verificeret betyder, at FixMatch selv har tjekket CVR, ejer og autorisation. Mærket er gratis, kriterierne er de samme for alle, og det gælder et år. Det giver ikke en bedre placering, og det er ingen garanti for kvaliteten af arbejdet. Det skriver vi også i appen.
_Kilde: `content.ts` ("Sådan verificerer vi"); README (gælder et år)._

**20. Hvorfor bruger I ikke Trustpilot?**
Vi ville vise Trustpilot-stjerner i appen. Vi mødtes med Trustpilot den 10. november. En integration kunne godt lade sig gøre, men prisen var for høj for vores antal firmaer, når hele FixMatch koster 9.900 kroner om året at drive. Den 17. november droppede vi det. Nu bygger vi vores egne anmeldelser, og firmaerne kan give et almindeligt link til deres profiler, uden stjerner.
_Kilde: `docs/jura/anmeldelser.md` (møde 10. nov. 2026, fravalgt 17. nov. 2026, "ca. 10.000 kr. om året"); rapporten afsnit 5 (9.900 kr.), 6 og 7._

**21. Er det ikke prisaftaler, når Tilbudstjek siger, hvad der er "normalt"?**
Nej. Firmaerne sætter selv deres priser, og vi aftaler aldrig priser med dem eller mellem dem. Det ville være ulovligt. Tilbudstjek viser kunden et normalt prisniveau og fradraget i kroner. Det er information til kunden, ikke en pris til firmaerne.
_Kilde: talepapiret ("Bestemmer I mine priser?"); `docs/jura/samtykke-virksomhed.md` ("FixMatch fastsætter eller koordinerer aldrig priser")._

**22. Hvad med GDPR? Hvem er dataansvarlig, når I ikke har et CVR-nummer?**
Indtil vi har et ApS, er det personen bag vores Apple-udviklerkonto. Data ligger i EU, hos Supabase i Frankfurt. Firmaernes samtykke gemmes med ordlyd, version og tidspunkt, og en advokat har gennemgået GDPR, samtykke og dataansvar. Før vi tager penge, stifter vi et ApS og skriver databehandleraftaler.
_Kilde: `docs/jura/privatlivspolitik.md` (punkt 1, dataansvarlig); README (Supabase, samtykke); rapporten afsnit 5, 7 og 8._

## Team, bæredygtighed og fremtid

**23. Har I selv bygget appen? Har I brugt AI?**
Ja, vi har selv bygget den. Og ja, vi har brugt AI-værktøjer til kode og analyse, ligesom mange udviklere gør i dag. Men beslutningerne om produkt, design og marked har vi selv truffet. Og da Xcode, Apples program til at bygge apps, viste over 800 fejl, rettede vi dem, til appen kom på TestFlight.
_Kilde: rapporten afsnit 6 (styrker og svagheder, kriser). Sig "AI" her, fordi rapporten selv gør det. I selve pitchen bruger vi ikke ordet._

**24. Hvem gør hvad i teamet, og hvad har I lært?**
[Navn 1] står for idé og produkt, [Navn 2] for salg og partnere, [Navn 3] for økonomi og jura og [Navn 4] for marketing. Vi har lært, at en god idé ikke er nok. Den skal overleve mødet med kunder, jura og teknik. Derfor droppede vi både den globale plan og Trustpilot.
_Kilde: rapporten afsnit 6 (roller) og afsnit 8 (læringsudbytte); `team.json` (navnene er pladsholdere)._

**25. Hvordan er FixMatch bæredygtigt?**
Appen viser afstanden, så man kan vælge lokalt. Med Naborabat kan tre familier få renset tagrender samme dag, og så sparer håndværkeren to ture. Tilbudstjek viser håndværkerfradraget i kroner, og det kræver faktura. Men vi kan endnu ikke dokumentere effekten. Efter lanceringen måler vi afstanden til det valgte firma og andelen af Naborabat-opgaver.
_Kilde: rapporten afsnit 2 (Triple Bottom Line, verdensmål 8, 11, 12, 13 og 16, kritisk vurdering)._

**26. Hvorfor kun iPhone og kun København? Hvordan vil I vokse?**
Vi vil gøre én ting godt, før vi gør to. "Kun iPhone" står som en svaghed i vores SWOT. Firmaerne behøver ikke en iPhone, for tilmeldingen og "Ledig i dag" ligger på hjemmesiden. Planen har porte: først 40 verificerede firmaer i København, så App Store i Danmark og Aarhus, så Pro og til sidst Sverige og Norge og derefter Tyskland og Storbritannien. De fire lande er allerede klar i koden.
_Kilde: talepapiret ("Mange af mine kunder har Android"); rapporten afsnit 8 (portene, SWOT); README._

## Svar vi ikke har endnu

Her er det ærlige svar "Det ved vi ikke endnu". Sig det roligt, og sig derefter, hvordan I finder ud af det. Det, der er markeret "forslag", står ikke i rapporten. Beslut det i teamet, før I siger det.

**Vil firmaerne betale for Pro?**
Det ved vi ikke endnu. Vi har ikke testet betalingsviljen. Sådan finder vi ud af det: Vi sælger først Pro i port 3, når firmaerne får opkald gennem appen. (Forslag: Spørg de første 40 firmaer, hvad flere billeder og priser er værd for dem, før vi sætter prisen.)
_Kilde: rapporten afsnit 5 og 8._

**Kommer brugerne igen? Man skal jo kun bruge en VVS'er en gang imellem.**
Det ved vi ikke endnu. Appen har ting, der giver grund til at komme igen: Min bolig minder om eftersyn, og så er der Naborabat og Tilbudstjek. Sådan finder vi ud af det: Efter lanceringen måler vi, hvor mange der kommer igen. Det er et af vores næste skridt.
_Kilde: rapporten afsnit 2 (Min bolig) og afsnit 8 (næste skridt 3)._

**Hvor mange opkald får et firma?**
Det ved vi ikke endnu, og derfor lover vi ikke et bestemt antal. Sådan finder vi ud af det: Firmaerne får en månedlig mail med visninger og opkald.
_Kilde: rapporten afsnit 4 (4P); talepapiret ("Det skal I undgå")._

**Hvad koster det jer at få ét firma med?**
Det ved vi ikke præcist endnu. Planen er 300 firmaer på listen for at få 40 live, altså 7–8 firmaer på listen for hvert firma, der kommer med. Sådan finder vi ud af det: (Forslag: Skriv ned, hvor lang tid hvert opkald og besøg tager i de første uger.)
_Kilde: rapporten afsnit 4 (90-dagesmål)._

**Hvad gør I, hvis I kun får 10 firmaer på 90 dage i stedet for 40?**
Så går vi ikke videre til næste port. Det er derfor, planen har porte. Sådan finder vi ud af, hvad der skal ændres: Vi spørger dem, der sagde nej, hvorfor. (Forslag: Prøv færre fag eller én bydel, så der stadig er mindst tre firmaer i hvert fag.)
_Kilde: rapporten afsnit 8 (portene)._

**Virker bæredygtigheden i praksis?**
Det kan vi ikke dokumentere endnu. Hvis appen får folk til at bestille flere småopgaver, kan kørslen også stige. Sådan finder vi ud af det: Efter lanceringen måler vi andelen af opgaver i Naborabat-grupper og den gennemsnitlige afstand til det valgte firma.
_Kilde: rapporten afsnit 2 (kritisk vurdering)._

**Hvor kommer de 12 % og de over 1.100 klager oprindeligt fra?**
Det præcise tal er 1.156 klager i 2022. Tallene står i vores egen analyse, "Marked, navn og jura", som er kilde [1] i rapporten. [Udfyld før Vejle: den oprindelige kilde bag hvert tal.] Har I den ikke: "Den oprindelige kilde har jeg ikke med her, men den står i vores analyse, og vi sender den gerne."
_Kilde: rapporten, "Kort fortalt" og kildelisten [1]._

**Fortsætter I med FixMatch efter Business Minds og efter gymnasiet? Hvem ejer det?**
[Teamet skal selv svare. Aftal svaret før Vejle, og sig kun det, I har besluttet.] Har I ikke besluttet det: "Det har vi ikke besluttet endnu. Først skal vi se, om de første 40 firmaer vil være med."
_Kilde: ingen. Rapporten nævner det ikke._

## Det skal I undgå

- **Brugertal, downloads eller citater, I ikke har.** Sig "ingen rigtige brugere endnu" og "demo-firmaer".
- **"Rigtige kunder", "ægte anmeldelser" eller "verificerede anmeldelser".** Sig "anmeldelser fra brugere, der har kontaktet firmaet gennem FixMatch".
- **At kalde Verificeret et kvalitetstjek.** Det dækker CVR, ejer og autorisation. Peger I på mærket i demoen, så sig "i den rigtige app".
- **Trustpilot som en del af produktet.** Trustpilot er en beslutning, vi har truffet: fravalgt den 17. november.
- **At love et antal opkald, en topplacering eller eneret i et område.**
- **"De første 100 får Pro gratis" som noget, der er besluttet.** Det er en idé i rapporten.
- **"Tre betalende dækker det første år".** Sig "break-even er tre betalende firmaer", og sig, at vi ikke tager penge i år 1.
- **"Vi har firmaernes egne priser" i nutid.** Sig "vores forsvar bliver data …". Der er ingen rigtige firmaer i appen endnu.
- **At tale grimt om 3byggetilbud eller andre**, fx "deres model er dårlig". Hold jer til fakta: De tager betaling pr. lead, og kunden ser først prisen, når tilbuddene kommer.
- **Hypeord i pitchen:** AI, algoritme, platform, disrupt, "Uber for håndværkere", MVP. Bliver I spurgt direkte om AI-værktøjer, så svar ærligt (spørgsmål 23).
- **At gætte et tal.** Står tallet ikke i rapporten eller her, så sig: "Det tal har jeg ikke med. Det finder jeg til jer."
- **At love en dato for App Store.** Sig "når de første firmaer er med".
- **At undskylde for, at I er unge.** Vær direkte og ærlig om, hvor langt I er.
- **At diskutere med en dommer.** Sig "Godt spørgsmål" og svar. Er dommeren uenig, så sig "Det tager vi med", og gå videre.
