# App Store-tekster for FixMatch (dansk)

Kopiér felterne direkte ind i App Store Connect → appen → Distribution → *Dansk*. Tegngrænser er tjekket.

## App-oplysninger

| Felt | Værdi | Tegn |
| --- | --- | --- |
| Navn | `FixMatch: Find håndværker` | 25 / 30 |
| Undertitel | `Sammenlign pris & anmeldelser` | 29 / 30 |
| Primær kategori | Livsstil (Lifestyle) | |
| Sekundær kategori | Hjælpeværktøjer (Utilities) | |
| Aldersgrænse | 4+ (ingen af spørgsmålene besvares med ja) | |
| Pris | Gratis | |
| Bundle ID | `dk.fixmatch.app` | |
| SKU | `fixmatch-ios-1` | |

**Søgeord** (97 / 100 tegn – ingen mellemrum efter komma, og ord fra navn/undertitel gentages ikke):

```
vvs,elektriker,tømrer,murer,mekaniker,værksted,maler,tagdækker,låsesmed,bilværksted,blikkenslager
```

Brug ikke "Trustpilot" eller konkurrenters navne som søgeord – Apple afviser brug af andres varemærker (retningslinje 2.3.7).

**Reklametekst** (141 / 170 tegn – kan ændres uden ny version):

```
Ny: Sammenlign op til tre håndværkere side om side – timepris inkl. moms, afstand og TrustScore. Og vælg selv, hvad der betyder mest for dig.
```

## Beskrivelse

```
Mangler du en VVS'er, elektriker, tømrer, murer eller mekaniker? FixMatch finder lokale danske virksomheder og sammenligner dem på det, der betyder noget: pris, afstand og kundeanmeldelser. Så sparer du både tid og penge.

SE PRISEN FØR DU RINGER
• Timepris og typiske priser for almindelige opgaver – altid inkl. moms
• Kørselsgebyr og prisniveau sammenlignet med andre i faget
• Vejledende priser for fx stoppet afløb, ladestander, stort service og døroplukning

SAMMENLIGN PÅ ÉT SKÆRMBILLEDE
• Vælg op til tre virksomheder og se pris, afstand, TrustScore, døgnvagt og autorisation side om side
• FixMatch-scoren samler pris, afstand og anmeldelser – og du bestemmer selv vægtningen
• Sortér efter pris, afstand eller anmeldelser, og filtrér på åben nu, døgnvagt og autorisation

TJEKKET OG GENNEMSIGTIGT
• TrustScore og antal anmeldelser fra Trustpilot ved hver virksomhed
• CVR-nummer og autorisation fra Sikkerhedsstyrelsen for el og VVS
• Ingen kan betale sig til en bedre placering. Annoncer er altid tydeligt markeret

RING DIREKTE
• Telefonnummer, hjemmeside og rutevejledning lige ved hånden
• Ingen mellemled, ingen login og ingen gebyrer

FAG I FIXMATCH
VVS'er, elektriker, tømrer, murer, mekaniker, maler, tagdækker og låsesmed – flere kommer til.

DIT PRIVATLIV
FixMatch har ingen login og ingen reklamesporing. Din placering bruges kun på din telefon til at beregne afstande.

Er du håndværker eller værksted? Skriv til os, så kommer du gratis med.
```

## Hvad er nyt (version 1.0)

```
Første version af FixMatch: find, sammenlign og ring til lokale håndværkere og mekanikere.
```

## Links (skal være offentlige, før I indsender)

| Felt | Forslag |
| --- | --- |
| Support-URL | `https://fixmatch.dk/support` |
| Marketing-URL | `https://fixmatch.dk` |
| Privatlivspolitik-URL | `https://fixmatch.dk/privatliv` – brug teksten i `docs/jura/privatlivspolitik.md` |

Har I ikke et domæne endnu, kan I bruge en gratis side (fx GitHub Pages, Notion eller Google Sites) – men den skal være offentlig og må ikke kræve login.

## App Privacy ("privatlivsetiket")

Svar i App Store Connect → App-privatliv:

- **Indsamler du eller dine tredjepartspartnere data fra denne app?** → *Nej, vi indsamler ikke data fra denne app.*

Det er korrekt, fordi:

- placeringen kun bruges på telefonen og aldrig sendes nogen steder hen,
- gemte virksomheder, by og prioriteter kun gemmes lokalt,
- der ikke er login, analyse-SDK'er, reklamer eller crash-rapportering.

Tilføjer I senere analyse (fx Firebase, PostHog) eller login, skal svaret opdateres, før den version indsendes – ellers risikerer I afvisning efter retningslinje 5.1.2.

## Noter til Apples review-team (på engelsk)

```
FixMatch helps people in Denmark find and compare local tradespeople (plumbers, electricians, carpenters, bricklayers, mechanics, painters, roofers, locksmiths) by price range, distance and Trustpilot TrustScore, and contact them directly by phone or website.

• No account or login is required.
• Location permission is optional. Without it, the user picks a town manually (Mere → Placering). Location is processed on the device only.
• All listed businesses have given written consent to be listed. Prices are provided by the businesses.
• Trustpilot content is displayed under our partner agreement with Trustpilot A/S (agreement available on request).
• The app is in Danish. To test: open the app → tap "VVS'er" → tap a business → "Ring" opens the phone dialer.
```

*Fjern Trustpilot-linjen, hvis aftalen ikke er på plads – og vis i så fald ikke TrustScores i den version.*

## Skærmbilleder

Krav: mindst ét sæt til **6,9" iPhone** (1320 × 2868 eller 1290 × 2796 px). Appen understøtter ikke iPad, så iPad-billeder er ikke nødvendige.

Tag billederne på en rigtig iPhone (TestFlight-build med **live**-data, ikke demo). Forslag til rækkefølge og overskrifter:

1. Forside – *"Find den rette håndværker"*
2. Liste over VVS'ere – *"Sammenlign pris, afstand og anmeldelser"*
3. Virksomhedsside – *"Pris inkl. moms og TrustScore – før du ringer"*
4. Sammenlign side om side – *"Vælg den bedste på 10 sekunder"*
5. Dine prioriteter – *"Du bestemmer, hvad der tæller"*
