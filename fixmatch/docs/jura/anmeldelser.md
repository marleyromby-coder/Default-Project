# Anmeldelser i FixMatch

## Beslutning: Trustpilot er fravalgt

Besluttet 17. november 2026.

- **Mødet.** Vi mødtes med Trustpilot den 10. november 2026. Trustpilot sagde, at en integration med deres API godt kan lade sig gøre.
- **Prisen.** Prisen for det antal virksomheder, vi skal have med, var for høj. Til sammenligning koster hele FixMatch ca. 10.000 kr. om året at drive.
- **Beslutningen.** Vi dropper Trustpilot. Appen viser ingen TrustScores, stjerner eller antal anmeldelser fra Trustpilot, og rangeringen bruger dem ikke.
- **I stedet.** FixMatch rangerer på pris, afstand og vores egne anmeldelser. Kun brugere, der har kontaktet virksomheden gennem FixMatch, kan anmelde den – én gang hver.
- **Links.** En virksomhed må give links til sine egne profiler på andre anmeldelsessider (Google, Trustpilot og Anmeld Håndværker). Appen viser dem som almindelige tekstlinks uden scorer, stjerner eller logoer.

## Hvad må vi uden en aftale?

|                                                                                                      | Må vi?                                    |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Et almindeligt tekstlink til virksomhedens egen profil på Google, Trustpilot eller Anmeld Håndværker | ✅ Ja, når virksomheden selv giver linket |
| Vise stjerner, scorer, antal anmeldelser eller citater fra andre sider                               | ❌ Nej                                    |
| Bruge andres logoer, stjernedesign eller farver                                                      | ❌ Nej                                    |
| Hente data automatisk (scraping)                                                                     | ❌ Aldrig                                 |
| Skrive scorer eller antal ind i regnearket i hånden, fx til rangeringen                              | ❌ Nej. Det er stadig deres indhold       |
| Bruge "Trustpilot" eller andres navne som søgeord i App Store                                        | ❌ Nej (retningslinje 2.3.7)              |

Tjek, at et link peger på den rigtige virksomhed (navn og CVR), før I lægger det ind. Ellers kan en virksomhed låne en andens gode profil.

## Sådan virker FixMatch-anmeldelser

Markedsføringsloven § 6 b kræver, at vi siger, om og hvordan vi tjekker anmeldelserne. Det står på siden "Om anmeldelser" i appen og i vilkårene, punkt 4.

- Kun brugere, der har kontaktet virksomheden gennem FixMatch, kan anmelde den. Når brugeren trykker Ring, starter FaceTime eller sender en besked til virksomheden fra appen ("Send beskrivelsen"), gemmer appen en række i `contacts`, og databasen tjekker, at rækken findes, før anmeldelsen gemmes. Ved opkald gemmes rækken, når der trykkes, før telefonen ringer op, så et opkald, der bliver afbrudt eller ikke besvaret, tæller også. En besked tæller kun, hvis den ikke blev annulleret.
- Hver bruger kan anmelde en virksomhed én gang og kan rette sin anmeldelse senere.
- Derfor skriver vi i vilkårene og på "Om anmeldelser": "Vi tjekker, at du har trykket Ring eller Skriv til virksomheden i FixMatch. Vi kan ikke se, om opkaldet blev besvaret, eller om opgaven blev udført." Lov aldrig mere end det.
- Vi viser alle anmeldelser, også de dårlige, med de nyeste først. Vi ændrer aldrig i teksten.
- Ingen kan betale for at fjerne eller flytte en anmeldelse, og vi belønner ikke brugere for at anmelde.
- Vi skjuler anmeldelser, der bryder reglerne, og skriver kort til anmelderen hvorfor (DSA art. 16 og 17). Fremgangsmåden står i `docs/lancering/supabase.md`.
- Anmeldelserne tæller med i FixMatch-scoren sammen med pris og afstand, og brugeren vælger selv, hvad der vejer mest. En virksomhed uden anmeldelser tæller som 5 neutrale anmeldelser på 4,0. Siden "Sådan rangerer vi" forklarer det (§ 6 a).
- Anmeldelser på andre sider tjekker vi ikke, og de tæller ikke med i FixMatch-scoren.
- Skriv "anmeldelser fra brugere, der har kontaktet virksomheden gennem FixMatch" eller kort "anmeldelser fra brugere via FixMatch". Skriv aldrig, at anmeldelserne kommer fra rigtige kunder eller rigtige opkald, eller at de er ægte eller verificerede. Vi kan ikke se, om opkaldet blev besvaret, eller om de blev kunder (bilag 1, nr. 23 b).
- Demoanmeldelser er opdigtede og findes kun i demoversionen. Sig det, når I viser demoen.

## Plan B

1. **Flere egne anmeldelser.** Det er den vigtigste vej. Mind brugeren om at anmelde efter et opkald, men giv aldrig en belønning for det.
2. **Links til andre profiler.** Brugeren kan selv læse virksomhedens anmeldelser på Google, Trustpilot eller Anmeld Håndværker via linket.
3. **Trustpilot igen senere.** Har vi flere virksomheder og penge til det, kan vi spørge igen. Det kræver en skriftlig aftale, før vi viser noget. En ny formel skal stå på "Sådan rangerer vi" og varsles til virksomhederne 15 dage før (P2B-forordningen, art. 3).
4. **Google Places API: fravalgt.** Det koster penge pr. opslag, bedømmelser må ikke gemmes, og Googles vilkår forbyder at vise indholdet på et kort, der ikke er Googles. Vores kort er Apple Kort. Et almindeligt link til virksomheden på Google Maps koster intet og er i orden.
