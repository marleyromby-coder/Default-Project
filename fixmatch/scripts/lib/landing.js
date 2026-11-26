/**
 * The front page of the website (fixmatchh.netlify.app/ and /en/): what FixMatch does, with
 * screenshots from the app (website/images/app-*.webp), and live numbers from the same
 * Supabase project as the app. The numbers only show once there is something to show.
 */
const { readGroupDiscount, readJobPrices, readJobs, readNumber } = require('./app-data');
const fs = require('node:fs');
const path = require('node:path');

const { readSupabase } = require('./signup-form');
const { MAP_STYLE, siteMap } = require('./site-map');
const { tradeArt } = require('./trade-art');

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Small line icons in the app's style (24×24, 2px stroke). */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  siren:
    '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21h14v-3H5z"/><path d="M12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  coins: '<circle cx="9" cy="9" r="6"/><path d="M15.5 9.5A6 6 0 1 1 9.5 15.5"/>',
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  car: '<path d="M5 17h14v-5l-2-5H7l-2 5z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7M17 12H7"/>',
  map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  widget:
    '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  euro: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v8M8 12h8"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  cross: '<path d="M6 6l12 12M18 6 6 18"/>',
  people:
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 14.5c3 0 6 1.8 6 5.5"/>',
};

const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

function text(lang, { minGroup, discount }) {
  const da = {
    title: 'Se prisen, før du ringer',
    description:
      'Se håndværkernes og værkstedernes egne priser, før du ringer. Sammenlign på pris, afstand og anmeldelser, og ring direkte. Gratis iPhone-app.',
    eyebrow: 'Gratis iPhone-app · Først i Danmark',
    h1: ['Se prisen,', 'før du ringer.'],
    lead: 'FixMatch viser håndværkernes og værkstedernes egne priser, før du tager telefonen. Sammenlign på pris, afstand og anmeldelser fra brugere via FixMatch, tjek om dit tilbud er fair, og ring direkte. Ingen mellemled, og rækkefølgen kan ikke købes.',
    heroAlt: 'Forsiden i appen: søgefelt, knappen Sammenlign priser og fagene med fra-priser',
    chips: ['Bedste match', 'Billigst', 'Verificeret'],
    valuesLabel: 'Det får du',
    values: [
      ['coins', 'Pris først', 'Timepris og typiske priser står fremme, før du ringer.'],
      ['shield', 'Fair tilbud', 'Tilbudstjek siger, om dit tilbud er lavt, normalt eller højt.'],
      ['phone', 'Direkte kontakt', 'Du ringer selv til firmaet. Ingen gebyrer og ingen mellemled.'],
    ],
    guide: {
      kicker: 'Prisguide',
      title: 'Hvad koster det typisk?',
      lead: 'Vælg et fag, og se det typiske prisniveau for almindelige opgaver. I appen ser du også, hvad de enkelte firmaer tager.',
      pick: 'Vælg fag',
      typical: 'Typiske priser:',
      note: 'Vejledende priser inkl. moms. Den endelige pris aftaler du med virksomheden.',
    },
    story: {
      kicker: 'Sådan virker det',
      title: 'Tre tryk fra problem til opkald',
      alts: [
        'Forsiden i appen med søgefelt og de otte fag',
        "Listen over VVS'ere i appen med fra-pris, afstand og anmeldelser",
        'En virksomheds side i appen med priser, Verificeret-mærke og knappen Ring',
      ],
    },
    gallery: {
      kicker: 'Otte fag i én app',
      title: 'Fra dryppende vandhane til nyt tag',
      typical: 'typisk',
      credit: 'Fotos: Pexels. Personerne på billederne er ikke tilknyttet FixMatch.',
      label: 'Se typiske priser: {trade}',
    },
    cta: {
      title: ['Se prisen,', 'før du ringer.'],
      lead: 'FixMatch kommer snart til iPhone. Har du en virksomhed, kan du være med fra starten.',
    },
    compare: {
      kicker: 'Derfor FixMatch',
      title: 'Fra at ringe rundt til at vælge selv',
      before: 'I dag',
      after: 'Med FixMatch',
      rows: [
        ['Du ringer rundt for at få en pris.', 'Du ser firmaernes egne priser, før du ringer.'],
        ['Du ved ikke, om tilbuddet er fair.', 'Tilbudstjek siger, om prisen er lav, normal eller høj.'],
        ['Du udfylder en formular og venter på at blive ringet op.', 'Du vælger selv og ringer direkte til firmaet.'],
        [
          'Du kan ikke se, om nogen har betalt for at stå øverst.',
          'Rækkefølgen kan ikke købes, og annoncer er altid mærket.',
        ],
        [
          'Anmeldelser kan komme fra hvem som helst.',
          'Kun brugere, der har kontaktet firmaet gennem FixMatch, kan anmelde.',
        ],
      ],
    },
    soon: ['Kommer snart', 'til iPhone'],
    business: 'Har du en virksomhed?',
    liveTitle: 'Lige nu på FixMatch',
    live: {
      free: ['virksomhed har tid i dag', 'virksomheder har tid i dag'],
      groups: ['åben naborabat-gruppe', 'åbne naborabat-grupper'],
      prices: ['pris, som en bruger selv har delt', 'priser, som brugere selv har delt'],
      reviews: ['anmeldelse fra en bruger via FixMatch', 'anmeldelser fra brugere via FixMatch'],
    },
    featuresKicker: 'Det kan appen',
    featuresTitle: 'Alt, du skal bruge, før du ringer',
    caption: 'Billederne er fra appen. Virksomhederne på dem er fiktive eksempler.',
    features: [
      {
        image: 'kategori',
        alt: "Listen over VVS'ere i appen med timepris, afstand, match og verificeret-flueben",
        icon: 'search',
        title: 'Find og sammenlign',
        lead: 'Se timepris, typiske priser, afstand og anmeldelser, før du ringer. Du vælger selv, hvad der vejer mest.',
        points: [
          [
            'Beskriv dit problem',
            'Skriv med dine egne ord, hvad der er galt, og hvad du vil give. Appen finder faget og dem, der passer til dit budget.',
          ],
          ['Sammenlign op til tre', 'Side om side: pris, afstand, åbningstider og anmeldelser.'],
          ['Alle på ét kort', 'Se hvor virksomhederne holder til, og hvem der kører ud til dig.'],
        ],
      },
      {
        image: 'akut',
        alt: 'Akut hjælp i appen: de første fire skridt ved vandskade og de nærmeste med døgnvagt',
        icon: 'siren',
        title: 'Når det haster',
        lead: 'Vand løber ud, strømmen er gået, eller du er låst ude. Appen hjælper dig i de første minutter.',
        points: [
          [
            'Akut hjælp',
            'De første skridt, fx hvor du lukker for vandet, og ét tryk for at ringe til nærmeste døgnvagt.',
          ],
          [
            'Hvem har tid i dag?',
            'Virksomhederne melder selv, når de har tid i dag eller i morgen. De står først, når det haster.',
          ],
          ['Foto og video', 'Send billeder af problemet, eller vis det over FaceTime, før håndværkeren kører ud.'],
        ],
      },
      {
        image: 'virksomhed',
        alt: 'En virksomheds side i appen med Verificeret- og Demo-mærke, match, timepris, afstand, anmeldelser og prisniveau',
        icon: 'shield',
        title: 'Tryghed før du ringer',
        lead: 'Du skal kunne stole på dem, du lukker ind i dit hjem. Derfor viser appen det, der betyder noget.',
        points: [
          ['Verificeret', 'Fluebenet betyder, at FixMatch selv har tjekket CVR, ejer og autorisation.'],
          [
            'Anmeldelser fra brugere via FixMatch',
            'Kun brugere, der har kontaktet virksomheden gennem FixMatch, kan anmelde den – én gang hver.',
          ],
          ['Tryghedsside', 'Forsikring, garantiordning, svarprocent og hvor du kan klage, samlet ét sted.'],
        ],
      },
      {
        image: 'faelles',
        alt: 'Naborabat i appen: åbne grupper i nærheden og en kode fra naboen',
        icon: 'coins',
        title: 'Betal den rigtige pris',
        lead: 'Ved du, om tilbuddet er fair? Appen sammenligner med, hvad andre tager og betaler.',
        points: [
          [
            'Tilbudstjek',
            'Tag et billede af tilbuddet, kopiér teksten med iPhones tekstgenkendelse, og sæt den ind. Appen siger, om prisen er lav, normal eller høj.',
          ],
          [
            'Naborabat',
            `Gå sammen med naboerne om tagrender, fyrservice eller hjulskift. Er I mindst ${minGroup}, giver håndværkeren typisk ${discount.min}–${discount.max} % rabat.`,
          ],
          [
            'Del, hvad du betalte',
            'Se priser, som brugere i nærheden selv har delt for samme opgave, og hvad håndværkerfradraget giver.',
          ],
        ],
      },
    ],
    moreTitle: 'Og lidt mere',
    more: [
      ['home', 'Min bolig', 'Gem hvad der er lavet i huset, af hvem og hvornår, med kvitteringer og billeder.'],
      ['euro', 'Grøn guide', 'Se hvad fradrag og tilskud giver for varmepumpe, isolering og nye vinduer.'],
      ['car', 'Lampe i bilen?', 'Se hvad advarselslampen betyder, og om du kan køre videre.'],
      ['widget', 'Widgets', 'Dine gemte håndværkere og hurtig hjælp direkte på hjemmeskærmen.'],
    ],
    steps: [
      ['Fortæl, hvad der skal laves', 'Vælg et fag, eller beskriv problemet med dine egne ord.'],
      ['Sammenlign', 'Pris, afstand, anmeldelser og hvem der har tid. Gem dem, du kan lide.'],
      ['Ring direkte', 'Du taler med virksomheden selv. Ingen gebyrer og ingen mellemled.'],
    ],
    promisesTitle: 'Det lover vi',
    promises: [
      [
        'star',
        'Rækkefølgen kan ikke købes',
        'Den bygger på pris, afstand og anmeldelser fra brugere via FixMatch, og du vælger selv, hvad der vejer mest. Betalte annoncer er altid markeret "Annonce" og ændrer ikke rækkefølgen.',
      ],
      ['phone', 'Gratis for dig', 'Du betaler kun virksomheden for arbejdet. Prisen aftaler du direkte med dem.'],
      [
        'shield',
        'Dine data i EU',
        'Ingen reklamenetværk og ingen sporing. Alt ligger på servere i EU, og virksomheden ser kun dit navn og nummer, når du kontakter den.',
      ],
    ],
    businessKicker: 'For håndværkere og værksteder',
    businessTitle: 'Gratis at være med. Ingen gebyr pr. kunde.',
    businessPoints: [
      'Kunder i nærheden finder jer på pris, afstand og anmeldelser fra brugere via FixMatch og ringer direkte.',
      'Meld "Ledig i dag" med ét tryk, og stå først, når det haster.',
      'Bliv verificeret gratis, og få fluebenet ved navnet.',
      'Se jeres kontakter og ret jeres oplysninger under Min virksomhed i appen.',
    ],
    businessCta: 'Tilmeld virksomheden',
    availableCta: 'Har I tid i dag?',
    faqTitle: 'Spørgsmål og svar',
    faq: [
      [
        'Hvad koster FixMatch?',
        'Appen er gratis for dig, og det er gratis for virksomhederne at være med. Du betaler kun virksomheden for arbejdet.',
      ],
      ['Hvornår kan jeg hente appen?', 'FixMatch er i test nu og kommer snart til iPhone, først i Danmark.'],
      [
        'Hvordan bliver rækkefølgen bestemt?',
        'Efter pris, afstand og anmeldelser fra brugere via FixMatch – du vælger selv, hvad der vejer mest. En virksomhed uden anmeldelser tæller som 5 neutrale anmeldelser på 4,0. Når det haster, står dem med døgnvagt og ledig tid først. Rækkefølgen kan ikke købes.',
      ],
      [
        'Hvem kan skrive anmeldelser?',
        'Brugere, der har kontaktet virksomheden gennem FixMatch – én gang hver. Vi tjekker, at du har trykket Ring eller skrevet til virksomheden i FixMatch. Vi kan ikke se, om opkaldet blev besvaret, eller om opgaven blev udført.',
      ],
      [
        'Hvad sker der med mine oplysninger?',
        'De ligger i EU, og vi sælger dem ikke. Læs mere i [privatlivspolitikken](privatliv/).',
      ],
    ],
  };
  const en = {
    title: 'See the price before you call',
    description:
      'See what tradespeople and garages charge before you call. Compare on price, distance and reviews, and call them directly. A free iPhone app.',
    eyebrow: 'Free iPhone app · Launching in Denmark',
    h1: ['See the price', 'before you call.'],
    lead: 'FixMatch shows what tradespeople and garages charge before you pick up the phone. Compare on price, distance and reviews from FixMatch users, check whether your quote is fair, and call directly. No middleman, and the order cannot be bought.',
    heroAlt: 'The front page of the app: search, the Compare prices button and the trades with their from prices',
    chips: ['Best match', 'Cheapest', 'Verified'],
    valuesLabel: 'What you get',
    values: [
      ['coins', 'Price first', 'Hourly rates and typical prices are shown before you call.'],
      ['shield', 'A fair quote', 'Quote check tells you whether your quote is low, normal or high.'],
      ['phone', 'Direct contact', 'You call the business yourself. No fees and no middleman.'],
    ],
    guide: {
      kicker: 'Price guide',
      title: 'What does it usually cost?',
      lead: 'Choose a trade and see the typical price level for common jobs. In the app you also see what each business charges.',
      pick: 'Choose a trade',
      typical: 'Typical prices:',
      note: 'Guide prices in Denmark including VAT. You agree the final price with the business.',
    },
    story: {
      kicker: 'How it works',
      title: 'Three taps from problem to call',
      alts: [
        'The front page of the app with search and the eight trades',
        'The list of plumbers in the app with from price, distance and reviews',
        'A business page in the app with prices, the Verified badge and the Call button',
      ],
    },
    gallery: {
      kicker: 'Eight trades in one app',
      title: 'From a dripping tap to a new roof',
      typical: 'typically',
      credit: 'Photos: Pexels. The people in the pictures are not connected to FixMatch.',
      label: 'See typical prices: {trade}',
    },
    cta: {
      title: ['See the price', 'before you call.'],
      lead: 'FixMatch is coming soon to iPhone. If you run a business, you can join from the start.',
    },
    compare: {
      kicker: 'Why FixMatch',
      title: 'From ringing round to choosing yourself',
      before: 'Today',
      after: 'With FixMatch',
      rows: [
        ['You ring round to get a price.', 'You see what businesses charge before you call.'],
        [
          'You do not know whether the quote is fair.',
          'Quote check tells you whether the price is low, normal or high.',
        ],
        ['You fill in a form and wait to be called.', 'You choose yourself and call the business directly.'],
        [
          'You cannot tell whether someone paid to be at the top.',
          'The order cannot be bought, and ads are always labelled.',
        ],
        ['Reviews can come from anyone.', 'Only users who contacted the business through FixMatch can review it.'],
      ],
    },
    soon: ['Coming soon', 'to iPhone'],
    business: 'Do you run a business?',
    liveTitle: 'On FixMatch right now',
    live: {
      free: ['business has time today', 'businesses have time today'],
      groups: ['open neighbour group', 'open neighbour groups'],
      prices: ['price that a user shared', 'prices that users shared themselves'],
      reviews: ['review from a FixMatch user', 'reviews from FixMatch users'],
    },
    featuresKicker: 'What the app does',
    featuresTitle: 'Everything you need before you call',
    caption: 'The pictures are from the app. The businesses in them are fictional examples.',
    features: [
      {
        image: 'kategori',
        alt: 'The list of plumbers in the app with hourly rate, distance, match and the verified badge',
        icon: 'search',
        title: 'Find and compare',
        lead: 'See the hourly rate, typical prices, distance and reviews before you call. You choose what matters most.',
        points: [
          [
            'Describe your problem',
            'Write in your own words what is wrong and what you want to spend. The app finds the trade and the ones that fit your budget.',
          ],
          ['Compare up to three', 'Side by side: price, distance, opening hours and reviews.'],
          ['Everyone on one map', 'See where the businesses are, and who comes out to you.'],
        ],
      },
      {
        image: 'akut',
        alt: 'Urgent help in the app: the first four steps for water damage and the nearest 24/7 businesses',
        icon: 'siren',
        title: 'When it is urgent',
        lead: 'Water is leaking, the power is out, or you are locked out. The app helps you in the first minutes.',
        points: [
          [
            'Urgent help',
            'The first steps, such as where to turn off the water, and one tap to call the nearest 24/7 service.',
          ],
          [
            'Who has time today?',
            'Businesses say themselves when they have time today or tomorrow. They come first when it is urgent.',
          ],
          [
            'Photo and video',
            'Send pictures of the problem, or show it over FaceTime before the tradesperson drives out.',
          ],
        ],
      },
      {
        image: 'virksomhed',
        alt: 'A business page in the app with the Verified and Demo badges, match, hourly rate, distance, reviews and price level',
        icon: 'shield',
        title: 'Peace of mind before you call',
        lead: 'You need to trust the people you let into your home. So the app shows what matters.',
        points: [
          ['Verified', 'The badge means FixMatch has checked the company number, the owner and the authorisation.'],
          [
            'Reviews from FixMatch users',
            'Only users who contacted the business through FixMatch can review it – once each.',
          ],
          ['Safety page', 'Insurance, guarantee scheme, answer rate and where to complain, all in one place.'],
        ],
      },
      {
        image: 'faelles',
        alt: 'Neighbour discount in the app: open groups nearby and a code from a neighbour',
        icon: 'coins',
        title: 'Pay the right price',
        lead: 'Is the quote fair? The app compares it with what others charge and pay.',
        points: [
          [
            'Quote check',
            "Take a picture of the quote, copy the text with the iPhone's Live Text, and paste it in. The app tells you whether the price is low, normal or high.",
          ],
          [
            'Neighbour discount',
            `Team up with the neighbours on gutters, boiler service or tyre changes. With at least ${minGroup} of you, businesses typically give ${discount.min}–${discount.max} % off.`,
          ],
          [
            'Share what you paid',
            'See prices that users nearby shared themselves for the same job, and what the tax deduction gives.',
          ],
        ],
      },
    ],
    moreTitle: 'And a little more',
    more: [
      ['home', 'My home', 'Keep what was done to the house, by whom and when, with invoices and pictures.'],
      ['euro', 'Green guide', 'See what deductions and subsidies give for heat pumps, insulation and new windows.'],
      ['car', 'Warning light?', 'See what the warning light in your car means, and whether you can drive on.'],
      ['widget', 'Widgets', 'Your saved tradespeople and quick help right on your home screen.'],
    ],
    steps: [
      ['Say what needs doing', 'Choose a trade, or describe the problem in your own words.'],
      ['Compare', 'Price, distance, reviews and who has time. Save the ones you like.'],
      ['Call directly', 'You talk to the business itself. No fees and no middleman.'],
    ],
    promisesTitle: 'Our promises',
    promises: [
      [
        'star',
        'The order cannot be bought',
        'It is based on price, distance and reviews from FixMatch users, and you choose what matters most. Paid ads are always labelled "Ad" and never change the order.',
      ],
      ['phone', 'Free for you', 'You only pay the business for the work, and you agree the price with them directly.'],
      [
        'shield',
        'Your data in the EU',
        'No ad networks and no tracking. Everything is stored on servers in the EU, and a business only sees your name and number when you contact it.',
      ],
    ],
    businessKicker: 'For tradespeople and garages',
    businessTitle: 'Free to join. No fee per customer.',
    businessPoints: [
      'Customers nearby find you on price, distance and reviews from FixMatch users, and call you directly.',
      'Mark "Free today" with one tap, and come first when it is urgent.',
      'Get verified for free, and get the badge next to your name.',
      'See your contacts and correct your details under My business in the app.',
    ],
    businessCta: 'Sign up your business',
    availableCta: 'Free today?',
    faqTitle: 'Questions and answers',
    faq: [
      [
        'What does FixMatch cost?',
        'The app is free for you, and it is free for businesses to join. You only pay the business for the work.',
      ],
      ['When can I get the app?', 'FixMatch is being tested now and is coming soon to iPhone, in Denmark first.'],
      [
        'How is the order decided?',
        'By price, distance and reviews from FixMatch users – you choose what matters most. A business with no reviews counts as 5 neutral reviews of 4.0. When it is urgent, businesses with a 24/7 service and free time come first. The order cannot be bought.',
      ],
      [
        'Who can write reviews?',
        'Users who contacted the business through FixMatch – once each. We check that you tapped Call or sent the business a message in FixMatch. We cannot see whether the call was answered or whether the job was done.',
      ],
      [
        'What happens to my details?',
        'They are stored in the EU, and we never sell them. Read more in the [privacy policy](privacy/).',
      ],
    ],
  };
  return lang === 'da' ? da : en;
}

/** Links in the FAQ answers: [label](relative/). */
const linked = (value) => escape(value).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');

/** The page's main content, its title and description, and the script for the live numbers. */
function landing(lang, { root, assets = '' }) {
  const minGroup = readNumber(root, 'src/state/groups.ts', 'MIN_GROUP');
  const discount = readGroupDiscount(root);
  const t = text(lang, { minGroup, discount });
  const image = (name) => `${assets}images/app-${name}-${lang}.webp`;
  const phone = (name, alt, extra = '') =>
    `<figure class="phone${extra}"><img src="${image(name)}" alt="${escape(alt)}" width="300" height="656" loading="${extra ? 'eager' : 'lazy'}" decoding="async"></figure>`;
  const signUp = lang === 'da' ? 'tilmeld/' : 'sign-up/';
  const available = lang === 'da' ? 'ledig/' : 'available/';

  // The last full stop of the heading in sun yellow, like "Se prisen, før du ringer." in the app.
  const lastLine = escape(t.h1[1]).replace(/\.$/, '<span class="dot">.</span>');
  const art = tradeArt(root);
  const trades = readJobs(root);
  const prices = readJobPrices(root);
  // The edge of a 3D phone: thin metal layers between its front and its back, and its side buttons.
  const edge = `${'<i></i>'.repeat(9)}<b class="key a"></b><b class="key u"></b><b class="key d"></b><b class="key p"></b>`;
  const island = '<span class="island"></span>';
  const camera = '<span class="camera"><i></i><i></i><i></i><b></b></span>';
  // Trade tiles and the list's labels float around the phone at different depths. Decoration only.
  const floats = ['vvs', 'elektriker', 'toemrer', 'maler', 'mekaniker']
    .map((id, index) => `<span class="float f${index + 1}">${art.tile(id, { size: 64 })}</span>`)
    .join('');
  const chips = t.chips
    .map(
      (label, index) => `<span class="chip c${index + 1}">${index === 2 ? icon('check') : ''}${escape(label)}</span>`,
    )
    .join('');
  const hero = `<section class="hero">
<div class="hero-text">
<p class="eyebrow">${escape(t.eyebrow)}</p>
<h1>${escape(t.h1[0])}<br>${lastLine}</h1>
<p class="lead">${escape(t.lead)}</p>
<div class="actions">
<span class="soon">${icon('phone')}<span><small>${escape(t.soon[0])}</small>${escape(t.soon[1])}</span></span>
<a class="button sun" href="${signUp}">${escape(t.business)}${icon('arrow')}</a>
</div>
<div class="live" data-live hidden>
<p class="live-title"><span class="pulse" aria-hidden="true"></span>${escape(t.liveTitle)}</p>
<ul data-live-list></ul>
</div>
</div>
<div class="stage" data-stage>
<div class="tilt">
<div class="scene">
<div class="orbit" aria-hidden="true">${floats}${chips}</div>
<figure class="phone3d">${edge}<span class="phone-back" aria-hidden="true">${camera}</span><span class="phone-front"><span class="glass"><img src="${image('home')}" alt="${escape(t.heroAlt)}" width="300" height="656" fetchpriority="high" decoding="async">${island}</span></span></figure>
</div>
</div>
</div>
</section>`;

  // What you get, on a card that overlaps the panel like the app's search card.
  const values = `<div class="values">
<ul aria-label="${escape(t.valuesLabel)}">
${t.values.map(([name, title, body]) => `<li>${icon(name)}<div><strong>${escape(title)}</strong><span>${escape(body)}</span></div></li>`).join('\n')}
</ul>
</div>`;

  // The price guide: choose a trade and see what its common jobs typically cost. Radio buttons
  // and CSS only, so it works without JavaScript and with the keyboard.
  const number = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'da' ? '.' : ',');
  const unitText = {
    da: { opgave: '', m2: ' pr. m²', stk: ' pr. stk.' },
    en: { opgave: '', m2: ' per m²', stk: ' each' },
  }[lang];
  const price = ({ unit, min, max }) => {
    const range = min === max ? number(min) : `${number(min)}–${number(max)}`;
    return lang === 'da' ? `${range} kr.${unitText[unit]}` : `DKK ${range}${unitText[unit]}`;
  };
  const tradeIds = Object.keys(trades);
  const guide = `<section class="guide" id="${lang === 'da' ? 'priser' : 'prices'}">
<div class="section-head">
<p class="eyebrow">${escape(t.guide.kicker)}</p>
<h2>${escape(t.guide.title)}</h2>
<p class="lead">${escape(t.guide.lead)}</p>
</div>
<fieldset class="guide-body">
<legend class="vh">${escape(t.guide.pick)}</legend>
${tradeIds.map((id, index) => `<input class="vh" type="radio" name="guide-trade" id="guide-${id}"${index === 0 ? ' checked' : ''}>`).join('\n')}
<div class="guide-trades">
${tradeIds.map((id) => `<label for="guide-${id}">${art.tile(id, { size: 72 })}<span>${escape(trades[id].name[lang])}</span></label>`).join('\n')}
</div>
<div class="guide-panels">
${tradeIds
  .map(
    (id) => `<div class="guide-panel" style="--trade: ${art.colors[id].deep}; --trade-dark: ${art.colors[id].tile}">
<h3>${escape(t.guide.typical)} ${escape(trades[id].name[lang])}</h3>
<ul>
${Object.entries(prices[id])
  .map(
    ([job, value]) =>
      `<li><span class="job">${escape(trades[id].jobs[job][lang])}</span><span class="range" aria-hidden="true"><i style="--from: ${Math.round((value.min / value.max) * 100)}%"></i></span><strong>${escape(price(value))}</strong></li>`,
  )
  .join('\n')}
</ul>
</div>`,
  )
  .join('\n')}
</div>
</fieldset>
<p class="note">${escape(t.guide.note)}</p>
</section>`;

  // Photos of tradespeople at work (website/photos.json), once they have been downloaded with
  // npm run website:photos. Without them the page simply has no photo sections.
  const photoList = JSON.parse(fs.readFileSync(path.join(root, 'website/photos.json'), 'utf8'));
  const hasPhoto = (key) => fs.existsSync(path.join(root, 'website/photos', `${key}.jpg`));
  const photo = (key) => `${assets}photos/${key}.jpg`;
  const shots = photoList.filter((p) => p.trade && trades[p.trade] && prices[p.trade]?.[p.job]);
  const gallery =
    shots.length >= 4 && shots.every((p) => hasPhoto(p.key))
      ? `<section class="gallery">
<div class="section-head">
<p class="eyebrow">${escape(t.gallery.kicker)}</p>
<h2>${escape(t.gallery.title)}</h2>
</div>
<div class="gallery-grid">
${shots
  .slice(0, 4)
  .map(
    (
      p,
    ) => `<a class="shot" href="#${lang === 'da' ? 'priser' : 'prices'}" data-guide="guide-${p.trade}" aria-label="${escape(t.gallery.label.replace('{trade}', trades[p.trade].name[lang]))}">
<img src="${photo(p.key)}" alt="${escape(p.alt[lang])}" loading="lazy" decoding="async">
<span class="shot-text">${art.tile(p.trade, { size: 40 })}<strong>${escape(trades[p.trade].name[lang])}</strong><span>${escape(trades[p.trade].jobs[p.job][lang])} · ${escape(t.gallery.typical)} ${escape(price(prices[p.trade][p.job]))}</span></span>
</a>`,
  )
  .join('\n')}
</div>
<p class="note">${escape(t.gallery.credit)}</p>
</section>`
      : '';

  const map = siteMap(lang, { root, trades, art });

  // How it works: on a wide screen a 3D phone stays in view and turns to the next screen at
  // each step (the script adds "pinned"). Otherwise each step simply has its own picture.
  const storyImages = ['home', 'kategori', 'virksomhed'];
  const story = `<section class="story" data-story>
<div class="section-head">
<p class="eyebrow">${escape(t.story.kicker)}</p>
<h2>${escape(t.story.title)}</h2>
</div>
<div class="story-grid">
<div class="story-stage" aria-hidden="true">
<div class="story-phone" data-step="0"><div class="spin">${edge}<span class="phone-back">${camera}<span class="wordmark">fixmatch<span class="dot">.</span></span></span><span class="phone-front"><span class="glass">${storyImages.map((name) => `<img src="${image(name)}" alt="" width="300" height="656" loading="lazy" decoding="async">`).join('')}${island}</span></span></div></div>
</div>
<ol class="story-steps">
${t.steps
  .map(
    ([title, body], index) => `<li data-step-item${index === 0 ? ' class="on"' : ''}>
<div class="step-text"><span class="number">${index + 1}</span><h3>${escape(title)}</h3><p>${escape(body)}</p></div>
${phone(storyImages[index], t.story.alts[index])}
</li>`,
  )
  .join('\n')}
</ol>
</div>
</section>`;

  const compare = `<section class="compare">
<div class="section-head">
<p class="eyebrow">${escape(t.compare.kicker)}</p>
<h2>${escape(t.compare.title)}</h2>
</div>
<div class="compare-grid">
<div class="compare-card before">
<h3>${escape(t.compare.before)}</h3>
<ul>
${t.compare.rows.map(([before]) => `<li>${icon('cross')}<span>${escape(before)}</span></li>`).join('\n')}
</ul>
</div>
<div class="compare-card after">
<h3>${escape(t.compare.after)}</h3>
<ul>
${t.compare.rows.map(([, after]) => `<li>${icon('check')}<span>${escape(after)}</span></li>`).join('\n')}
</ul>
</div>
</div>
</section>`;

  const features = `<section class="features" id="${lang === 'da' ? 'funktioner' : 'features'}">
<div class="section-head">
<p class="eyebrow">${escape(t.featuresKicker)}</p>
<h2>${escape(t.featuresTitle)}</h2>
</div>
${t.features
  .map(
    (feature, index) => `<article class="feature${index % 2 ? ' flip' : ''}">
${phone(feature.image, feature.alt)}
<div class="feature-text">
<span class="badge">${icon(feature.icon)}</span>
<h3>${escape(feature.title)}</h3>
<p class="lead">${escape(feature.lead)}</p>
<ul class="points">
${feature.points.map(([title, body]) => `<li>${icon('check')}<div><strong>${escape(title)}</strong><span>${escape(body)}</span></div></li>`).join('\n')}
</ul>
</div>
</article>`,
  )
  .join('\n')}
<p class="caption">${escape(t.caption)}</p>
<h3 class="more-title">${escape(t.moreTitle)}</h3>
<div class="tiles">
${t.more.map(([name, title, body]) => `<div class="tile">${icon(name)}<h4>${escape(title)}</h4><p>${escape(body)}</p></div>`).join('\n')}
</div>
</section>`;

  const promises = `<section class="promises">
<h2>${escape(t.promisesTitle)}</h2>
<div class="tiles three">
${t.promises.map(([name, title, body]) => `<div class="tile">${icon(name)}<h3>${escape(title)}</h3><p>${escape(body)}</p></div>`).join('\n')}
</div>
</section>`;

  const businessPhoto = photoList.find((p) => p.key === 'virksomhed');
  const showBusinessPhoto = businessPhoto && hasPhoto('virksomhed');
  const business = `<section class="business${showBusinessPhoto ? ' has-photo' : ''}" id="${lang === 'da' ? 'virksomheder' : 'businesses'}">
<div>
<p class="eyebrow">${escape(t.businessKicker)}</p>
<h2>${escape(t.businessTitle)}</h2>
</div>
<ul class="points">
${t.businessPoints.map((point) => `<li>${icon('check')}<div><span>${escape(point)}</span></div></li>`).join('\n')}
</ul>
<div class="actions">
<a class="button sun" href="${signUp}">${escape(t.businessCta)}${icon('arrow')}</a>
<a class="button on-ink" href="${available}">${escape(t.availableCta)}</a>
</div>
${showBusinessPhoto ? `<figure class="business-photo"><img src="${photo('virksomhed')}" alt="${escape(businessPhoto.alt[lang])}" loading="lazy" decoding="async"></figure>` : ''}
</section>`;

  // The last word before the footer: the promise once more, and the two ways in.
  const cta = `<section class="cta">
<h2>${escape(t.cta.title[0])}<br>${escape(t.cta.title[1]).replace(/\.$/, '<span class="dot">.</span>')}</h2>
<p class="lead">${escape(t.cta.lead)}</p>
<div class="actions">
<span class="soon">${icon('phone')}<span><small>${escape(t.soon[0])}</small>${escape(t.soon[1])}</span></span>
<a class="button sun" href="${signUp}">${escape(t.business)}${icon('arrow')}</a>
</div>
</section>`;

  const faq = `<section class="faq">
<h2>${escape(t.faqTitle)}</h2>
${t.faq.map(([question, answer]) => `<details><summary>${escape(question)}</summary><p>${linked(answer)}</p></details>`).join('\n')}
</section>`;

  const supabase = readSupabase(root);
  const config = { supabase, text: t.live };
  const script = supabase
    ? `<script>
(() => {
  const config = ${JSON.stringify(config).replace(/</g, '\\u003c')};
  const box = document.querySelector('[data-live]');
  const list = box.querySelector('[data-live-list]');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  // Counts only: the public views of the app (the same ones the app reads), never who.
  const count = async (query) => {
    const response = await fetch(config.supabase.url + '/rest/v1/' + query, {
      method: 'HEAD',
      headers: { apikey: config.supabase.key, Prefer: 'count=exact' },
    });
    if (!response.ok) return 0;
    return Number((response.headers.get('content-range') || '').split('/')[1]) || 0;
  };
  const queries = {
    free: 'availability?select=business_id&available_on=cs.' + encodeURIComponent('{' + today + '}'),
    groups: 'open_group_jobs?select=id&status=eq.open',
    prices: 'shared_prices?select=job',
    reviews: 'public_reviews?select=id',
  };
  const number = new Intl.NumberFormat(document.documentElement.lang);
  Promise.all(Object.entries(queries).map(([key, query]) => count(query).catch(() => 0).then((n) => [key, n]))).then((counts) => {
    const shown = counts.filter(([, n]) => n > 0);
    if (!shown.length) return;
    for (const [key, n] of shown) {
      const item = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = number.format(n);
      item.append(strong, ' ' + config.text[key][n === 1 ? 0 : 1]);
      list.append(item);
    }
    box.hidden = false;
  });
})();
</script>`
    : '';

  // Motion: the hero's 3D scene follows the pointer, and the story's phone turns at each step.
  // Both are extras: without the script (or with reduced motion) the page reads the same.
  const motion = `<script>
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = document.querySelector('[data-stage]');
  if (stage && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const scene = stage.querySelector('.scene');
    let frame = 0;
    addEventListener('pointermove', (event) => {
      if (frame || calm.matches) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = stage.getBoundingClientRect();
        const x = (event.clientX - (box.left + box.width / 2)) / innerWidth;
        const y = (event.clientY - (box.top + box.height / 2)) / innerHeight;
        scene.style.setProperty('--ry', (x * 22).toFixed(2));
        scene.style.setProperty('--rx', (-y * 14).toFixed(2));
      });
    }, { passive: true });
  }
  // A photo of a trade opens that trade in the price guide.
  for (const link of document.querySelectorAll('[data-guide]')) {
    link.addEventListener('click', () => {
      const choice = document.getElementById(link.dataset.guide);
      if (choice) choice.checked = true;
    });
  }
  const story = document.querySelector('[data-story]');
  if (story && 'IntersectionObserver' in window) {
    const wide = matchMedia('(min-width: 901px)');
    const phone = story.querySelector('.story-phone');
    const steps = [...story.querySelectorAll('[data-step-item]')];
    const apply = () => story.classList.toggle('pinned', wide.matches && !calm.matches);
    apply();
    wide.addEventListener('change', apply);
    calm.addEventListener('change', apply);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = steps.indexOf(entry.target);
        phone.dataset.step = String(index);
        steps.forEach((step, n) => step.classList.toggle('on', n === index));
      }
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((step) => observer.observe(step));
  }
})();
</script>`;

  return {
    title: t.title,
    description: t.description,
    // The hero goes on the panel at the top of the page (build-website.js), the rest below it.
    top: hero,
    html: [values, gallery, guide, map.html, story, compare, features, promises, business, faq, cta]
      .filter(Boolean)
      .join('\n'),
    script: script + map.script + motion,
  };
}

const LANDING_STYLE = `
body.wide header, body.wide footer { max-width: 1120px; }
body.wide .masthead { padding-bottom: 128px; }
main.landing { max-width: 1120px; margin: 0 auto; background: none; border: 0; border-radius: 0; box-shadow: none; padding: 0 20px; }
.landing section { margin: 0 0 104px; }
.landing h2 { font-size: clamp(30px, 4vw, 44px); line-height: 1.08; margin: 0 0 12px; }
.landing h3 { font-size: 22px; line-height: 1.25; margin: 0; }
.landing p { margin: 0; }
.eyebrow { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand-text); margin: 0 0 12px !important; }
.lead { color: var(--muted) !important; font-size: 18px; }
.icon { width: 22px; height: 22px; flex: none; }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 54px; padding: 0 24px; border-radius: 16px; font-family: var(--display); font-weight: 700; font-size: 18px; letter-spacing: -0.01em; text-decoration: none; }
.button .icon { width: 20px; height: 20px; stroke-width: 2.4; }
.button.sun { color: var(--on-accent); background: var(--accent); box-shadow: 0 8px 20px -10px rgba(26, 20, 0, 0.55); }
.button.sun:hover { filter: brightness(1.04); }
.button.on-ink { color: var(--on-ink); border: 1.5px solid rgba(255, 255, 255, 0.28); }
.button.on-ink:hover { background: rgba(255, 255, 255, 0.08); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 32px; }
.hero { max-width: 1120px; margin: 0 auto; padding: 20px 20px 0; display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 40px; align-items: center; }
.hero .eyebrow { color: var(--on-panel-soft); }
.hero h1 { color: var(--on-panel); font-size: clamp(44px, 6.2vw, 74px); line-height: 1; letter-spacing: -0.045em; margin: 0 0 22px; }
.hero .lead { color: var(--on-panel-soft) !important; font-size: 20px; max-width: 560px; }
.soon { display: inline-flex; align-items: center; gap: 10px; min-height: 54px; padding: 0 20px 0 16px; border-radius: 16px; background: #0B1A15; color: #FFFFFF; line-height: 1.15; font-family: var(--display); font-weight: 700; font-size: 18px; }
.soon small { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; font-weight: 500; color: #B9C9C2; }
.phone { position: relative; margin: 0; width: 300px; flex: none; border-radius: 47px; padding: 3px; background: linear-gradient(135deg, #E4E9E6, #7C8580 28%, #CBD2CE 52%, #5B645F 78%, #B4BDB8); box-shadow: 0 30px 60px -24px rgba(11, 26, 21, 0.45), 0 0 0 1px rgba(11, 26, 21, 0.08); }
.phone img { display: block; width: 100%; height: auto; border: 7px solid #050807; border-radius: 44px; }
.phone::before, .island { content: ""; position: absolute; left: 50%; top: calc(10px + 1.7%); translate: -50% 0; width: 29%; aspect-ratio: 3.35; border-radius: 999px; background: #000000; z-index: 1; }
.island { top: calc(6.5px + 1.7%); }
.island::after { content: ""; position: absolute; right: 13%; top: 50%; translate: 0 -50%; width: 11%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 36% 34%, #33476A, #05070C 62%); }
@media (prefers-color-scheme: dark) { .phone { box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px #2E423A; } }
.live { margin-top: 28px; padding: 14px 18px; border-radius: 18px; background: var(--panel-sunk); border: 1px solid rgba(255, 255, 255, 0.12); max-width: 560px; }
.live-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--on-panel-soft); margin-bottom: 4px !important; }
.pulse { width: 8px; height: 8px; border-radius: 50%; background: #2FD39C; box-shadow: 0 0 0 4px rgba(47, 211, 156, 0.25); }
.live ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; }
.live li { margin: 0; color: var(--on-panel-soft); font-size: 15px; line-height: 1.35; }
.live strong { display: block; color: var(--on-panel); font-family: var(--display); font-weight: 800; font-size: 28px; line-height: 1.1; letter-spacing: -0.035em; }
.section-head { text-align: center; max-width: 680px; margin: 0 auto 56px; }
.feature { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 72px; align-items: center; margin: 0 auto 88px; max-width: 940px; }
.feature.flip { grid-template-columns: minmax(0, 1fr) 300px; }
.feature.flip .phone { order: 2; }
.feature h3 { font-size: 34px; font-weight: 800; line-height: 1.1; letter-spacing: -0.035em; }
.feature .lead { margin: 12px 0 24px; }
.badge { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 16px; background: var(--brand-soft); color: var(--brand-text); margin-bottom: 18px; }
.points { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.points li { display: flex; gap: 12px; margin: 0; }
.points li > .icon { box-sizing: content-box; width: 14px; height: 14px; padding: 4px; margin-top: 3px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-text); stroke-width: 3; }
.points strong { display: block; font-family: var(--display); font-weight: 700; font-size: 18px; letter-spacing: -0.01em; }
.points span { color: var(--muted); }
.caption { text-align: center; color: var(--muted); font-size: 14px; margin: -40px 0 64px !important; }
.more-title { text-align: center; font-size: 26px !important; font-weight: 800; letter-spacing: -0.03em !important; margin-bottom: 24px !important; }
.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.tiles.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.tile { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; box-shadow: var(--shadow-card); }
.tile .icon { box-sizing: content-box; padding: 11px; border-radius: 14px; background: var(--brand-soft); color: var(--brand-text); margin-bottom: 16px; }
.tile h3, .tile h4 { font-family: var(--display); font-size: 19px; font-weight: 700; letter-spacing: -0.015em; margin: 0 0 6px; }
.tile p { color: var(--muted); font-size: 15px; }
.promises h2 { margin-bottom: 28px; }
.business { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px 56px; padding: 56px; border-radius: 28px; background: var(--ink); color: var(--on-ink); }
.business .eyebrow { color: var(--on-ink-soft); }
.business h2 { color: var(--on-ink); }
.business .points span { color: var(--on-ink-soft); }
.business .points li > .icon { background: rgba(47, 211, 156, 0.16); color: #2FD39C; }
.business .actions { grid-column: 1 / -1; margin-top: 0; }
.faq { max-width: 760px; margin-left: auto !important; margin-right: auto !important; }
.faq h2 { margin-bottom: 20px; }
.faq details { border-top: 1px solid var(--border); padding: 18px 0; }
.faq details:last-of-type { border-bottom: 1px solid var(--border); }
.faq summary { cursor: pointer; font-family: var(--display); font-weight: 700; font-size: 19px; letter-spacing: -0.015em; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 16px; min-height: 32px; }
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after { content: "+"; flex: none; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-text); font-size: 20px; line-height: 1; }
.faq details[open] summary::after { content: "–"; }
.faq details p { color: var(--muted); margin-top: 10px; }
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 8px; }
  .feature, .feature.flip { grid-template-columns: 1fr; gap: 32px; }
  .feature .phone, .feature.flip .phone { order: 2; justify-self: center; width: 260px; }
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tiles.three, .business { grid-template-columns: 1fr; }
  .business { padding: 36px 24px; }
}
@media (max-width: 520px) {
  body.wide .masthead { padding-bottom: 104px; }
  main.landing { padding: 0 12px; }
  .landing section { margin-bottom: 72px; }
  .hero { padding: 4px 16px 0; }
  .hero h1 { font-size: 42px; }
  .hero .lead { font-size: 18px; }
  .phone { width: 260px; border-radius: 42px; }
  .phone img { border-width: 6px; border-radius: 39px; }
  .section-head, .faq h2, .promises h2 { padding: 0 4px; }
  .tiles { grid-template-columns: 1fr; }
  .caption { margin-top: -24px !important; }
}
.vh { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
body.wide .masthead { overflow: clip; }
.section-head .lead { margin-top: 4px; }
.note { text-align: center; color: var(--muted-2); font-size: 14px; margin-top: 16px !important; }

/* The 3D scene of the hero: a phone with real depth, and the app's tiles and labels floating around it. */
.stage { position: relative; --w: 270px; width: 440px; max-width: 100%; height: 620px; justify-self: center; perspective: 1400px; }
.tilt, .scene, .orbit { position: absolute; inset: 0; transform-style: preserve-3d; }
.scene { transform: rotateX(calc(var(--rx, 0) * 1deg)) rotateY(calc(var(--ry, 0) * 1deg)); transition: transform 0.4s ease-out; }
.scene::before { content: ""; position: absolute; left: 14%; right: 6%; bottom: -4px; height: 54px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0, 0, 0, 0.5), transparent); filter: blur(8px); transform: translateZ(-150px); }
.phone3d, .story-phone { position: absolute; inset: 0; margin: auto; width: var(--w); height: calc((var(--w) - 18px) * 656 / 300 + 18px); transform-style: preserve-3d; }
.phone3d { transform: rotateY(-24deg) rotateX(9deg) rotateZ(3deg); }
.phone3d > i, .spin > i, .phone-back, .phone-front { position: absolute; inset: 0; border-radius: 46px; }
.phone3d > i, .spin > i { background: linear-gradient(100deg, #6E7772, #D9DFDB 9%, #8F9893 22%, #4A534F 50%, #9BA49F 78%, #E1E6E3 91%, #6E7772); }
.phone3d > i:nth-child(1), .spin > i:nth-child(1) { transform: translateZ(-6px); }
.phone3d > i:nth-child(2), .spin > i:nth-child(2) { transform: translateZ(-4.5px); }
.phone3d > i:nth-child(3), .spin > i:nth-child(3) { transform: translateZ(-3px); }
.phone3d > i:nth-child(4), .spin > i:nth-child(4) { transform: translateZ(-1.5px); }
.phone3d > i:nth-child(6), .spin > i:nth-child(6) { transform: translateZ(1.5px); }
.phone3d > i:nth-child(7), .spin > i:nth-child(7) { transform: translateZ(3px); }
.phone3d > i:nth-child(8), .spin > i:nth-child(8) { transform: translateZ(4.5px); }
.phone3d > i:nth-child(9), .spin > i:nth-child(9) { transform: translateZ(6px); }
.key { position: absolute; width: 10px; border-radius: 3px; background: linear-gradient(180deg, #DDE3DF, #8A938E 40%, #6C7570); }
.key.a, .key.u, .key.d { left: -5px; transform: translateX(-1.5px) rotateY(-90deg); }
.key.a { top: 17.5%; height: 4.2%; }
.key.u { top: 25%; height: 7.5%; }
.key.d { top: 34.5%; height: 7.5%; }
.key.p { right: -5px; top: 28%; height: 12%; transform: translateX(1.5px) rotateY(90deg); }
.phone-back { background: linear-gradient(155deg, #2B3B35, #16241F 45%, #0E1B17); transform: rotateY(180deg) translateZ(7px); backface-visibility: hidden; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.1); }
.camera { position: absolute; left: 7%; top: 3.6%; width: 41%; aspect-ratio: 1; border-radius: 26%; background: linear-gradient(145deg, #34453F, #1B2A25); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.4); }
.camera i { position: absolute; width: 40%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 38% 34%, #4B6076 0 8%, #101820 30%, #05080B 62%, #2B3A35 64%); box-shadow: 0 0 0 2px #3C4D47; }
.camera i:nth-child(1) { left: 8%; top: 8%; }
.camera i:nth-child(2) { left: 8%; bottom: 8%; }
.camera i:nth-child(3) { right: 8%; top: 30%; }
.camera b { position: absolute; right: 17%; top: 9%; width: 12%; aspect-ratio: 1; border-radius: 50%; background: #F3E9C8; }
.phone-front { padding: 2.5px; background: linear-gradient(135deg, #E4E9E6, #7C8580 28%, #CBD2CE 52%, #5B645F 78%, #B4BDB8); transform: translateZ(7px); backface-visibility: hidden; }
.glass { position: relative; display: block; width: 100%; height: 100%; padding: 6.5px; border-radius: 43.5px; background: #050807; }
.glass img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 37px; }
.glass::after { content: ""; position: absolute; inset: 6.5px; border-radius: 37px; background: linear-gradient(112deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.05) 20%, transparent 34%, transparent 72%, rgba(255, 255, 255, 0.08)) calc(30% - var(--ry, 0) * 2%) 0 / 220% 100%; pointer-events: none; }
.wordmark { font-family: var(--display); font-weight: 900; font-size: 34px; letter-spacing: -0.035em; color: #FFFFFF; }
.float, .chip { position: absolute; }
.float .trade-tile { display: block; width: 64px; height: 64px; filter: drop-shadow(0 16px 14px rgba(0, 0, 0, 0.32)); }
.f1 { left: 0; top: 9%; transform: translateZ(110px) rotate(-10deg); --d: 6.5s; }
.f2 { right: 3%; top: 1%; transform: translateZ(-80px) rotate(8deg); --d: 7.5s; --delay: -2s; }
.f3 { left: 0; top: 61%; transform: translateZ(50px) rotate(7deg); --d: 8s; --delay: -4s; }
.f4 { right: 1%; top: 75%; transform: translateZ(140px) rotate(-7deg); --d: 6s; --delay: -1s; }
.f5 { left: 22%; bottom: 0; transform: translateZ(-110px) rotate(12deg); --d: 9s; --delay: -3s; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 15px; border-radius: 999px; font-family: var(--display); font-weight: 700; font-size: 15px; line-height: 1.3; letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 16px 28px -12px rgba(0, 0, 0, 0.55); }
.chip .icon { width: 16px; height: 16px; stroke-width: 3; color: #00805C; }
.c1 { left: 0; top: 35%; transform: translateZ(170px); background: #DCF4E9; color: #00704F; --d: 7s; --delay: -1.5s; }
.c2 { right: 0; top: 21%; transform: translateZ(120px); background: #FFB800; color: #1A1400; --d: 6.2s; --delay: -3.5s; }
.c3 { right: 2%; bottom: 21%; transform: translateZ(180px); background: #FFFFFF; color: #0B1A15; --d: 8.4s; --delay: -0.5s; }

/* What you get: overlaps the panel like the app's search card. */
main.landing > .values { position: relative; margin: -80px 0 96px; padding: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow-raised); }
.values ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px 32px; }
.values li { display: flex; align-items: flex-start; gap: 14px; margin: 0; }
.values .icon { box-sizing: content-box; padding: 11px; border-radius: 14px; background: var(--brand-soft); color: var(--brand-text); }
.values strong { display: block; font-family: var(--display); font-weight: 800; font-size: 20px; line-height: 1.25; letter-spacing: -0.02em; }
.values span { display: block; color: var(--muted); font-size: 15.5px; line-height: 1.45; }

/* The price guide: radio buttons choose the trade, and CSS shows its panel. */
.guide-body { border: 0; margin: 0; padding: 0; min-width: 0; }
.guide-trades { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 10px; perspective: 900px; }
.guide-trades label { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 14px 4px 12px; border: 2px solid transparent; border-radius: 20px; cursor: pointer; text-align: center; font-family: var(--display); font-weight: 700; font-size: 16px; line-height: 1.2; letter-spacing: -0.01em; }
.guide-trades .trade-tile { width: 72px; height: 72px; filter: drop-shadow(0 6px 8px rgba(11, 26, 21, 0.16)); transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.guide-trades label:hover .trade-tile { transform: translateY(-6px) rotateX(16deg) rotateY(-16deg) scale(1.05); }
.guide-body > input:nth-of-type(1):checked ~ .guide-trades > label:nth-child(1), .guide-body > input:nth-of-type(2):checked ~ .guide-trades > label:nth-child(2), .guide-body > input:nth-of-type(3):checked ~ .guide-trades > label:nth-child(3), .guide-body > input:nth-of-type(4):checked ~ .guide-trades > label:nth-child(4), .guide-body > input:nth-of-type(5):checked ~ .guide-trades > label:nth-child(5), .guide-body > input:nth-of-type(6):checked ~ .guide-trades > label:nth-child(6), .guide-body > input:nth-of-type(7):checked ~ .guide-trades > label:nth-child(7), .guide-body > input:nth-of-type(8):checked ~ .guide-trades > label:nth-child(8), .guide-body > input:nth-of-type(9):checked ~ .guide-trades > label:nth-child(9), .guide-body > input:nth-of-type(10):checked ~ .guide-trades > label:nth-child(10) { background: var(--surface); border-color: var(--brand); box-shadow: var(--shadow-card); }
.guide-body > input:nth-of-type(1):focus-visible ~ .guide-trades > label:nth-child(1), .guide-body > input:nth-of-type(2):focus-visible ~ .guide-trades > label:nth-child(2), .guide-body > input:nth-of-type(3):focus-visible ~ .guide-trades > label:nth-child(3), .guide-body > input:nth-of-type(4):focus-visible ~ .guide-trades > label:nth-child(4), .guide-body > input:nth-of-type(5):focus-visible ~ .guide-trades > label:nth-child(5), .guide-body > input:nth-of-type(6):focus-visible ~ .guide-trades > label:nth-child(6), .guide-body > input:nth-of-type(7):focus-visible ~ .guide-trades > label:nth-child(7), .guide-body > input:nth-of-type(8):focus-visible ~ .guide-trades > label:nth-child(8), .guide-body > input:nth-of-type(9):focus-visible ~ .guide-trades > label:nth-child(9), .guide-body > input:nth-of-type(10):focus-visible ~ .guide-trades > label:nth-child(10) { outline: 3px solid var(--brand); outline-offset: 2px; }
.guide-panels { margin-top: 20px; }
.guide-panel { display: none; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow-card); padding: 26px 28px 12px; }
.guide-body > input:nth-of-type(1):checked ~ .guide-panels > .guide-panel:nth-child(1), .guide-body > input:nth-of-type(2):checked ~ .guide-panels > .guide-panel:nth-child(2), .guide-body > input:nth-of-type(3):checked ~ .guide-panels > .guide-panel:nth-child(3), .guide-body > input:nth-of-type(4):checked ~ .guide-panels > .guide-panel:nth-child(4), .guide-body > input:nth-of-type(5):checked ~ .guide-panels > .guide-panel:nth-child(5), .guide-body > input:nth-of-type(6):checked ~ .guide-panels > .guide-panel:nth-child(6), .guide-body > input:nth-of-type(7):checked ~ .guide-panels > .guide-panel:nth-child(7), .guide-body > input:nth-of-type(8):checked ~ .guide-panels > .guide-panel:nth-child(8), .guide-body > input:nth-of-type(9):checked ~ .guide-panels > .guide-panel:nth-child(9), .guide-body > input:nth-of-type(10):checked ~ .guide-panels > .guide-panel:nth-child(10) { display: block; }
.guide-panel h3 { font-size: 20px; margin-bottom: 8px; }
.guide-panel ul { list-style: none; margin: 0; padding: 0; }
.guide-panel li { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(80px, 1fr) 11.5em; align-items: center; gap: 18px; margin: 0; padding: 14px 0; border-top: 1px solid var(--border); }
.guide-panel li:first-child { border-top: 0; }
.guide-panel .job { font-weight: 600; }
.guide-panel strong { font-family: var(--display); font-weight: 800; font-size: 20px; letter-spacing: -0.03em; white-space: nowrap; text-align: right; }
.range { position: relative; height: 8px; border-radius: 999px; background: var(--fill); overflow: hidden; }
.range i { position: absolute; inset: 0 0 0 var(--from); border-radius: 999px; background: var(--trade); }
@media (prefers-color-scheme: dark) { .range i { background: var(--trade-dark); } }

/* How it works. "pinned" (set by the script on wide screens) keeps a 3D phone in view that turns at each step. */
.story-stage { display: none; }
.story-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.story-steps li { margin: 0; padding: 26px; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-card); display: flex; flex-direction: column; gap: 24px; }
.story-steps .phone { width: 100%; max-width: 240px; align-self: center; }
.story .number { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(180deg, var(--panel), var(--panel-2)); color: var(--on-panel); font-family: var(--display); font-weight: 800; font-size: 20px; margin-bottom: 16px; }
.story-steps h3 { margin-bottom: 6px; font-size: 21px; }
.story-steps p { color: var(--muted); }
.story.pinned .story-grid { display: grid; grid-template-columns: 400px minmax(0, 1fr); gap: 72px; align-items: start; max-width: 960px; margin: 0 auto; }
.story.pinned .story-stage { display: block; position: sticky; top: calc(50vh - 310px); height: 620px; --w: 270px; perspective: 1400px; }
.story.pinned .story-steps { display: block; }
.story.pinned .story-steps li { min-height: 76vh; justify-content: center; padding: 0; background: none; border: 0; box-shadow: none; opacity: 0.3; transition: opacity 0.4s; }
.story.pinned .story-steps li.on { opacity: 1; }
.story.pinned .story-steps .phone { display: none; }
.story.pinned .story-steps h3 { font-size: 40px; font-weight: 800; line-height: 1.05; letter-spacing: -0.035em; margin-bottom: 12px; }
.story.pinned .story-steps p { font-size: 19px; max-width: 420px; }
.spin { position: absolute; inset: 0; transform-style: preserve-3d; transform: rotateX(6deg) rotateY(calc(var(--step, 0) * 374deg - 14deg)); transition: transform 1s cubic-bezier(0.3, 0.7, 0.2, 1); }
.story-phone[data-step="1"] { --step: 1; }
.story-phone[data-step="2"] { --step: 2; }
.story-phone .glass img { position: absolute; inset: 6.5px; width: calc(100% - 13px); height: calc(100% - 13px); opacity: 0; transition: opacity 0s linear 0.45s; }
.story-phone[data-step="0"] img:nth-child(1), .story-phone[data-step="1"] img:nth-child(2), .story-phone[data-step="2"] img:nth-child(3) { opacity: 1; }

/* Today and with FixMatch, side by side. */
.compare-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; perspective: 1600px; }
.compare-card { border-radius: 24px; padding: 32px; }
.compare-card h3 { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 20px; }
.compare-card ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.compare-card li { display: flex; align-items: flex-start; gap: 12px; margin: 0; min-height: 3.2em; }
.compare-card .icon { box-sizing: content-box; width: 14px; height: 14px; padding: 5px; margin-top: 2px; border-radius: 50%; stroke-width: 3; }
.compare-card.before { background: var(--surface); border: 1px solid var(--border); }
.compare-card.before li, .compare-card.before h3 { color: var(--muted); }
.compare-card.before .icon { background: var(--fill); color: var(--muted-2); }
.compare-card.after { background: linear-gradient(180deg, var(--panel), var(--panel-2)); box-shadow: var(--shadow-raised); }
.compare-card.after li, .compare-card.after h3 { color: var(--on-panel); }
.compare-card.after li { font-weight: 600; }
.compare-card.after .icon { background: rgba(255, 255, 255, 0.18); color: #FFFFFF; }
@media (min-width: 901px) {
  .compare-card.before { transform: rotateY(5deg); transform-origin: right center; }
  .compare-card.after { transform: rotateY(-5deg) translateZ(24px); transform-origin: left center; }
}

/* Motion is an extra: only for those who have not asked for less of it. */
@keyframes bob { 50% { translate: 0 -12px; } }
@keyframes hover { 50% { translate: 0 -10px; } }
@keyframes sway { from { transform: rotateY(-9deg) rotateX(2deg); } to { transform: rotateY(9deg) rotateX(-2deg); } }
@keyframes panel-in { from { opacity: 0; translate: 0 10px; } }
@keyframes turn-away { to { transform: rotateX(14deg) rotateY(24deg) scale(0.9); } }
@keyframes tilt-in { from { opacity: 0.3; transform: perspective(1200px) rotateY(28deg) translateY(56px) scale(0.94); } }
@keyframes tilt-in-flip { from { opacity: 0.3; transform: perspective(1200px) rotateY(-28deg) translateY(56px) scale(0.94); } }
@media (prefers-reduced-motion: no-preference) {
  .float, .chip { animation: bob var(--d, 7s) ease-in-out var(--delay, 0s) infinite; }
  .phone3d { animation: hover 7s ease-in-out infinite; }
  .guide-body > input:nth-of-type(1):checked ~ .guide-panels > .guide-panel:nth-child(1), .guide-body > input:nth-of-type(2):checked ~ .guide-panels > .guide-panel:nth-child(2), .guide-body > input:nth-of-type(3):checked ~ .guide-panels > .guide-panel:nth-child(3), .guide-body > input:nth-of-type(4):checked ~ .guide-panels > .guide-panel:nth-child(4), .guide-body > input:nth-of-type(5):checked ~ .guide-panels > .guide-panel:nth-child(5), .guide-body > input:nth-of-type(6):checked ~ .guide-panels > .guide-panel:nth-child(6), .guide-body > input:nth-of-type(7):checked ~ .guide-panels > .guide-panel:nth-child(7), .guide-body > input:nth-of-type(8):checked ~ .guide-panels > .guide-panel:nth-child(8), .guide-body > input:nth-of-type(9):checked ~ .guide-panels > .guide-panel:nth-child(9), .guide-body > input:nth-of-type(10):checked ~ .guide-panels > .guide-panel:nth-child(10) { animation: panel-in 0.3s ease-out; }
  @media (hover: none) { .scene { animation: sway 9s ease-in-out infinite alternate; } }
  @supports ((animation-timeline: scroll()) and (animation-range: 0% 100%)) {
    .tilt { animation: turn-away linear both; animation-timeline: scroll(root block); animation-range: 0 80vh; }
    .feature .phone { animation: tilt-in linear both; animation-timeline: view(); animation-range: entry 0% cover 38%; }
    .feature.flip .phone { animation-name: tilt-in-flip; }
  }
}
@media (prefers-reduced-motion: reduce) {
  .scene, .spin, .guide-trades .trade-tile { transition: none; }
}
@media (max-width: 900px) {
  .stage { --w: 232px; width: 360px; height: 540px; }
  main.landing > .values { margin-top: -72px; }
  .values ul, .story-steps, .compare-grid { grid-template-columns: 1fr; }
  .guide-trades { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .story-steps li { flex-direction: row; align-items: center; justify-content: space-between; }
  .story-steps .phone { max-width: 180px; flex: none; }
}
@media (max-width: 520px) {
  .stage { --w: 204px; width: 300px; height: 480px; }
  .float .trade-tile { width: 52px; height: 52px; }
  .chip { font-size: 13px; padding: 6px 12px; }
  main.landing > .values { margin: -64px 0 72px; padding: 22px 18px; border-radius: 20px; }
  .guide-trades { gap: 4px; }
  .guide-trades label { font-size: 14px; padding: 10px 2px; border-radius: 16px; }
  .guide-trades .trade-tile { width: 58px; height: 58px; }
  .guide-panel { padding: 20px 18px 8px; border-radius: 20px; }
  .guide-panel li { grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; }
  .guide-panel .range { grid-column: 1 / -1; order: 3; }
  .guide-panel strong { font-size: 18px; }
  .story-steps li { flex-direction: column; align-items: stretch; padding: 22px; }
  .story-steps .phone { max-width: 220px; align-self: center; }
  .compare-card { padding: 24px 20px; }
}
/* Photos of the trades. Each opens its trade in the price guide. */
.gallery-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; perspective: 1400px; }
.shot { position: relative; display: block; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 24px; background: var(--fill); color: #FFFFFF; text-decoration: none; box-shadow: var(--shadow-raised); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.shot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.shot::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11, 26, 21, 0) 40%, rgba(11, 26, 21, 0.86)); }
.shot-text { position: absolute; left: 18px; right: 18px; bottom: 16px; z-index: 1; display: grid; gap: 2px; }
.shot-text .trade-tile { width: 40px; height: 40px; margin-bottom: 8px; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35)); }
.shot-text strong { font-family: var(--display); font-weight: 800; font-size: 24px; line-height: 1.15; letter-spacing: -0.03em; }
.shot-text span { color: #E6F7EF; font-size: 15px; line-height: 1.35; }
.shot:hover { transform: translateY(-6px) rotateX(3deg); }
.shot:hover img { transform: scale(1.05); }
.business.has-photo { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
.business.has-photo > :not(.business-photo) { grid-column: 1; }
.business-photo { grid-column: 2; grid-row: 1 / span 3; margin: 0; min-height: 320px; border-radius: 20px; overflow: hidden; position: relative; }
.business-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.cta { text-align: center; padding: 72px 24px; border-radius: 28px; color: var(--on-panel); background: radial-gradient(circle at 88% -20%, rgba(255, 255, 255, 0.08) 0 220px, transparent 221px), linear-gradient(180deg, var(--panel), var(--panel-2)); }
.cta h2 { color: var(--on-panel); font-size: clamp(38px, 6vw, 64px); line-height: 1; letter-spacing: -0.045em; margin-bottom: 18px; }
.cta .lead { color: var(--on-panel-soft) !important; max-width: 520px; margin: 0 auto; }
.cta .actions { justify-content: center; }
@media (prefers-reduced-motion: reduce) { .shot, .shot img { transition: none; } }
@media (max-width: 900px) {
  .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .business.has-photo { grid-template-columns: 1fr; }
  .business-photo { grid-column: 1; grid-row: auto; min-height: 240px; }
}
@media (max-width: 520px) {
  .shot { border-radius: 20px; }
  .shot-text { left: 12px; right: 12px; bottom: 12px; }
  .shot-text strong { font-size: 19px; }
  .shot-text span { font-size: 13px; }
  .shot-text .trade-tile { width: 32px; height: 32px; }
  .cta { padding: 48px 18px; }
}
`;

module.exports = { landing, LANDING_STYLE: LANDING_STYLE + MAP_STYLE };
