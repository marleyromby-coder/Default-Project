# Privatlivspolitik for FixMatch

*Senest opdateret: {{updated}}.*

> Skabelon. Felterne i {{…}} udfyldes fra `src/constants/app-info.ts`, når hjemmesiden bygges med `npm run website:build`. Linjer, der starter med ">", er noter til jer og kommer ikke med på hjemmesiden. Den engelske udgave er `privacy-policy.en.md` – ret begge, når I ændrer noget.

## 1. Dataansvarlig

{{publisher}}. E-mail: {{email}}.

> Uden firma er det personen bag Apple Developer-kontoen, der er dataansvarlig. Når der er et firma, skriver I firmanavn og CVR-nummer i `company` i `app-info.ts`. En adresse er ikke et krav, når der er en e-mail, I læser.

## 2. Kort fortalt

FixMatch har ingen reklamer og ingen sporing. Opretter du en bruger, gemmer vi din e-mail, dit navn og dit telefonnummer i EU, så de virksomheder, du ringer til gennem FixMatch, ved, hvem de taler med (punkt 7). Alt andet bliver på din telefon.

## 3. Placering

Hvis du giver tilladelse, bruger appen din placering, **mens den er åben**, til at beregne afstanden til virksomhederne. Beregningen sker på din telefon. Placeringen sendes ikke til os eller andre og gemmes kun på telefonen. Du kan altid slå adgangen fra i iPhonens Indstillinger og i stedet vælge en by.

## 4. Kortet (Apple Kort)

Kortet vises med Apple Kort (MapKit). For at vise kortet henter din iPhone kortbilleder direkte fra Apple, og Apple behandler de forespørgsler efter sin egen privatlivspolitik. FixMatch får ikke adgang til de data og gemmer ingen kortdata. Virksomhedernes placering på kortet er deres egne adresser, som de har givet samtykke til.

## 5. "Beskriv dit problem"

Teksten, du skriver, og dit budget behandles kun på din telefon for at finde faget og de virksomheder, der passer. Teksten sendes ikke til FixMatch eller til virksomhederne. Hvis du trykker "Del beskrivelsen med en virksomhed", bestemmer du selv, hvem du sender den til.

## 6. Oplysninger gemt på din telefon

Dine gemte virksomheder, din valgte by, dine prioriteter og din sammenligningsliste gemmes lokalt på telefonen, så de er der næste gang. De forlader ikke telefonen. Du sletter dem under *Mere → Nulstil app-data* eller ved at slette appen.

## 7. Din bruger

Du kan se og sammenligne virksomheder uden en bruger. Første gang du ringer til en virksomhed gennem FixMatch, beder vi dig oprette en, så virksomheden ved, hvem den taler med.

- **Det gemmer vi:** din e-mail (eller det id og den e-mail, Apple giver os, når du bruger "Log ind med Apple" – Apple kan skjule din rigtige e-mail), dit navn, dit telefonnummer, og hvilke virksomheder du har ringet til gennem FixMatch og hvornår.
- **Hvorfor:** så du kan logge ind, og så virksomheden kan se navn og nummer på den, der har kontaktet den gennem FixMatch. Retsgrundlaget er aftalen med dig om at bruge FixMatch (GDPR art. 6, stk. 1, litra b).
- **Hvem ser det:** kun den virksomhed, du har ringet til, ser dit navn, dit telefonnummer og tidspunktet. Vi sælger aldrig oplysningerne og bruger dem ikke til reklame.
- **Hvor:** hos vores databehandler Supabase på servere i EU (Frankfurt, Tyskland).
- **Hvor længe:** indtil du sletter din bruger under *Mere → Slet bruger*. Så slettes brugeren, navn, telefonnummer og listen over opkald med det samme. Brugere, der ikke har været brugt i 24 måneder, sletter vi.

> Indgå Supabase' databehandleraftale (DPA) i dashboardet under Settings → Legal Documents, og vælg region Frankfurt (eu-central-1), når projektet oprettes. Slet inaktive brugere mindst én gang om året (se docs/lancering/supabase.md).

## 8. Når du kontakter en virksomhed

Selve opkaldet, hjemmesider og rutevejledning sker i telefonens egne apps eller i en browser, og virksomhedens, Apples eller browserens privatlivspolitik gælder da. Har du en bruger, registrerer FixMatch, at du har ringet, så virksomheden kan se dit navn og nummer (punkt 7).

## 9. Billeder og data fra internettet

Appen henter virksomhedernes egne billeder og (hvis aktiveret) en opdateret virksomhedsliste fra internettet. Ved den slags forespørgsler ser serveren din IP-adresse, som det er normalt på internettet. Vi gemmer ikke IP-adresser i forbindelse med hentning af virksomhedslisten.

## 10. Oplysninger om virksomheder

Vi viser oplysninger om virksomheder (fx navn, CVR, telefonnummer og priser), som virksomhederne selv har godkendt. For enkeltmandsvirksomheder kan det være personoplysninger om ejeren. Retsgrundlaget er virksomhedens samtykke (GDPR art. 6, stk. 1, litra a). Tilmelder virksomheden sig selv i appen eller på hjemmesiden, gemmer vi tilmeldingen med samtykketeksten og tidspunktet hos Supabase i EU som dokumentation. Samtykket kan til enhver tid trækkes tilbage ved at skrive til {{email}}, og så fjerner vi oplysningerne inden for 2 hverdage. Kontaktpersoners navn og e-mail bruges kun til at administrere profilen og opbevares, så længe profilen findes, og 12 måneder derefter som dokumentation for samtykket.

## 11. Henvendelser til os

Skriver du til os, bruger vi din e-mail og det, du skriver, til at svare dig. Vi sletter henvendelsen senest 12 måneder efter, sagen er afsluttet.

## 12. Dine rettigheder

Du har ret til indsigt, berigtigelse, sletning, begrænsning og indsigelse samt dataportabilitet. Skriv til {{email}}. Du kan klage til Datatilsynet, Carl Jacobsens Vej 35, 2500 Valby, www.datatilsynet.dk. Bor du i et andet land, kan du også klage til tilsynsmyndigheden dér, fx Integritetsskyddsmyndigheten i Sverige, Datatilsynet i Norge eller ICO i Storbritannien.

## 13. Ændringer

Ændrer vi politikken, opdaterer vi datoen øverst og skriver det i appens "Hvad er nyt".
