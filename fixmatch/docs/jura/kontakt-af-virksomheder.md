# Sådan kontakter I håndværkere og værksteder lovligt

Holdet skal ringe til eller besøge virksomheder for at få deres samtykke. Det er lovligt, når I følger disse regler (markedsføringsloven § 10 og Forbrugerombudsmandens vejledning).

## Må vi gøre det?

| Kanal | Regel | I praksis |
| --- | --- | --- |
| **Besøg i butik/værksted** | Tilladt | Bedste metode. Tag samtykke-skabelonen med. |
| **Telefon til et selskab** (ApS, A/S m.fl.) | Tilladt | Ring til virksomhedens almindelige nummer. Stop, hvis de siger nej. |
| **Telefon til en enkeltmandsvirksomhed** | Tilladt, **medmindre** ejeren står på Robinsonlisten eller har frabedt sig henvendelser | Tjek først. Mange håndværkere er enkeltmandsvirksomheder. |
| **CVR-data med reklamebeskyttelse** | Må **ikke** bruges til markedsføring | Er virksomheden reklamebeskyttet i CVR, så brug ikke kontaktoplysningerne fra CVR til at ringe. Find nummeret på deres egen hjemmeside, eller besøg dem. |
| **E-mail, SMS, Messenger** | **Forbudt** uden forudgående samtykke – også over for virksomheder | Send kun en mail, hvis virksomheden har bedt om det (fx "send mig noget på mail" under opkaldet). |

Overtrædelser kan give bøde, og bevisbyrden for samtykke ligger hos jer.

## Telefon-manus (ca. 2 minutter)

> "Hej, jeg hedder [navn] og ringer fra FixMatch – en ny dansk app, hvor folk kan finde og sammenligne håndværkere på pris, afstand og anmeldelser og ringe direkte til jer. Det er gratis at være med, og der er ingen gebyrer pr. kunde.
>
> Må jeg fortælle kort, hvad det kræver? … Vi viser kun oplysninger, I selv godkender – kontakt, priser inkl. moms og åbningstider – og I kan til enhver tid få jer fjernet.
>
> Det tager tre minutter at tilmelde sig. Må jeg sende jer linket på SMS eller mail?"

Hvis de siger nej: tak for snakken, notér "ønsker ikke kontakt" og ring ikke igen.

## Den hurtigste vej: tilmeldingslinket

Virksomheden tilmelder sig selv og sætter selv flueben ved samtykket. Samtykket gemmes automatisk med ordlyd og tidspunkt (se `docs/lancering/supabase.md`), så I slipper for papirer og underskrifter.

- **Ved besøg:** lad dem udfylde det på jeres telefon (FixMatch → Mere → Tilmeld din virksomhed), eller vis en QR-kode til `fixmatch.dk/tilmeld/`. Det tager 3 minutter, og I kan hjælpe med priserne.
- **I telefonen:** spørg, om I må sende linket. Siger de ja, har de bedt om den ene SMS eller mail, og så må I sende den. Skriv i jeres liste, at de sagde ja, og hvornår.
- **London og resten af UK:** linket er `fixmatch.dk/en/sign-up/`. Siden og appen findes på engelsk.
- **Mål:** 20–30 virksomheder i én by (fx København eller London) er nok til at vise appen frem. Tag de fag, folk har mest brug for akut, først: VVS, el og låsesmed.

Regler uden for Danmark (kort fortalt – få en lokal advokat til at se på det før en stor kampagne):

| Land | Telefon til virksomheder | E-mail og SMS uden samtykke |
| --- | --- | --- |
| **UK** | Tilladt, men tjek numre mod TPS og CTPS (Telephone/Corporate Telephone Preference Service) først | Tilladt til selskaber (Ltd, plc) med en nem afmelding (PECR). **Ikke** til enkeltmandsvirksomheder og partnerships |
| **Tyskland** | Kun med formodet samtykke (UWG § 7) – fx hvis virksomheden selv annoncerer efter kunder til den slags tjenester. Besøg er sikrest | Forbudt uden forudgående samtykke |
| **Sverige og Norge** | Tilladt; respektér NIX-Telefon (SE) og Reservasjonsregisteret (NO) for enkeltpersonvirksomheder | Reglerne afhænger af, om modtageren er et selskab eller en person – send kun, når de har sagt ja |

## Det skal I registrere for hver virksomhed

- Dato for kontakt og hvem I talte med
- Om de sagde ja, nej eller "ring igen"
- Om de ønsker ikke at blive kontaktet igen (respektér det)
- Dato for samtykke → kolonnen `samtykke_dato`. Ved selvbetjent tilmelding står den allerede i `business_signups` og i eksporten.

## Hvad I ikke må

- Kopiere oplysninger, anmeldelser eller billeder fra andre portaler (fx Trustpilot, Krak, 3byggetilbud) – det er ophavsretligt beskyttet og strider ofte mod deres vilkår.
- Love en bestemt placering i appen mod betaling.
- Aftale fælles priser med eller mellem virksomhederne. Konkurrencerådet gav i 2023 Autobutler et påbud for faste priser på deres platform, og sagen endte med en bøde på 7 mio. kr.
- Skrive anmeldelser selv eller bede venner om det.
