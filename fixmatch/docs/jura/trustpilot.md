# Trustpilot i FixMatch

## Hvad må vi?

Trustpilot ejer TrustScores, stjerner, anmeldelser og sit logo. Ifølge Trustpilots egne retningslinjer er en virksomhed, der viser Trustpilot-indhold om **andre** virksomheder, en *Content Using Partner* – og det kræver en **skriftlig partneraftale** med Trustpilot.

Det betyder:

| | Uden aftale | Med aftale |
| --- | --- | --- |
| Link til virksomhedens Trustpilot-profil | ✅ (et almindeligt link) | ✅ |
| Vise TrustScore, stjerner, antal anmeldelser | ❌ | ✅ efter aftalens regler |
| Hente data automatisk (scraping) | ❌ aldrig | Kun via deres API |
| Bruge Trustpilots logo og stjernedesign | ❌ | Kun som deres brand-regler beskriver |

Apple kan også bede om dokumentation for, at I må vise indholdet (App Store-retningslinje 5.2.2).

## Sådan er appen sat op

- **Demo og TestFlight**: Trustpilot-visning er slået til, så juryen ser idéen.
- **App Store (`production`)**: slået fra (`EXPO_PUBLIC_FIXMATCH_TRUSTPILOT=off`). Slå til, når aftalen er underskrevet.
- Appen kalder TrustScore for "TrustScore" og nævner Trustpilot som kilde, viser opdateringsdato og linker til profilen.

## Plan B, hvis Trustpilot siger nej

- Google-anmeldelser via Google Places API (kræver attribution og har egne vilkår for, hvor længe data må gemmes).
- Egne, verificerede FixMatch-anmeldelser fra kunder, der har ringet via appen. Husk markedsføringsloven § 6 b: Oplys tydeligt, om og hvordan I kontrollerer, at anmeldelser kommer fra rigtige kunder.

## Mail til Trustpilot (skabelon)

> **Emne:** Partnerskab: dansk app til sammenligning af håndværkere
>
> Hej Trustpilot
>
> Vi er et team bag FixMatch, en ny dansk app, hvor forbrugere finder og sammenligner lokale håndværkere og autoværksteder på pris, afstand og anmeldelser – og ringer direkte til virksomheden. Alle virksomheder i appen har givet skriftligt samtykke.
>
> Vi vil gerne vise virksomhedernes TrustScore og antal anmeldelser med link til deres Trustpilot-profil, og vi vil følge jeres brand- og partnerregler. Kan I fortælle, hvordan vi bliver Content Using Partner, og hvilke vilkår og priser der gælder for en startup?
>
> Vi præsenterer FixMatch ved [innovationskonkurrence, dato] og vil gerne kunne fortælle, at vi er i dialog med jer.
>
> Venlig hilsen
> [navn, rolle, telefon]

Find den aktuelle kontaktvej på Trustpilots side for partnere (business.trustpilot.com), eller skriv til deres kontor i København.
