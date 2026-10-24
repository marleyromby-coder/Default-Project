import { APP_INFO } from '@/constants/app-info';
import { getLanguage } from '@/i18n';
import { CLOSE_MARGIN, WORKSHOP_RADIUS_KM } from '@/lib/matcher';
import { DISTANCE_SCALE_KM, NO_REVIEWS_SCORE, REVIEW_PRIOR_COUNT, REVIEW_PRIOR_MEAN } from '@/lib/ranking';

import { INFO_PAGES_EN } from './content-en';

export interface InfoSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface InfoLink {
  label: string;
  url: string;
}

export interface InfoPage {
  title: string;
  intro: string;
  sections: InfoSection[];
  links?: InfoLink[];
}

const n = (value: number) => String(value).replace('.', ',');

/** Danish pages. The English ones in content-en.ts have the same slugs and structure. */
export const INFO_PAGES_DA = {
  rangering: {
    title: 'Sådan rangerer vi',
    intro:
      'Rækkefølgen bestemmes af FixMatch-scoren, som du selv kan påvirke. Ingen virksomhed kan betale sig til en bedre placering.',
    sections: [
      {
        heading: 'De tre parametre',
        bullets: [
          'Pris: virksomhedens timepris sammenlignet med de andre virksomheder i samme fag og samme land. Den billigste får fuld score, den dyreste ingen. Priser sammenlignes aldrig på tværs af lande og valutaer.',
          `Afstand: afstanden i luftlinje fra din placering. Scoren falder jævnt med afstanden – ved ${DISTANCE_SCALE_KM} km er den ca. en tredjedel af scoren ved 0 km.`,
          `Anmeldelser: TrustScore på Trustpilot, vægtet efter antallet af anmeldelser. Vi lægger ${REVIEW_PRIOR_COUNT} "neutrale" anmeldelser på ${n(REVIEW_PRIOR_MEAN)} til, så få anmeldelser ikke giver en urimelig høj eller lav score. Virksomheder uden Trustpilot-profil regnes som ${n(NO_REVIEWS_SCORE)}.`,
        ],
      },
      {
        heading: 'Din vægtning',
        paragraphs: [
          'Under "Dine prioriteter" vælger du, hvor vigtig hver parameter er. Vægtene lægges sammen til 100 %, og scoren er det vægtede gennemsnit gange 100. Du kan også sortere efter pris, afstand eller anmeldelser alene.',
        ],
      },
      {
        heading: 'Når du beskriver dit problem',
        paragraphs: [
          `Under "Beskriv dit problem" finder appen faget og opgaven ud fra dine ord. Virksomhedernes egen pris for opgaven (gange antal m² eller stk.) sammenlignes med dit budget, og de deles i fire grupper i denne rækkefølge: "Inden for budget" og "Kan passe", "Tæt på budget" (højst ${Math.round(CLOSE_MARGIN * 100)} % over), "Pris på forespørgsel" (virksomheden har ikke oplyst en pris for opgaven) og "Over budget". Inden for hver gruppe afgør FixMatch-scoren rækkefølgen. Haster det, kommer virksomheder med døgnvagt først.`,
          `Vi viser kun virksomheder, der kører ud til din adresse (inden for deres eget område). Mekanikere vises inden for ${WORKSHOP_RADIUS_KM} km, fordi du selv kører derhen. Din beskrivelse bliver på telefonen og sendes ikke til FixMatch eller virksomhederne.`,
        ],
      },
      {
        heading: 'Annoncer',
        paragraphs: [
          'Virksomheder kan købe en fremhævet plads på forsiden. Den er altid markeret "Annonce" og vises adskilt fra resultaterne. Betaling påvirker aldrig FixMatch-scoren eller rækkefølgen i søgeresultaterne.',
        ],
      },
      {
        heading: 'Filtre',
        paragraphs: [
          'Filtre som afstand, åbningstid, døgnvagt og autorisation skjuler virksomheder, men ændrer ikke deres score.',
        ],
      },
    ],
  },
  anmeldelser: {
    title: 'Om anmeldelser',
    intro:
      'Anmeldelserne i FixMatch kommer fra Trustpilot. Vi skriver, ændrer og sorterer ikke i anmeldelser – vi viser virksomhedens samlede TrustScore og antallet af anmeldelser.',
    sections: [
      {
        heading: 'Kontrollerer FixMatch anmeldelserne?',
        paragraphs: [
          'Nej. FixMatch kontrollerer ikke selv, om anmeldelserne stammer fra kunder, der faktisk har brugt virksomheden. Trustpilot beskriver selv, hvordan de opdager og fjerner falske anmeldelser.',
        ],
      },
      {
        heading: 'Hvor gamle er tallene?',
        paragraphs: [
          'Ved hver virksomhed står det, hvornår TrustScoren sidst blev opdateret. Tryk på "Se anmeldelser på Trustpilot" for at læse de enkelte anmeldelser.',
        ],
      },
      {
        heading: 'Hvad betyder TrustScore?',
        paragraphs: [
          'TrustScore er Trustpilots samlede vurdering fra 1 til 5. Den tager blandt andet højde for, hvor nye anmeldelserne er. Den kan derfor afvige fra et simpelt gennemsnit af stjernerne.',
        ],
      },
    ],
    links: [{ label: 'Sådan arbejder Trustpilot med anmeldelser', url: 'https://corporate.trustpilot.com/trust' }],
  },
  priser: {
    title: 'Om priserne',
    intro:
      'Alle priser er oplyst af virksomhederne selv. I Europa er de inklusive moms, i USA før salgsskat. De er vejledende – den endelige pris aftaler du med virksomheden.',
    sections: [
      {
        heading: 'Timepris og eksempler',
        paragraphs: [
          'Timeprisen er det interval, virksomheden typisk tager. Nogle har også et fast gebyr for kørsel eller opstart, som står ved timeprisen. Eksempelpriserne er typiske priser for almindelige opgaver; materialer kan komme oveni.',
        ],
      },
      {
        heading: 'Gode råd',
        bullets: [
          'Bed altid om et skriftligt tilbud eller overslag, før arbejdet går i gang.',
          'Aftal hvad der sker, hvis opgaven bliver større end forventet.',
          'Gem fakturaen – den skal vise timepris, timer og materialer.',
        ],
      },
      {
        heading: 'Håndværker- og servicefradrag 2026 (Danmark)',
        paragraphs: [
          'Du kan trække arbejdslønnen (ikke materialer) fra i skat for en række opgaver i dit hjem. I 2026 er grænsen 9.000 kr. pr. person for grøn istandsættelse (håndværkerfradrag) og 18.300 kr. pr. person for servicefradrag. Fradraget er ca. 26 % værd. Tjek på skat.dk, om netop din opgave er omfattet.',
        ],
      },
    ],
    links: [{ label: 'Håndværkerfradrag på skat.dk', url: 'https://skat.dk' }],
  },
  virksomheder: {
    title: 'For virksomheder',
    intro:
      'FixMatch viser kun virksomheder, der selv har sagt ja. Det er gratis at være med, og du bestemmer over dine oplysninger.',
    sections: [
      {
        heading: 'Sådan kommer du med',
        bullets: [
          'Vi kontakter dig eller du skriver til os.',
          'Du godkender dine oplysninger: kontakt, priser, åbningstider, billeder og din Trustpilot-profil.',
          'Du underskriver et samtykke, som du til enhver tid kan trække tilbage.',
        ],
      },
      {
        heading: 'Det lover vi',
        bullets: [
          'Ingen betaler sig til en bedre placering i søgeresultaterne.',
          'Ingen gebyrer pr. kunde eller pr. opkald – kunderne ringer direkte til dig.',
          'Vi retter eller fjerner dine oplysninger inden for 2 hverdage, når du beder om det.',
        ],
      },
      {
        heading: 'Kontakt',
        paragraphs: [`Skriv til ${APP_INFO.email}, hvis du vil med, eller hvis noget skal rettes.`],
      },
    ],
  },
  hjaelp: {
    title: 'Hvis noget går galt',
    intro:
      'De fleste opgaver går godt. Hvis du er utilfreds, så klag først skriftligt til virksomheden og giv den mulighed for at rette fejlen.',
    sections: [
      {
        heading: 'Klagenævn',
        bullets: [
          'Hvilket nævn der kan tage sagen, afhænger af opgaven og af virksomhedens medlemskab – se forbrug.dk.',
          'Byggeriets Ankenævn – klager over byggearbejde.',
          'Håndværkets Ankenævn – klager over håndværksarbejde.',
          'Ankenævnet for Tekniske Installationer – klager over el, VVS og andre installationer.',
          'Ankenævnet for biler (bilklage.dk) – reparation af privatbiler, når regningen er over 3.000 kr.',
          'Forbrug.dk – overblik over dine rettigheder og andre klagemuligheder.',
        ],
      },
      {
        heading: 'Fejl i FixMatch',
        paragraphs: [
          'Er en oplysning forkert eller ulovlig? Tryk på "Rapportér fejl" nederst på virksomhedens side, eller skriv til os. Vi svarer inden for 2 hverdage.',
        ],
      },
    ],
    links: [
      { label: 'Forbrug.dk – klage over håndværker', url: 'https://forbrug.dk' },
      { label: 'Ankenævnet for biler', url: 'https://bilklage.dk' },
    ],
  },
  privatliv: {
    title: 'Privatlivspolitik',
    intro: `Kort fortalt: FixMatch har ingen login, ingen reklamesporing og sender ikke dine oplysninger nogen steder hen. Dataansvarlig: ${APP_INFO.company}, ${APP_INFO.email}.`,
    sections: [
      {
        heading: 'Din placering',
        paragraphs: [
          'Hvis du giver lov, bruger appen din placering, mens den er åben, til at beregne afstanden til virksomhederne. Beregningen sker på din telefon, og placeringen gemmes kun på telefonen. Du kan i stedet vælge en by manuelt.',
        ],
      },
      {
        heading: 'Kortet og "Beskriv dit problem"',
        paragraphs: [
          'Kortet er Apple Kort. For at vise det henter din iPhone kortbilleder direkte fra Apple efter Apples privatlivspolitik. Det, du skriver under "Beskriv dit problem", behandles kun på telefonen og sendes ikke til FixMatch eller virksomhederne.',
        ],
      },
      {
        heading: 'Gemt på din telefon',
        paragraphs: [
          'Dine gemte virksomheder, din valgte by og dine prioriteter gemmes lokalt på telefonen, så de er der næste gang. Du kan slette det hele under Mere → Nulstil app-data, eller ved at slette appen.',
        ],
      },
      {
        heading: 'Når du kontakter en virksomhed',
        paragraphs: [
          'Når du ringer eller åbner en hjemmeside, foregår det uden om FixMatch, og virksomhedens egen privatlivspolitik gælder. Billeder hentes fra Pexels’ servere, som derfor kan se din IP-adresse.',
        ],
      },
      {
        heading: 'Oplysninger om virksomheder',
        paragraphs: [
          'Oplysninger om virksomheder og deres kontaktpersoner viser vi på grundlag af virksomhedens samtykke. Samtykket kan til enhver tid trækkes tilbage, og så fjerner vi oplysningerne.',
        ],
      },
      {
        heading: 'Dine rettigheder',
        paragraphs: [
          `Du kan altid kontakte os på ${APP_INFO.email}. Du kan også klage til Datatilsynet (datatilsynet.dk).`,
        ],
      },
    ],
    links: [{ label: 'Fuld privatlivspolitik', url: APP_INFO.privacyUrl }],
  },
  vilkaar: {
    title: 'Vilkår for brug',
    intro:
      'FixMatch hjælper dig med at finde og sammenligne virksomheder. Aftalen om arbejdet indgår du direkte med virksomheden – FixMatch er ikke part i den.',
    sections: [
      {
        bullets: [
          'Appen er gratis og kræver ikke login.',
          'Priser, åbningstider og andre oplysninger er oplyst af virksomhederne. Vi gør os umage for, at de er korrekte, men kan ikke garantere det.',
          'TrustScores kommer fra Trustpilot og opdateres løbende.',
          'Rapportér fejl eller ulovligt indhold via "Rapportér fejl", så ser vi på det hurtigst muligt.',
          'Dansk ret gælder.',
        ],
      },
    ],
    links: [{ label: 'Fulde vilkår', url: APP_INFO.termsUrl }],
  },
  om: {
    title: 'Om FixMatch',
    intro:
      'FixMatch gør det nemt at finde den rette håndværker eller mekaniker. Vi samler pris, afstand og anmeldelser ét sted, så du sparer både tid og penge.',
    sections: [
      {
        heading: 'Hvorfor FixMatch?',
        bullets: [
          'Prisintervaller inkl. moms fra start – ikke først efter tre tilbud.',
          'Trustpilot-score, CVR og autorisation samlet på én side.',
          'Ring direkte. Ingen mellemled, ingen gebyrer.',
          'Du bestemmer selv, hvad der vægter mest.',
        ],
      },
      {
        heading: 'Fotos og data',
        paragraphs: [
          'Fotos fra Pexels (pexels.com), brugt under Pexels-licensen. Tak til fotograferne.',
          'Bynavne fra GeoNames (geonames.org, CC BY 4.0). Kystlinjer på webkortet fra Natural Earth (public domain).',
        ],
      },
    ],
    links: [
      { label: 'Pexels-licensen', url: 'https://www.pexels.com/license/' },
      { label: 'GeoNames', url: 'https://www.geonames.org' },
      { label: 'FixMatch på nettet', url: APP_INFO.website },
    ],
  },
} satisfies Record<string, InfoPage>;

export type InfoSlug = keyof typeof INFO_PAGES_DA;

/** The pages in the app's language. */
export const INFO_PAGES: Record<InfoSlug, InfoPage> = getLanguage() === 'da' ? INFO_PAGES_DA : INFO_PAGES_EN;

export function isInfoSlug(value: string): value is InfoSlug {
  return value in INFO_PAGES;
}
