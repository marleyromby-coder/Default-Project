/**
 * The front page of the website (fixmatchh.netlify.app/ and /en/): what FixMatch does, with
 * screenshots from the app (website/images/app-*.webp), and live numbers from the same
 * Supabase project as the app. The numbers only show once there is something to show.
 */
const { readGroupDiscount, readNumber } = require('./app-data');
const { readSupabase } = require('./signup-form');

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
  wand: '<path d="m4 20 12-12"/><path d="m14 6 4 4"/><path d="M19 3v4M17 5h4M7 3v2M6 4h2"/>',
  map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  widget:
    '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  euro: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v8M8 12h8"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  people:
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 14.5c3 0 6 1.8 6 5.5"/>',
};

const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

function text(lang, { minGroup, discount }) {
  const da = {
    title: 'Find den rette håndværker',
    description:
      'Sammenlign lokale håndværkere og værksteder på pris, afstand og anmeldelser fra rigtige kunder, og ring direkte. Gratis app til iPhone, først i Danmark.',
    eyebrow: 'Til iPhone · Først i Danmark',
    h1: ['Den rette håndværker.', 'Til den rette pris.'],
    lead: 'Sammenlign lokale håndværkere og værksteder på pris, afstand og anmeldelser fra rigtige kunder. Ring direkte til dem, du vælger. Ingen mellemled, og ingen kan betale sig til en bedre plads.',
    soon: ['Kommer snart', 'til iPhone'],
    business: 'Har du en virksomhed?',
    liveTitle: 'Lige nu på FixMatch',
    live: {
      free: ['virksomhed har tid i dag', 'virksomheder har tid i dag'],
      groups: ['åben naborabat-gruppe', 'åbne naborabat-grupper'],
      prices: ['delt pris fra kunder', 'delte priser fra kunder'],
      reviews: ['anmeldelse fra rigtige opkald', 'anmeldelser fra rigtige opkald'],
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
        lead: 'Se timepris, typiske priser og afstand, før du ringer. Du bestemmer selv, om pris eller afstand vægter mest.',
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
        alt: 'En virksomheds side i appen med verificeret-flueben, timepris, afstand og svarprocent',
        icon: 'shield',
        title: 'Tryghed før du ringer',
        lead: 'Du skal kunne stole på dem, du lukker ind i dit hjem. Derfor viser appen det, der betyder noget.',
        points: [
          ['Verificeret', 'Fluebenet betyder, at FixMatch selv har tjekket CVR, ejer og autorisation.'],
          [
            'Anmeldelser fra rigtige opkald',
            'Kun kunder, der har kontaktet virksomheden gennem FixMatch, kan anmelde den.',
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
            'Tag et billede af tilbuddet. Appen læser linjerne og siger, om prisen er lav, normal eller høj.',
          ],
          [
            'Naborabat',
            `Gå sammen med naboerne om tagrender, fyrservice eller hjulskift. Er I mindst ${minGroup}, giver håndværkeren typisk ${discount.min}–${discount.max} % rabat.`,
          ],
          [
            'Del, hvad du betalte',
            'Se, hvad andre i nærheden har betalt for samme opgave, og hvad håndværkerfradraget giver.',
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
    stepsTitle: 'Sådan virker det',
    steps: [
      ['Fortæl, hvad der skal laves', 'Vælg et fag, eller beskriv problemet med dine egne ord.'],
      ['Sammenlign', 'Pris, afstand, anmeldelser og hvem der har tid. Gem dem, du kan lide.'],
      ['Ring direkte', 'Du taler med virksomheden selv. Ingen gebyrer og ingen mellemled.'],
    ],
    promisesTitle: 'Det lover vi',
    promises: [
      [
        'star',
        'Ingen betalte placeringer',
        'Rækkefølgen bestemmes af pris, afstand og det, du vægter. Ingen kan købe sig foran.',
      ],
      ['phone', 'Gratis for dig', 'Du betaler kun virksomheden for arbejdet. Prisen aftaler du direkte med dem.'],
      [
        'shield',
        'Dine data i EU',
        'Alt ligger på servere i EU. Virksomheden ser kun dit navn og nummer, når du kontakter den.',
      ],
    ],
    businessKicker: 'For håndværkere og værksteder',
    businessTitle: 'Gratis at være med. Ingen gebyr pr. kunde.',
    businessPoints: [
      'Kunder i nærheden finder jer på pris og afstand og ringer direkte.',
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
        'Efter pris og afstand, og hvor meget du selv vægter hver af dem. Når det haster, står dem med døgnvagt og ledig tid først. Ingen kan betale sig foran.',
      ],
      [
        'Hvem kan skrive anmeldelser?',
        'Kun brugere, der har kontaktet virksomheden gennem FixMatch, og kun én gang hver. Så ved du, at anmeldelsen kommer fra en rigtig kunde.',
      ],
      [
        'Hvad sker der med mine oplysninger?',
        'De ligger i EU, og vi sælger dem ikke. Læs mere i [privatlivspolitikken](privatliv/).',
      ],
    ],
  };
  const en = {
    title: 'Find the right tradesperson',
    description:
      'Compare local tradespeople and garages on price, distance and reviews from real customers, and call them directly. A free iPhone app, launching in Denmark.',
    eyebrow: 'For iPhone · Launching in Denmark',
    h1: ['The right tradesperson.', 'At the right price.'],
    lead: 'Compare local tradespeople and garages on price, distance and reviews from real customers. Call the one you choose directly. No middleman, and nobody can pay for a better spot.',
    soon: ['Coming soon', 'to iPhone'],
    business: 'Do you run a business?',
    liveTitle: 'On FixMatch right now',
    live: {
      free: ['business has time today', 'businesses have time today'],
      groups: ['open neighbour group', 'open neighbour groups'],
      prices: ['price shared by customers', 'prices shared by customers'],
      reviews: ['review from a real call', 'reviews from real calls'],
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
        lead: 'See the hourly rate, typical prices and distance before you call. You decide whether price or distance matters most.',
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
        alt: 'A business page in the app with the verified badge, hourly rate, distance and answer rate',
        icon: 'shield',
        title: 'Peace of mind before you call',
        lead: 'You need to trust the people you let into your home. So the app shows what matters.',
        points: [
          ['Verified', 'The badge means FixMatch has checked the company number, the owner and the authorisation.'],
          ['Reviews from real calls', 'Only customers who contacted the business through FixMatch can review it.'],
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
            'Take a picture of the quote. The app reads the lines and tells you whether the price is low, normal or high.',
          ],
          [
            'Neighbour discount',
            `Team up with the neighbours on gutters, boiler service or tyre changes. With at least ${minGroup} of you, businesses typically give ${discount.min}–${discount.max} % off.`,
          ],
          ['Share what you paid', 'See what others nearby paid for the same job, and what the tax deduction gives.'],
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
    stepsTitle: 'How it works',
    steps: [
      ['Say what needs doing', 'Choose a trade, or describe the problem in your own words.'],
      ['Compare', 'Price, distance, reviews and who has time. Save the ones you like.'],
      ['Call directly', 'You talk to the business itself. No fees and no middleman.'],
    ],
    promisesTitle: 'Our promises',
    promises: [
      [
        'star',
        'No paid placements',
        'The order is set by price, distance and what you value. Nobody can buy their way to the top.',
      ],
      ['phone', 'Free for you', 'You only pay the business for the work, and you agree the price with them directly.'],
      [
        'shield',
        'Your data in the EU',
        'Everything is stored on servers in the EU. A business only sees your name and number when you contact it.',
      ],
    ],
    businessKicker: 'For tradespeople and garages',
    businessTitle: 'Free to join. No fee per customer.',
    businessPoints: [
      'Customers nearby find you on price and distance, and call you directly.',
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
        'By price and distance, and how much you value each. When it is urgent, businesses with a 24/7 service and free time come first. Nobody can pay to come first.',
      ],
      [
        'Who can write reviews?',
        'Only users who contacted the business through FixMatch, and only once each. So you know the review comes from a real customer.',
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

  const hero = `<section class="hero">
<div class="hero-text">
<p class="eyebrow">${escape(t.eyebrow)}</p>
<h1>${escape(t.h1[0])}<br><span>${escape(t.h1[1])}</span></h1>
<p class="lead">${escape(t.lead)}</p>
<div class="actions">
<span class="soon">${icon('phone')}<span><small>${escape(t.soon[0])}</small>${escape(t.soon[1])}</span></span>
<a class="button secondary" href="${signUp}">${escape(t.business)}</a>
</div>
<div class="live" data-live hidden>
<p class="live-title"><span class="pulse" aria-hidden="true"></span>${escape(t.liveTitle)}</p>
<ul data-live-list></ul>
</div>
</div>
${phone('home', lang === 'da' ? 'Forsiden i appen: søgefelt, Beskriv dit problem, Tilbudstjek og fagene' : 'The front page of the app: search, Describe your problem, Quote check and the trades', ' hero-phone')}
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

  const steps = `<section class="steps">
<h2>${escape(t.stepsTitle)}</h2>
<ol>
${t.steps.map(([title, body], index) => `<li><span class="number">${index + 1}</span><h3>${escape(title)}</h3><p>${escape(body)}</p></li>`).join('\n')}
</ol>
</section>`;

  const promises = `<section class="promises">
<h2>${escape(t.promisesTitle)}</h2>
<div class="tiles three">
${t.promises.map(([name, title, body]) => `<div class="tile">${icon(name)}<h3>${escape(title)}</h3><p>${escape(body)}</p></div>`).join('\n')}
</div>
</section>`;

  const business = `<section class="business" id="${lang === 'da' ? 'virksomheder' : 'businesses'}">
<div>
<p class="eyebrow">${escape(t.businessKicker)}</p>
<h2>${escape(t.businessTitle)}</h2>
</div>
<ul class="points">
${t.businessPoints.map((point) => `<li>${icon('check')}<div><span>${escape(point)}</span></div></li>`).join('\n')}
</ul>
<div class="actions">
<a class="button accent" href="${signUp}">${escape(t.businessCta)}</a>
<a class="button on-ink" href="${available}">${escape(t.availableCta)}</a>
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

  return {
    title: t.title,
    description: t.description,
    html: [hero, features, steps, promises, business, faq].join('\n'),
    script,
  };
}

const LANDING_STYLE = `
body.wide header, body.wide footer { max-width: 1120px; }
main.landing { max-width: 1120px; background: none; border: 0; border-radius: 0; padding: 0 20px; }
.landing section { margin: 0 0 88px; }
.landing h2 { font-size: clamp(28px, 4vw, 40px); line-height: 1.15; margin: 0 0 12px; }
.landing h3 { font-size: 22px; line-height: 1.25; margin: 0; }
.landing p { margin: 0; }
.eyebrow { font-size: 14px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--brand); margin: 0 0 12px !important; }
.lead { color: var(--muted) !important; font-size: 18px; }
.icon { width: 22px; height: 22px; flex: none; }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 22px; border-radius: 999px; font-weight: 600; text-decoration: none; }
.button.secondary { color: var(--text); background: var(--surface); border: 1px solid var(--border); }
.button.accent { color: #1C1A17; background: var(--accent); }
.button.on-ink { color: #F4F1EA; border: 1px solid rgba(244, 241, 234, 0.35); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 28px; }
.hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 56px; align-items: center; padding-top: 32px; }
.hero h1 { font-size: clamp(40px, 6.4vw, 68px); line-height: 1.04; margin: 0 0 20px; letter-spacing: -0.02em; }
.hero h1 span { color: var(--brand); }
.hero .lead { font-size: 20px; max-width: 560px; }
.soon { display: inline-flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 20px 0 16px; border-radius: 14px; background: var(--ink); color: #F4F1EA; line-height: 1.15; font-weight: 600; font-size: 18px; }
.soon small { display: block; font-size: 12px; font-weight: 500; opacity: 0.8; }
.phone { margin: 0; width: 300px; flex: none; border-radius: 44px; padding: 10px; background: #1C1A17; box-shadow: 0 30px 60px -20px rgba(24, 58, 46, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.06); }
.phone img { display: block; width: 100%; height: auto; border-radius: 34px; }
.hero-phone { transform: rotate(2deg); }
@media (prefers-color-scheme: dark) { .phone { box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px #3A4036; } }
.live { margin-top: 32px; padding: 16px 20px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); max-width: 560px; }
.live-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--muted); margin-bottom: 6px !important; }
.pulse { width: 8px; height: 8px; border-radius: 50%; background: #25733F; box-shadow: 0 0 0 4px rgba(37, 115, 63, 0.18); }
.live ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 20px; }
.live li { margin: 0; }
.section-head { text-align: center; max-width: 640px; margin: 0 auto 48px; }
.feature { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 64px; align-items: center; margin: 0 auto 72px; max-width: 920px; }
.feature.flip { grid-template-columns: minmax(0, 1fr) 300px; }
.feature.flip .phone { order: 2; }
.feature h3 { font-size: 30px; }
.feature .lead { margin: 10px 0 20px; }
.badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: var(--brand-soft); color: var(--brand); margin-bottom: 16px; }
.points { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.points li { display: flex; gap: 12px; margin: 0; }
.points li > .icon { width: 20px; height: 20px; margin-top: 3px; color: var(--brand); }
.points strong { display: block; }
.points span { color: var(--muted); }
.caption { text-align: center; color: var(--muted); font-size: 14px; margin: -32px 0 56px !important; }
.more-title { text-align: center; margin-bottom: 24px !important; }
.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.tiles.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.tile { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 22px; }
.tile .icon { color: var(--brand); margin-bottom: 12px; }
.tile h3, .tile h4 { font-family: inherit; font-size: 17px; font-weight: 650; letter-spacing: 0; margin: 0 0 6px; }
.tile p { color: var(--muted); font-size: 15px; }
.steps ol { list-style: none; margin: 28px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.steps li { margin: 0; padding: 24px; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); }
.steps .number { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--accent); color: #1C1A17; font-weight: 700; margin-bottom: 14px; }
.steps h3 { margin-bottom: 6px; font-size: 20px; }
.steps p { color: var(--muted); }
.promises h2 { margin-bottom: 28px; }
.business { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px 56px; padding: 48px; border-radius: 28px; background: var(--ink); color: #F4F1EA; }
.business .eyebrow { color: var(--accent); }
.business h2 { color: #F4F1EA; }
.business .points span { color: rgba(244, 241, 234, 0.82); }
.business .points li > .icon { color: var(--accent); }
.business .actions { grid-column: 1 / -1; margin-top: 0; }
.faq { max-width: 760px; margin-left: auto !important; margin-right: auto !important; }
.faq h2 { margin-bottom: 20px; }
.faq details { border-top: 1px solid var(--border); padding: 18px 0; }
.faq details:last-of-type { border-bottom: 1px solid var(--border); }
.faq summary { cursor: pointer; font-weight: 600; font-size: 18px; list-style: none; display: flex; justify-content: space-between; gap: 16px; }
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after { content: "+"; color: var(--brand); font-size: 22px; line-height: 1; }
.faq details[open] summary::after { content: "–"; }
.faq details p { color: var(--muted); margin-top: 10px; }
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 8px; }
  .hero-phone { justify-self: center; transform: none; }
  .feature, .feature.flip { grid-template-columns: 1fr; gap: 32px; }
  .feature .phone, .feature.flip .phone { order: 2; justify-self: center; width: 260px; }
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tiles.three, .steps ol, .business { grid-template-columns: 1fr; }
  .business { padding: 32px 24px; }
}
@media (max-width: 520px) {
  main.landing { padding: 0 16px; }
  .landing section { margin-bottom: 64px; }
  .hero .lead { font-size: 18px; }
  .phone { width: 260px; border-radius: 38px; padding: 8px; }
  .phone img { border-radius: 30px; }
  .tiles { grid-template-columns: 1fr; }
  .caption { margin-top: -16px !important; }
}
`;

module.exports = { landing, LANDING_STYLE };
