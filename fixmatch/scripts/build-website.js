#!/usr/bin/env node
/**
 * Builds the public website: the front page with screenshots from the app, privacy policy, terms,
 * support, the sign-up form for businesses, "Ledig i dag" and the Naborabat page that the app's
 * invites link to, in Danish and English. Apple needs public privacy policy and support URLs.
 * The pages use the same Supabase project as the app (fixmatch/.env).
 *
 *   npm run website:build   → dist-website/, ready for Netlify Drop (docs/lancering/hjemmeside.md)
 *
 * Besides the pages it writes what a public site needs: a description and a sharing image
 * for search engines and links, robots.txt, sitemap.xml, a 404 page and Netlify's _headers.
 *
 * The front page is scripts/lib/landing.js; the other texts come from docs/jura (the legal
 * templates) and website/, and the pictures from website/images. Fields in
 * {{…}} are filled in from src/constants/app-info.ts. Lines starting with ">"
 * are notes for the team and are left out.
 */
const fs = require('node:fs');
const path = require('node:path');

const { readGroupDiscount, readNumber } = require('./lib/app-data');
const { AVAILABILITY_STYLE, availabilityForm } = require('./lib/availability-form');
const { GROUP_STYLE, groupPage } = require('./lib/group-page');
const { LANDING_STYLE, landing } = require('./lib/landing');
const { FORM_STYLE, signupForm } = require('./lib/signup-form');
const { tradeArt } = require('./lib/trade-art');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist-website');

/**
 * Each page in both languages: source file and the folder it is published in. LANDING is the
 * front page (scripts/lib/landing.js). The header and footer link to pages by their place here.
 */
const LANDING = 'landing';
const PAGES = [
  { da: [LANDING, ''], en: [LANDING, 'en/'] },
  { da: ['docs/jura/privatlivspolitik.md', 'privatliv/'], en: ['docs/jura/privacy-policy.en.md', 'en/privacy/'] },
  { da: ['docs/jura/vilkaar.md', 'vilkaar/'], en: ['docs/jura/terms.en.md', 'en/terms/'] },
  { da: ['website/support.md', 'support/'], en: ['website/support.en.md', 'en/support/'] },
  // Businesses sign up and give their consent here ({{form}}, scripts/lib/signup-form.js).
  { da: ['website/tilmeld.md', 'tilmeld/'], en: ['website/signup.en.md', 'en/sign-up/'] },
  // "Hvem har tid i dag?": businesses mark free time with their personal link (scripts/lib/availability-form.js).
  { da: ['website/ledig.md', 'ledig/'], en: ['website/available.en.md', 'en/available/'] },
  // Naborabat: the invites from the app link here with the group's code (scripts/lib/group-page.js).
  { da: ['website/naborabat.md', 'naborabat/'], en: ['website/neighbours.en.md', 'en/neighbours/'] },
];

const UI = {
  da: {
    privacy: 'Privatlivspolitik',
    terms: 'Vilkår',
    support: 'Support',
    business: 'For virksomheder',
    features: 'Funktioner',
    featuresAnchor: 'funktioner',
    groups: 'Naborabat',
    other: 'English',
    locale: 'da-DK',
  },
  en: {
    privacy: 'Privacy policy',
    terms: 'Terms',
    support: 'Support',
    business: 'For businesses',
    features: 'Features',
    featuresAnchor: 'features',
    groups: 'Neighbour discount',
    other: 'Dansk',
    locale: 'en-GB',
  },
};

/** The string fields of APP_INFO. app-info.ts is TypeScript, so it is read as text. */
function appInfo(root = ROOT) {
  const source = fs.readFileSync(path.join(root, 'src/constants/app-info.ts'), 'utf8');
  const field = (name) => source.match(new RegExp(`\\b${name}: '([^']*)'`))?.[1] ?? '';
  return {
    name: field('name'),
    company: field('company'),
    email: field('email'),
    website: field('website').replace(/\/$/, ''),
    updated: field('legalUpdated'),
    unfinished: source.includes('TODO'),
  };
}

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * An e-mail address written as HTML character references, so the simplest address
 * harvesters miss it. Browsers show and follow it as normal.
 */
const obfuscate = (email) => [...email].map((c) => `&#${c.codePointAt(0)};`).join('');

/** Inline markdown: links, bold, italics, code and plain email addresses. */
function inline(text, link) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${link(href)}">${label}</a>`)
    .replace(
      /(^|[\s(])([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g,
      (_, before, email) => `${before}<a href="${obfuscate(`mailto:${email}`)}">${obfuscate(email)}</a>`,
    );
}

/** The small part of Markdown the texts use: headings, paragraphs, lists and notes. */
function markdownToHtml(markdown, link = (href) => href) {
  const html = [];
  let paragraph = [];
  let list = null;
  const flush = () => {
    if (paragraph.length) html.push(`<p>${inline(paragraph.join(' '), link)}</p>`);
    paragraph = [];
    if (list)
      html.push(`<${list.tag}>${list.items.map((item) => `<li>${inline(item, link)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('>')) continue;
    const heading = line.match(/^(#{1,3}) (.*)$/);
    const bullet = line.match(/^- (.*)$/);
    const numbered = line.match(/^\d+\. (.*)$/);
    if (!line) flush();
    else if (heading) {
      flush();
      html.push(`<h${heading[1].length}>${inline(heading[2], link)}</h${heading[1].length}>`);
    } else if (bullet || numbered) {
      const tag = bullet ? 'ul' : 'ol';
      if (paragraph.length || list?.tag !== tag) flush();
      list ??= { tag, items: [] };
      list.items.push((bullet ?? numbered)[1]);
    } else if (list) list.items[list.items.length - 1] += ` ${line}`;
    else paragraph.push(line);
  }
  flush();
  return html.join('\n');
}

/** Fills in {{fields}} and refuses to publish anything still unfilled. */
function fill(text, values, file) {
  const filled = text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in values)) throw new Error(`${file}: ukendt felt ${match}`);
    return values[key];
  });
  const published = filled
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n');
  const placeholder = published.match(/\[[^\]\n]+\](?!\()/);
  if (placeholder) throw new Error(`${file}: pladsholderen ${placeholder[0]} er ikke udfyldt`);
  return filled;
}

/**
 * The page's first paragraph as plain text, at most 155 characters, for search engines and
 * link previews. An e-mail address becomes "os"/"us", so it never appears in plain text.
 */
function summary(markdown, lang = 'da') {
  const first = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|>|-|\d+\.|\{\{|\*)/.test(block));
  const text = (first ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, lang === 'da' ? 'os' : 'us')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 155) return text;
  return `${text.slice(0, 154).replace(/\s+\S*$/, '')}…`;
}

function formatDate(iso, locale) {
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  );
}

/** The app's palette (src/constants/theme.ts, docs/design/designsystem.md) for light and dark mode. */
const STYLE = `
@font-face { font-family: "Schibsted Grotesk"; font-weight: 700; font-display: swap; src: url("{{fonts}}schibsted-grotesk-latin-700-normal.woff2") format("woff2"); }
@font-face { font-family: "Schibsted Grotesk"; font-weight: 800; font-display: swap; src: url("{{fonts}}schibsted-grotesk-latin-800-normal.woff2") format("woff2"); }
@font-face { font-family: "Schibsted Grotesk"; font-weight: 900; font-display: swap; src: url("{{fonts}}schibsted-grotesk-latin-900-normal.woff2") format("woff2"); }
:root {
  --bg: #F1F5F3; --surface: #FFFFFF; --surface-alt: #F6F9F7; --fill: #E7EEEA; --border: #DFE7E3;
  --text: #0B1A15; --muted: #41524C; --muted-2: #5C6D66;
  --brand: #00805C; --brand-strong: #00805C; --on-brand: #FFFFFF; --brand-text: #00704F; --brand-soft: #DCF4E9;
  --panel: #007A56; --panel-2: #00614A; --on-panel: #FFFFFF; --on-panel-soft: #E6F7EF; --panel-sunk: rgba(11, 26, 21, 0.2);
  --accent: #FFB800; --on-accent: #1A1400; --accent-soft: #FFF3CC; --accent-text: #7F5300;
  --ink: #0B1A15; --on-ink: #FFFFFF; --on-ink-soft: #B9C9C2; --danger: #B42A18;
  --shadow-card: 0 1px 2px rgba(11, 26, 21, 0.05), 0 6px 16px rgba(11, 26, 21, 0.06);
  --shadow-raised: 0 2px 4px rgba(11, 26, 21, 0.06), 0 12px 28px rgba(11, 26, 21, 0.12);
  --display: "Schibsted Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) { :root {
  --bg: #0A1210; --surface: #131D1A; --surface-alt: #1A2622; --fill: #20302A; --border: #25342E;
  --text: #ECF4F0; --muted: #A6B8B1; --muted-2: #889B94;
  --brand: #2FD39C; --brand-strong: #2FD39C; --on-brand: #03140E; --brand-text: #45DCA8; --brand-soft: #0E2C22;
  --panel: #0B5E48; --panel-2: #08443A; --on-panel-soft: #D5EFE4; --panel-sunk: rgba(0, 0, 0, 0.2);
  --accent: #FFC21F; --accent-soft: #2C250F; --accent-text: #FFCF4D;
  --ink: #22322C; --on-ink: #ECF4F0; --on-ink-soft: #B3C4BD; --danger: #FF9B85;
  --shadow-card: none; --shadow-raised: 0 8px 24px rgba(0, 0, 0, 0.45);
} }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-text-size-adjust: 100%; }
h1, h2, h3, .brand { font-family: var(--display); font-weight: 800; letter-spacing: -0.03em; }
h1, h2, h3 { text-wrap: balance; }
h3 { font-weight: 700; letter-spacing: -0.015em; }
.dot { color: var(--accent); }
.masthead { position: relative; color: var(--on-panel); background: radial-gradient(circle at calc(100% + 40px) -60px, rgba(255, 255, 255, 0.07) 0 230px, transparent 231px), radial-gradient(circle at calc(100% - 10px) 150px, transparent 0 74px, rgba(255, 255, 255, 0.08) 75px 76.5px, transparent 77.5px), linear-gradient(180deg, var(--panel), var(--panel-2)); border-radius: 0 0 28px 28px; padding-bottom: 76px; }
header, footer, .page-head { max-width: 760px; margin: 0 auto; padding: 0 20px; }
header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 18px; padding-bottom: 18px; }
nav.top { display: flex; align-items: center; gap: 22px; }
nav.top a { color: var(--on-panel); text-decoration: none; font-weight: 600; white-space: nowrap; }
nav.top a:hover { text-decoration: underline; text-underline-offset: 4px; }
nav.top .short { display: none; }
nav.top .language { display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: 999px; background: var(--panel-sunk); }
nav.top .language:hover { text-decoration: none; background: rgba(11, 26, 21, 0.32); }
.brand { display: inline-flex; align-items: center; min-height: 44px; color: var(--on-panel); font-weight: 900; font-size: 28px; letter-spacing: -0.035em; text-decoration: none; }
.page-head h1 { color: var(--on-panel); font-size: 40px; line-height: 1.08; margin: 12px 0 0; }
main { position: relative; max-width: 760px; margin: -48px auto 0; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow-raised); padding: 12px 32px 32px; }
main > :first-child { margin-top: 16px; }
h1 { font-size: 34px; line-height: 1.12; margin: 24px 0 8px; }
h2 { font-size: 24px; line-height: 1.2; margin: 36px 0 6px; }
h3 { font-size: 19px; line-height: 1.3; margin: 24px 0 0; }
p, li { color: var(--text); }
ul, ol { padding-left: 24px; }
li { margin: 6px 0; }
li::marker { color: var(--brand-text); }
a { color: var(--brand-text); text-underline-offset: 2px; }
strong { font-weight: 650; }
code { font-size: 15px; }
:focus-visible { outline: 3px solid var(--brand); outline-offset: 2px; }
.masthead :focus-visible { outline-color: var(--accent); }
footer { padding-top: 32px; padding-bottom: 40px; color: var(--muted); font-size: 15px; }
footer nav { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-bottom: 8px; }
footer nav a { font-weight: 600; text-decoration: none; }
footer nav a:hover { text-decoration: underline; }
@media (min-width: 800px) { .masthead { margin: 12px 12px 0; border-radius: 28px; } }
@media (max-width: 640px) { nav.top .wide-only { display: none; } nav.top { gap: 14px; font-size: 15px; } }
@media (max-width: 420px) { nav.top .long { display: none; } nav.top .short { display: inline; } nav.top .language { padding: 0 12px; } }
@media (max-width: 520px) { header, footer, .page-head { padding-left: 16px; padding-right: 16px; } main { margin: -48px 12px 0; padding: 4px 18px 22px; border-radius: 20px; } .page-head h1 { font-size: 32px; } h1 { font-size: 28px; } h2 { font-size: 22px; } .brand { font-size: 25px; } }
`;

/**
 * One page: the panel at the top with the header and the page's title (or, on the front page,
 * `top`: the hero), then the content on a card that overlaps the panel, like the app.
 */
/**
 * The trade choices of the sign-up form as chips with the app's trade tiles. Only CSS (FORM_STYLE
 * draws the chips), so the form's markup stays as it is.
 */
function tradeChoiceStyle(root = ROOT) {
  const art = tradeArt(root);
  return Object.keys(art.colors)
    .map(
      (id) =>
        `.signup .choice:has(> input[name="trades"][value="${id}"])::before { background-image: url("data:image/svg+xml,${encodeURIComponent(art.tile(id, { size: 28 }))}"); }`,
    )
    .join('\n');
}

function page({ lang, html, title, description, here, other, info, notFound = false, wide = false, top, script = '' }) {
  const rel = (to) => path.posix.relative(here || '.', to || '.') || '.';
  const ui = UI[lang];
  const target = (dir) => `${rel(dir)}/`.replace(/^\.\/$/, './').replace(/\/\/$/, '/');
  const links = PAGES.slice(1).map((p) => p[lang][1]);
  const home = PAGES[0][lang][1];
  // The page's title sits on the panel; the rest of the text goes on the card.
  const heading = top === undefined ? html.match(/^<h1>.*?<\/h1>\n?/)?.[0] : undefined;
  const head = top ?? (heading ? `<div class="page-head">${heading.trim()}</div>` : '');
  const body = heading ? html.slice(heading.length) : html;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} – ${escape(info.name)}</title>
${
  notFound
    ? '<base href="/">\n<meta name="robots" content="noindex">'
    : `<meta name="description" content="${escape(description)}">
<link rel="canonical" href="${info.website}/${here}">
<link rel="alternate" hreflang="${lang}" href="${info.website}/${here}">
<link rel="alternate" hreflang="${lang === 'da' ? 'en' : 'da'}" href="${info.website}/${other}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escape(info.name)}">
<meta property="og:title" content="${escape(title)} – ${escape(info.name)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${info.website}/${here}">
<meta property="og:image" content="${info.website}/icon.png">
<meta property="og:locale" content="${UI[lang].locale.replace('-', '_')}">`
}
<meta name="theme-color" content="#007A56" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0B5E48" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${rel('favicon.png')}">
<link rel="apple-touch-icon" href="${rel('icon.png')}">
<style>${STYLE.replaceAll('{{fonts}}', rel('fonts') + '/')}${html.includes('id="signup"') || html.includes('id="availability"') ? FORM_STYLE : ''}${html.includes('id="availability"') ? AVAILABILITY_STYLE : ''}${html.includes('name="trades"') ? tradeChoiceStyle() : ''}${html.includes('id="group"') ? GROUP_STYLE : ''}${wide ? LANDING_STYLE : ''}</style>
</head>
<body${wide ? ' class="wide"' : ''}>
<div class="masthead">
<header>
<a class="brand" href="${target(home)}" aria-label="${escape(info.name)}">${escape(info.name.toLowerCase())}<span class="dot">.</span></a>
<nav class="top" aria-label="${lang === 'da' ? 'Hovedmenu' : 'Main menu'}">
<a class="wide-only" href="${here === home ? '' : target(home)}#${ui.featuresAnchor}">${ui.features}</a>
<a href="${target(links[3])}">${ui.business}</a>
<a class="language" href="${target(other)}" hreflang="${lang === 'da' ? 'en' : 'da'}" lang="${lang === 'da' ? 'en' : 'da'}" aria-label="${ui.other}"><span class="long">${ui.other}</span><span class="short">${lang === 'da' ? 'EN' : 'DA'}</span></a>
</nav>
</header>
${head}
</div>
<main${wide ? ' class="landing"' : ''}>
${body}
</main>
${script}
<footer>
<nav>
<a href="${target(links[0])}">${ui.privacy}</a>
<a href="${target(links[1])}">${ui.terms}</a>
<a href="${target(links[2])}">${ui.support}</a>
<a href="${target(links[3])}">${ui.business}</a>
<a href="${target(links[5])}">${ui.groups}</a>
</nav>
© ${new Date().getFullYear()} ${escape(info.company)} · <a href="${obfuscate(`mailto:${info.email}`)}">${obfuscate(info.email)}</a>
</footer>
</body>
</html>
`;
}

function buildWebsite(out = OUT, root = ROOT) {
  const info = appInfo(root);
  fs.rmSync(out, { recursive: true, force: true });
  if (!/^https:\/\/[^/]+$/.test(info.website))
    throw new Error('src/constants/app-info.ts: website skal være en https-adresse');
  const written = [];
  const urls = [];
  const discount = readGroupDiscount(root);
  for (const entry of PAGES) {
    for (const lang of ['da', 'en']) {
      const [source, here] = entry[lang];
      const other = entry[lang === 'da' ? 'en' : 'da'][1];
      const file = path.join(out, here, 'index.html');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      written.push(path.relative(out, file));
      urls.push(`${info.website}/${here}`);
      if (source === LANDING) {
        const front = landing(lang, { root, assets: here ? '../'.repeat(here.split('/').filter(Boolean).length) : '' });
        fs.writeFileSync(file, page({ lang, ...front, here, other, info, wide: true }));
        continue;
      }
      const values = {
        publisher: info.company,
        email: info.email,
        updated: formatDate(info.updated, UI[lang].locale),
        form: '{{form}}',
        availability: '{{availability}}',
        group: '{{group}}',
        min_group: String(readNumber(root, 'src/state/groups.ts', 'MIN_GROUP')),
        discount: `${discount.min}–${discount.max}`,
      };
      const markdown = fill(fs.readFileSync(path.join(root, source), 'utf8'), values, source);
      const link = (href) =>
        /^(https?:|mailto:|#)/.test(href)
          ? href
          : `${path.posix.relative(here || '.', href) || '.'}/`.replace(/\/\/$/, '/');
      const html = markdownToHtml(markdown, link)
        .replace('<p>{{form}}</p>', () => signupForm(lang, { root, email: info.email }))
        .replace('<p>{{availability}}</p>', () => availabilityForm(lang, { root }))
        .replace('<p>{{group}}</p>', () => groupPage(lang, { root }));
      const title = markdown.match(/^# (.*)$/m)?.[1] ?? info.name;
      fs.writeFileSync(file, page({ lang, html, title, description: summary(markdown, lang), here, other, info }));
    }
  }
  fs.copyFileSync(path.join(root, 'assets/images/favicon.png'), path.join(out, 'favicon.png'));
  // The app icon: home screen bookmark on iPhone, and the picture when a link is shared.
  fs.copyFileSync(path.join(root, 'assets/images/icon.png'), path.join(out, 'icon.png'));
  // Screenshots from the app for the front page.
  fs.cpSync(path.join(root, 'website/images'), path.join(out, 'images'), { recursive: true });

  // Netlify (and most hosts) show 404.html for an address that does not exist.
  const notFound = `<h1>Siden findes ikke</h1>
<p>Linket virker ikke længere. <a href="./">Gå til forsiden</a> eller <a href="support/">skriv til os</a>.</p>
<h2 lang="en">Page not found</h2>
<p lang="en">The link no longer works. <a href="en/">Go to the front page</a> or <a href="en/support/">contact us</a>.</p>`;
  fs.writeFileSync(
    path.join(out, '404.html'),
    page({ lang: 'da', html: notFound, title: 'Siden findes ikke', here: '', other: 'en/', info, notFound: true }),
  );
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${info.website}/sitemap.xml\n`);
  fs.writeFileSync(
    path.join(out, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((url) => `  <url><loc>${url}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  // Netlify reads _headers: basic security headers, and the fonts never change.
  fs.writeFileSync(
    path.join(out, '_headers'),
    `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/images/*
  Cache-Control: public, max-age=604800
`,
  );
  // Schibsted Grotesk (SIL Open Font License), the app's display font, for the logo and headings:
  // only the weights the site uses, as woff2 with the Latin characters (website/fonts, from @fontsource).
  fs.cpSync(path.join(root, 'website/fonts'), path.join(out, 'fonts'), { recursive: true });
  return { written, info, urls };
}

if (require.main === module) {
  const { written, info } = buildWebsite();
  console.log(`Hjemmesiden er bygget i dist-website/ (${written.length} sider).`);
  if (info.unfinished)
    console.warn(
      'Bemærk: src/constants/app-info.ts har stadig TODO-felter, så siden viser pladsholder-navn og -e-mail.',
    );
  console.log(
    `Læg mappen online ved at trække den ind på https://app.netlify.com/drop – den skal ligge på ${info.website}/ (se docs/lancering/hjemmeside.md).`,
  );
}

module.exports = { buildWebsite, fill, markdownToHtml, summary };
