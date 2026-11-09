import type { IconName } from '@/components/ui/icon';
import { msg } from '@/i18n';

import type { CategoryId } from '@/lib/types';

/**
 * "Akut hjælp": what to do in the first minutes, before the tradesperson arrives. General
 * first aid for the home; the døgnvagt and, in danger, 112 take over.
 */
export interface Emergency {
  id: string;
  title: string;
  icon: IconName;
  category: CategoryId;
  /** The matching job, for prices and the mechanic/plumber list. */
  job?: string;
  /** Call 112 or the utility first, before anything else. */
  danger?: string;
  steps: string[];
  /** Whether pictures for the insurance company matter here. */
  insurance: boolean;
}

export const EMERGENCIES: Emergency[] = [
  {
    id: 'vandskade',
    title: msg('Vand løber ud'),
    icon: 'vvs',
    category: 'vvs',
    job: 'vandskade',
    steps: [
      msg('Luk for hovedhanen. Den sidder oftest ved vandmåleren i bryggers, kælder eller skab i entreen.'),
      msg('Sluk for strømmen i rummet på eltavlen, hvis vandet er nær stikkontakter eller lamper.'),
      msg('Flyt ting væk fra vandet, og læg håndklæder. Tag billeder, før du tørrer op.'),
      msg('Ring til døgnvagten. Fortæl, hvor vandet kommer fra, og om hovedhanen er lukket.'),
    ],
    insurance: true,
  },
  {
    id: 'kloak',
    title: msg('Kloakken stiger op'),
    icon: 'vvs',
    category: 'vvs',
    job: 'stoppet-afloeb',
    steps: [
      msg('Stop med at bruge vand i huset: ingen skyl, bad eller vaskemaskine.'),
      msg('Hold børn og kæledyr væk. Kloakvand er sundhedsfarligt; brug handsker og gummistøvler.'),
      msg('Tag billeder af skaden til forsikringen, og ring til dem inden for 24 timer.'),
      msg('Ring til døgnvagten. Kommer vandet fra vejen, så ring også til kommunens forsyning.'),
    ],
    insurance: true,
  },
  {
    id: 'stroem',
    title: msg('Strømmen er gået'),
    icon: 'elektriker',
    category: 'elektriker',
    job: 'fejlsoegning',
    steps: [
      msg('Tjek om naboerne også mangler strøm. Gør de det, er det netselskabet: se deres driftsinfo.'),
      msg('Se på eltavlen. Er HPFI-relæet slået fra, så træk alle stik ud, og slå det til igen.'),
      msg('Slår det fra igen, så sæt apparaterne i ét ad gangen. Det, der slår fra, er fejlen.'),
      msg('Lugter det brændt, eller er tavlen varm: rør den ikke. Ring til døgnvagten.'),
    ],
    insurance: false,
  },
  {
    id: 'laast-ude',
    title: msg('Låst ude'),
    icon: 'laasesmed',
    category: 'laasesmed',
    job: 'doeroplukning',
    steps: [
      msg('Tjek alle døre og vinduer, og om en nabo eller familie har en nøgle.'),
      msg('Bor du til leje, så ring til udlejer eller vicevært. Mange har en hovednøgle.'),
      msg('Ring til låsesmeden, og spørg om prisen, før de kører. Hav legitimation klar; de skal se, at du bor der.'),
      msg('Dagtid koster typisk 900–1.500 kr., aften og weekend mere.'),
    ],
    insurance: false,
  },
  {
    id: 'rude',
    title: msg('Knust rude eller indbrud'),
    icon: 'toemrer',
    category: 'toemrer',
    job: 'vindue',
    steps: [
      msg('Ved indbrud: ring til politiet på 114, og rør ikke ved noget, før de har været der.'),
      msg('Tag billeder af skaden, før du rydder op. Forsikringen skal se den.'),
      msg('Dæk hullet med plade eller kraftig plast, så huset er lukket for natten.'),
      msg('Ring til en tømrer med døgnvagt for en midlertidig lukning, og få et tilbud på den nye rude.'),
    ],
    insurance: true,
  },
  {
    id: 'tag',
    title: msg('Taget er utæt i storm'),
    icon: 'tagdaekker',
    category: 'tagdaekker',
    job: 'tagreparation',
    steps: [
      msg('Gå ikke op på taget i blæst eller regn. Sæt spande under, og flyt møbler.'),
      msg('Sluk for strømmen i rum, hvor der drypper nær lamper eller stik.'),
      msg('Tag billeder af skaden ude og inde. Stormskader dækkes ofte af forsikringen.'),
      msg(
        'Ring til en tagdækker med døgnvagt for en midlertidig afdækning. Den rigtige reparation venter til tørvejr.',
      ),
    ],
    insurance: true,
  },
  {
    id: 'gas',
    title: msg('Det lugter af gas'),
    icon: 'vvs',
    category: 'vvs',
    job: 'service-fyr',
    danger: msg(
      'Gå ud af huset først. Tænd eller sluk intet, heller ikke lys eller telefonen indenfor. Ring til gasselskabets døgnvagt eller 112 udefra.',
    ),
    steps: [
      msg('Luk for gassen ved hanen på måleren, hvis du kan nå den på vej ud.'),
      msg('Åbn vinduer og døre på vej ud, hvis det kan gøres hurtigt.'),
      msg('Advar naboerne, og hold afstand, til gasselskabet siger, at det er sikkert.'),
      msg('Først når det er sikkert: ring til en autoriseret VVS-installatør for at finde og rette lækagen.'),
    ],
    insurance: false,
  },
  {
    id: 'bil',
    title: msg('Bilen vil ikke starte'),
    icon: 'mekaniker',
    category: 'mekaniker',
    job: 'fejlkode',
    steps: [
      msg('Lyser instrumenterne svagt eller slet ikke, er det batteriet. Startkabler fra en anden bil hjælper oftest.'),
      msg('Starter den, så kør mindst 30 minutter, eller få batteriet ladet. Et batteri holder 5–7 år.'),
      msg('Drejer starteren, men motoren tænder ikke: tjek brændstof, og se efter lamper på panelet.'),
      msg('Ring til et værksted med døgnvagt eller dit vejhjælpsabonnement. Mange forsikringer har vejhjælp med.'),
    ],
    insurance: false,
  },
];
