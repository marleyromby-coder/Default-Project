import type { IconName } from '@/components/ui/icon';
import { msg } from '@/i18n';

/**
 * The warning lamps most cars share, what they mean, whether you can drive on, and what the
 * repair typically costs (DKK incl. VAT, 2026). The guide is general advice; the car's manual
 * and the workshop decide in the end.
 */
export type LampColor = 'red' | 'yellow' | 'blue';
export type DriveAdvice = 'stop' | 'soon' | 'ok';

export interface WarningLamp {
  id: string;
  name: string;
  icon: IconName;
  color: LampColor;
  meaning: string;
  advice: DriveAdvice;
  adviceText: string;
  /** Typical cost to find and fix the cause. */
  costMin: number;
  costMax: number;
  /** The mechanic job that matches, for "Find en mekaniker". */
  job?: string;
}

export const DRIVE_ADVICE: Record<DriveAdvice, string> = {
  stop: msg('Stands bilen, så snart det er sikkert'),
  soon: msg('Kør forsigtigt til værksted inden for få dage'),
  ok: msg('Du kan køre videre, men få det tjekket'),
};

export const WARNING_LAMPS: WarningLamp[] = [
  {
    id: 'olie',
    name: msg('Olietryk'),
    icon: 'oil',
    color: 'red',
    meaning: msg('Motoren får ikke olie nok. Det kan være for lidt olie eller en defekt pumpe.'),
    advice: 'stop',
    adviceText: msg(
      'Sluk motoren med det samme. Kører du videre, kan motoren sætte sig fast. Tjek oliestanden, og fyld på, før du kører igen.',
    ),
    costMin: 300,
    costMax: 8000,
    job: 'fejlkode',
  },
  {
    id: 'temperatur',
    name: msg('Motortemperatur'),
    icon: 'thermometer',
    color: 'red',
    meaning: msg('Motoren er for varm. Ofte mangler der kølervæske, eller termostaten eller blæseren virker ikke.'),
    advice: 'stop',
    adviceText: msg(
      'Hold ind, og lad motoren køle af i mindst 30 minutter. Åbn aldrig kølerdækslet, mens motoren er varm.',
    ),
    costMin: 500,
    costMax: 6000,
    job: 'fejlkode',
  },
  {
    id: 'bremser',
    name: msg('Bremser'),
    icon: 'brake',
    color: 'red',
    meaning: msg('Håndbremsen er trukket, bremsevæsken er lav, eller bremseklodserne er slidt ned.'),
    advice: 'stop',
    adviceText: msg(
      'Er håndbremsen fri, så kør kun forsigtigt det nærmeste sted hen. Bremser er ikke noget, man venter med.',
    ),
    costMin: 1400,
    costMax: 5000,
    job: 'bremser',
  },
  {
    id: 'batteri',
    name: msg('Batteri og lader'),
    icon: 'battery',
    color: 'red',
    meaning: msg('Generatoren lader ikke batteriet. Bilen kører på batteriet, til det er tomt.'),
    advice: 'soon',
    adviceText: msg(
      'Sluk alt unødvendigt (varme, radio, lys), og kør direkte til værksted. Du har typisk under en time.',
    ),
    costMin: 1500,
    costMax: 6000,
    job: 'fejlkode',
  },
  {
    id: 'airbag',
    name: msg('Airbag'),
    icon: 'airbag',
    color: 'red',
    meaning: msg('Fejl i airbag eller selestrammer. Airbaggen virker måske ikke ved et uheld.'),
    advice: 'soon',
    adviceText: msg('Bilen kan køre, men sikkerheden er nedsat. Få fejlen læst hurtigt.'),
    costMin: 400,
    costMax: 5000,
    job: 'fejlkode',
  },
  {
    id: 'motor',
    name: msg('Motorlampe (check engine)'),
    icon: 'engine',
    color: 'yellow',
    meaning: msg('Motorstyringen har set en fejl. Det kan være alt fra en løs tankdæksel til en defekt sensor.'),
    advice: 'soon',
    adviceText: msg(
      'Lyser den fast, kan du køre videre og få fejlkoden læst. Blinker den, så stop: det kan ødelægge katalysatoren.',
    ),
    costMin: 400,
    costMax: 6000,
    job: 'fejlkode',
  },
  {
    id: 'abs',
    name: msg('ABS'),
    icon: 'abs',
    color: 'yellow',
    meaning: msg('ABS-systemet er slået fra. Bremserne virker, men hjulene kan blokere ved hård opbremsning.'),
    advice: 'soon',
    adviceText: msg('Kør med god afstand, og få det tjekket. Ofte er det en hjulsensor.'),
    costMin: 800,
    costMax: 3500,
    job: 'fejlkode',
  },
  {
    id: 'daektryk',
    name: msg('Dæktryk'),
    icon: 'tire',
    color: 'yellow',
    meaning: msg('Et eller flere dæk har for lidt luft, eller en sensor er defekt.'),
    advice: 'ok',
    adviceText: msg('Tjek trykket på en tankstation. Taber dækket luft igen, er der en punktering.'),
    costMin: 0,
    costMax: 600,
    job: 'hjulskift',
  },
  {
    id: 'partikelfilter',
    name: msg('Partikelfilter (diesel)'),
    icon: 'smoke',
    color: 'yellow',
    meaning: msg('Filteret er ved at være fyldt. Mange korte ture forhindrer det i at rense sig selv.'),
    advice: 'ok',
    adviceText: msg(
      'Kør 20–30 minutter på motorvej, så filteret brænder rent. Går lampen ikke ud, skal værkstedet rense det.',
    ),
    costMin: 1500,
    costMax: 15000,
    job: 'fejlkode',
  },
  {
    id: 'gloederoer',
    name: msg('Gløderør (diesel)'),
    icon: 'bolt',
    color: 'yellow',
    meaning: msg('Lyser den efter start, er der fejl i gløderørene. Bilen kan være svær at starte i kulde.'),
    advice: 'ok',
    adviceText: msg('Ikke farligt, men få det ordnet inden vinteren.'),
    costMin: 1500,
    costMax: 4000,
    job: 'fejlkode',
  },
  {
    id: 'servo',
    name: msg('Servostyring'),
    icon: 'steering',
    color: 'yellow',
    meaning: msg('Styringen har mistet servohjælpen. Rattet bliver tungt, især ved lav fart.'),
    advice: 'soon',
    adviceText: msg('Du kan køre, men parkering bliver hårdt arbejde. Få det tjekket inden længe.'),
    costMin: 1000,
    costMax: 8000,
    job: 'fejlkode',
  },
  {
    id: 'adblue',
    name: msg('AdBlue (diesel)'),
    icon: 'drop',
    color: 'yellow',
    meaning: msg('AdBlue-tanken er ved at være tom. Er den helt tom, kan bilen ikke starte.'),
    advice: 'ok',
    adviceText: msg('Fyld AdBlue på fra en dunk eller på tanken. Det kan du selv.'),
    costMin: 100,
    costMax: 400,
  },
  {
    id: 'braendstof',
    name: msg('Brændstof'),
    icon: 'fuel',
    color: 'yellow',
    meaning: msg('Du har typisk 50–80 km tilbage.'),
    advice: 'ok',
    adviceText: msg('Tank snart. Kører du tør på en dieselbil, kan den skulle udluftes på værkstedet.'),
    costMin: 0,
    costMax: 0,
  },
];
