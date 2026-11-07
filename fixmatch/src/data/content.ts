import { APP_INFO } from '@/constants/app-info';
import { getLanguage } from '@/i18n';
import { TRUSTPILOT_ENABLED } from '@/lib/features';
import { CLOSE_MARGIN, WORKSHOP_RADIUS_KM } from '@/lib/matcher';
import { MIN_PAID_PRICES } from '@/lib/prices';
import { DISTANCE_SCALE_KM, NO_REVIEWS_SCORE, REVIEW_PRIOR_COUNT, REVIEW_PRIOR_MEAN } from '@/lib/ranking';
import { TOP_RATED_MIN_REVIEWS, TOP_RATED_MIN_SCORE, VERIFICATION_VALID_DAYS } from '@/lib/verification';

import { infoPagesEn } from './content-en';

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

/**
 * Danish pages. The English ones in content-en.ts have the same slugs and structure.
 * Without Trustpilot (`reviews` false) the pages do not mention reviews.
 */
export function infoPagesDa(reviews = TRUSTPILOT_ENABLED) {
  return {
    rangering: {
      title: 'Sådan rangerer vi',
      intro:
        'Rækkefølgen bestemmes af FixMatch-scoren, som du selv kan påvirke. Ingen virksomhed kan betale sig til en bedre placering.',
      sections: [
        {
          heading: reviews ? 'De tre parametre' : 'De to parametre',
          bullets: [
            'Pris: virksomhedens timepris sammenlignet med de andre virksomheder i samme fag og samme land. Den billigste får fuld score, den dyreste ingen. Priser sammenlignes aldrig på tværs af lande og valutaer.',
            `Afstand: afstanden i luftlinje fra din placering. Scoren falder jævnt med afstanden – ved ${DISTANCE_SCALE_KM} km er den ca. en tredjedel af scoren ved 0 km.`,
            ...(reviews
              ? [
                  `Anmeldelser: TrustScore på Trustpilot, vægtet efter antallet af anmeldelser. Vi lægger ${REVIEW_PRIOR_COUNT} "neutrale" anmeldelser på ${n(REVIEW_PRIOR_MEAN)} til, så få anmeldelser ikke giver en urimelig høj eller lav score. Virksomheder uden Trustpilot-profil regnes som ${n(NO_REVIEWS_SCORE)}.`,
                ]
              : []),
          ],
        },
        {
          heading: 'Din vægtning',
          paragraphs: [
            `Under "Dine prioriteter" vælger du, hvor vigtig hver parameter er. Vægtene lægges sammen til 100 %, og scoren er det vægtede gennemsnit gange 100. Du kan også sortere efter ${reviews ? 'pris, afstand eller anmeldelser' : 'pris eller afstand'} alene.`,
          ],
        },
        {
          heading: 'Når du beskriver dit problem',
          paragraphs: [
            `Under "Beskriv dit problem" finder appen faget og opgaven ud fra dine ord. Virksomhedernes egen pris for opgaven (gange antal m² eller stk.) sammenlignes med dit budget, og de deles i fire grupper i denne rækkefølge: "Inden for budget" og "Kan passe", "Tæt på budget" (højst ${Math.round(CLOSE_MARGIN * 100)} % over), "Pris på forespørgsel" (virksomheden har ikke oplyst en pris for opgaven) og "Over budget". Inden for hver gruppe afgør FixMatch-scoren rækkefølgen. Haster det, kommer virksomheder med døgnvagt først og derefter dem, der selv har meldt ledig tid i dag.`,
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
            'Filtre som afstand, åbningstid, døgnvagt, autorisation og Verificeret skjuler virksomheder, men ændrer ikke deres score. Verificeret-mærket og anmeldelser skrevet i FixMatch giver heller ikke en bedre placering.',
          ],
        },
      ],
    },
    anmeldelser: {
      title: 'Om anmeldelser',
      intro:
        'Anmeldelserne under "Kundernes erfaringer" kommer kun fra kunder, der har kontaktet virksomheden gennem FixMatch. Ingen kan købe, skrive eller fjerne anmeldelser for en virksomhed.',
      sections: [
        {
          heading: 'Hvem kan anmelde?',
          paragraphs: [
            'Kun brugere, der har ringet eller skrevet til virksomheden gennem FixMatch. Hver bruger kan anmelde en virksomhed én gang og kan rette sin anmeldelse senere. Andre ser kun dit forbogstav, aldrig dit navn.',
          ],
        },
        {
          heading: 'Kontrollerer FixMatch anmeldelserne?',
          paragraphs: [
            'Ja, delvist. Vi tjekker, at du har kontaktet virksomheden gennem FixMatch, før du kan anmelde den. Vi kan ikke se, om opgaven blev udført, eller hvad I aftalte. Vi viser alle anmeldelser, også de dårlige, med de nyeste først, og vi ændrer aldrig i teksten.',
          ],
        },
        {
          heading: 'Hvornår skjuler vi en anmeldelse?',
          bullets: [
            'Den indeholder navne, telefonnumre eller andre personoplysninger.',
            'Den er krænkende eller truende, eller den handler ikke om virksomheden.',
            'Den er skrevet af virksomheden selv, dens ansatte eller en konkurrent.',
          ],
          paragraphs: [
            `Mener du, at en anmeldelse bryder reglerne, så tryk "Rapportér" ved anmeldelsen eller skriv til ${APP_INFO.email}. Virksomheden kan ikke selv fjerne anmeldelser.`,
          ],
        },
        {
          heading: 'Påvirker anmeldelserne rækkefølgen?',
          paragraphs: [
            reviews
              ? 'Nej. Anmeldelser skrevet i FixMatch påvirker ikke FixMatch-scoren eller rækkefølgen. Scoren bruger kun TrustScoren fra Trustpilot (se "Sådan rangerer vi").'
              : 'Nej. Anmeldelser skrevet i FixMatch påvirker ikke FixMatch-scoren eller rækkefølgen. De står på virksomhedens side, så du selv kan læse dem.',
          ],
        },
        ...(reviews
          ? [
              {
                heading: 'Anmeldelser fra Trustpilot',
                paragraphs: [
                  'TrustScoren kommer fra Trustpilot. Vi viser den samlede TrustScore og antallet af anmeldelser, men skriver, ændrer og sorterer ikke i dem. FixMatch kontrollerer ikke selv, om Trustpilot-anmeldelserne stammer fra rigtige kunder; Trustpilot beskriver selv, hvordan de opdager og fjerner falske anmeldelser.',
                  'Ved hver virksomhed står det, hvornår TrustScoren sidst blev opdateret. TrustScoren er Trustpilots samlede vurdering fra 1 til 5 og vægter blandt andet nye anmeldelser højere, så den kan afvige fra et simpelt gennemsnit.',
                ],
              },
            ]
          : []),
      ],
      links: reviews
        ? [{ label: 'Sådan arbejder Trustpilot med anmeldelser', url: 'https://corporate.trustpilot.com/trust' }]
        : [],
    },
    priser: {
      title: 'Om priserne',
      intro:
        'Timepriser og eksempelpriser er oplyst af virksomhederne selv. "Det har kunder betalt" kommer fra kunder. Alle priser er inklusive moms og vejledende – den endelige pris aftaler du med virksomheden.',
      sections: [
        {
          heading: 'Timepris og eksempler',
          paragraphs: [
            'Timeprisen er det interval, virksomheden typisk tager. Nogle har også et fast gebyr for kørsel eller opstart, som står ved timeprisen. Eksempelpriserne er typiske priser for almindelige opgaver; materialer kan komme oveni.',
          ],
        },
        {
          heading: 'Det har kunder betalt',
          paragraphs: [
            `Har du kontaktet en virksomhed gennem FixMatch, kan du dele, hvad opgaven kostede. Når mindst ${MIN_PAID_PRICES} har delt en pris for samme opgave, viser vi intervallet for de midterste 60 % – vi ser bort fra de 20 % billigste og de 20 % dyreste, så enkelte ekstreme priser ikke trækker skævt. Vi bruger priser fra de seneste 24 måneder, og Tilbudstjek sammenligner også med dem.`,
            'Vi viser aldrig, hvem der har delt en pris, og kun de to første cifre i postnummeret.',
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
            'Tilmeld din virksomhed under Mere → Tilmeld din virksomhed eller på hjemmesiden. Det tager et par minutter.',
            reviews
              ? 'Du godkender dine oplysninger: kontakt, priser, åbningstider, billeder og din Trustpilot-profil.'
              : 'Du godkender dine oplysninger: kontakt, priser, åbningstider og billeder.',
            'Du giver samtykke, når du tilmelder dig, og kan til enhver tid trække det tilbage.',
            'Vil du have Verificeret-mærket, sætter du flueben ved det i tilmeldingen i appen eller på hjemmesiden. Det er gratis.',
            'Når en kunde ringer til dig gennem FixMatch, kan du se kundens navn og telefonnummer.',
            `Har du tid i dag eller i morgen, så tryk "Ledig i dag" på dit personlige link (${APP_INFO.website}/ledig/). Så står du under "Hvem har tid i dag?", og kunder, hvor det haster, ser dig først. Det forsvinder af sig selv ved midnat. Linket får du fra os.`,
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
    verificering: {
      title: 'Sådan verificerer vi',
      intro:
        'Verificeret betyder, at FixMatch selv har tjekket, hvem virksomheden er – lidt som et blåt flueben, bare for håndværkere. Det er gratis, kriterierne er de samme for alle, og mærket giver ikke en bedre placering.',
      sections: [
        {
          heading: 'Det tjekker vi',
          bullets: [
            'CVR: at CVR-nummeret er aktivt i CVR-registret og hører til virksomheden.',
            'Ejeren: at den, der har tilmeldt virksomheden, er ejer eller må handle på dens vegne.',
            'Autorisation: for el, VVS og kloak slår vi autorisationen op hos Sikkerhedsstyrelsen. Uden den får virksomheden ikke mærket.',
            'Forsikring og garantiordning: står de på listen ved virksomheden, har den vist os forsikringen eller medlemskabet.',
          ],
        },
        {
          heading: 'Hvor længe gælder det?',
          paragraphs: [
            `Mærket gælder ${VERIFICATION_VALID_DAYS} dage fra den dag, vi tjekkede. Så tjekker vi igen. På virksomhedens side står datoen og alt det, vi har tjekket.`,
          ],
        },
        ...(reviews
          ? [
              {
                heading: 'Topbedømt',
                paragraphs: [
                  `Topbedømt får verificerede virksomheder med en TrustScore på mindst ${n(TOP_RATED_MIN_SCORE)} og mindst ${TOP_RATED_MIN_REVIEWS} anmeldelser på Trustpilot.`,
                ],
              },
            ]
          : []),
        {
          heading: 'Det betyder mærket ikke',
          paragraphs: [
            'Verificeret er ikke en garanti for kvaliteten af arbejdet. Bed stadig om et skriftligt tilbud, og tjek prisen med Tilbudstjek.',
          ],
        },
        {
          heading: 'Er du en virksomhed?',
          paragraphs: [
            `Sæt flueben ved "Ja tak, verificér os", når du tilmelder virksomheden i appen (Mere → Tilmeld din virksomhed) eller på hjemmesiden, eller skriv til ${APP_INFO.email}. Det er gratis.`,
          ],
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
            'Er en oplysning forkert eller ulovlig? Tryk på "Rapportér fejl eller ulovligt indhold" nederst på virksomhedens side, eller skriv til os. Vi svarer inden for 2 hverdage.',
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
      intro: `Kort fortalt: FixMatch har ingen reklamer og ingen sporing. Opretter du en bruger, gemmer vi dit navn, dit telefonnummer og din e-mail i EU, så de virksomheder, du ringer til, ved, hvem de taler med. Alt andet bliver på din telefon. Dataansvarlig: ${APP_INFO.company}, ${APP_INFO.email}.`,
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
            'Billeder af problemet bliver på telefonen og glemmes, når appen lukkes. Sender du dem til en virksomhed, sker det som en besked fra din egen telefon. FixMatch får dem aldrig.',
          ],
        },
        {
          heading: 'Gemt på din telefon',
          paragraphs: [
            'Dine gemte virksomheder, din valgte by, dine prioriteter og listen over virksomheder, du har kontaktet (under Profil), gemmes lokalt på telefonen, så de er der næste gang. Du kan slette det hele under Mere → Nulstil app-data, eller ved at slette appen.',
          ],
        },
        {
          heading: 'Din bruger',
          paragraphs: [
            'Du kan se og sammenligne uden en bruger. Første gang du ringer til en virksomhed, beder vi dig oprette en. Vi gemmer din e-mail (eller dit Apple-id), dit navn, dit telefonnummer og hvilke virksomheder du har ringet til og hvornår – hos Supabase på servere i EU (Frankfurt).',
            'Kun den virksomhed, du ringer til, ser dit navn og nummer. Vi sælger dem aldrig. Du sletter det hele under Profil → Slet bruger.',
          ],
        },
        {
          heading: 'Anmeldelser og priser, du deler',
          paragraphs: [
            'Anmelder du en virksomhed eller deler, hvad du betalte, gemmer vi det sammen med din bruger hos Supabase i EU, så vi kan tjekke, at du har kontaktet virksomheden. Andre ser kun dit forbogstav ved anmeldelser, og priser vises kun samlet, når mindst 3 har delt. Det slettes, når du sletter din bruger.',
          ],
        },
        {
          heading: 'Når du kontakter en virksomhed',
          paragraphs: [
            'Selve opkaldet og hjemmesider foregår uden om FixMatch, og virksomhedens egen privatlivspolitik gælder. Har en virksomhed sit eget billede på FixMatch, hentes det fra internettet, og serveren kan se din IP-adresse.',
          ],
        },
        {
          heading: 'Oplysninger om virksomheder',
          paragraphs: [
            'Oplysninger om virksomheder og deres kontaktpersoner viser vi på grundlag af virksomhedens samtykke. Samtykket kan til enhver tid trækkes tilbage, og så fjerner vi oplysningerne.',
            'Beder en virksomhed om Verificeret-mærket, gemmer vi også autorisationsnummer, forsikring og garantiordning, og hvad vi har tjekket og hvornår, så længe mærket gælder.',
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
            ...(reviews ? ['TrustScores kommer fra Trustpilot og opdateres løbende.'] : []),
            'Rapportér fejl eller ulovligt indhold nederst på virksomhedens side, så ser vi på det hurtigst muligt.',
            'Dansk ret gælder.',
          ],
        },
      ],
      links: [{ label: 'Fulde vilkår', url: APP_INFO.termsUrl }],
    },
    om: {
      title: 'Om FixMatch',
      intro: `FixMatch gør det nemt at finde den rette håndværker eller mekaniker. Vi samler ${reviews ? 'pris, afstand og anmeldelser' : 'pris, afstand og autorisation'} ét sted, så du sparer både tid og penge.`,
      sections: [
        {
          heading: 'Hvorfor FixMatch?',
          bullets: [
            'Prisintervaller inkl. moms fra start – ikke først efter tre tilbud.',
            'Tilbudstjek fortæller, om et tilbud, du har fået, er lavt, normalt eller højt.',
            'Verificeret-mærket viser, hvilke virksomheder FixMatch selv har tjekket.',
            reviews
              ? 'Trustpilot-score, CVR og autorisation samlet på én side.'
              : 'CVR og autorisation samlet på én side.',
            'Ring direkte. Ingen mellemled, ingen gebyrer.',
            'Du bestemmer selv, hvad der vægter mest.',
          ],
        },
        {
          heading: 'Data og skrift',
          paragraphs: [
            'Bynavne fra GeoNames (geonames.org, CC BY 4.0). Kystlinjer på webkortet fra Natural Earth (public domain).',
            'Overskrifterne er sat i Fraunces af Undercase Type (SIL Open Font License 1.1).',
          ],
        },
      ],
      links: [
        { label: 'GeoNames', url: 'https://www.geonames.org' },
        { label: 'FixMatch på nettet', url: APP_INFO.website },
      ],
    },
  } satisfies Record<string, InfoPage>;
}

export type InfoSlug = keyof ReturnType<typeof infoPagesDa>;

/** The pages in the app's language. */
export const INFO_PAGES: Record<InfoSlug, InfoPage> = getLanguage() === 'da' ? infoPagesDa() : infoPagesEn();

/** A page that can be opened. */
export function isInfoSlug(value: string): value is InfoSlug {
  return value in INFO_PAGES;
}
