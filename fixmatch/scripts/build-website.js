#!/usr/bin/env node
/**
 * Builds the public website: front page, privacy policy, terms, support and the sign-up
 * form for businesses, in Danish and English. Apple needs public privacy policy and support URLs.
 *
 *   npm run website:build   → dist-website/, ready for Netlify Drop or GitHub Pages
 *
 * The texts come from docs/jura (the legal templates) and website/. Fields in
 * {{…}} are filled in from src/constants/app-info.ts. Lines starting with ">"
 * are notes for the team and are left out.
 */
const fs = require('node:fs');
const path = require('node:path');

const { FORM_STYLE, signupForm } = require('./lib/signup-form');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist-website');

/** Each page in both languages: source file and the folder it is published in. */
const PAGES = [
  { da: ['website/forside.md', ''], en: ['website/home.en.md', 'en/'] },
  { da: ['docs/jura/privatlivspolitik.md', 'privatliv/'], en: ['docs/jura/privacy-policy.en.md', 'en/privacy/'] },
  { da: ['docs/jura/vilkaar.md', 'vilkaar/'], en: ['docs/jura/terms.en.md', 'en/terms/'] },
  { da: ['website/support.md', 'support/'], en: ['website/support.en.md', 'en/support/'] },
  // Businesses sign up and give their consent here ({{form}}, scripts/lib/signup-form.js).
  { da: ['website/tilmeld.md', 'tilmeld/'], en: ['website/signup.en.md', 'en/sign-up/'] },
];

const UI = {
  da: {
    privacy: 'Privatlivspolitik',
    terms: 'Vilkår',
    support: 'Support',
    business: 'For virksomheder',
    other: 'English',
    locale: 'da-DK',
  },
  en: {
    privacy: 'Privacy policy',
    terms: 'Terms',
    support: 'Support',
    business: 'For businesses',
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
    updated: field('legalUpdated'),
    unfinished: source.includes('TODO'),
  };
}

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline markdown: links, bold, italics, code and plain email addresses. */
function inline(text, link) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${link(href)}">${label}</a>`)
    .replace(/(^|[\s(])([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g, '$1<a href="mailto:$2">$2</a>');
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

function formatDate(iso, locale) {
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  );
}

const STYLE = `
@font-face { font-family: Fraunces; font-weight: 600; font-display: swap; src: url("{{fonts}}Fraunces_600SemiBold.ttf") format("truetype"); }
@font-face { font-family: Fraunces; font-weight: 700; font-display: swap; src: url("{{fonts}}Fraunces_700Bold.ttf") format("truetype"); }
:root { --bg: #F4F1EA; --surface: #FFFDF9; --border: #E6E0D4; --text: #1C1A17; --muted: #5E574C; --brand: #1F5A46; --accent: #D09A2E; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg: #11130F; --surface: #1A1D18; --border: #30352D; --text: #F2EEE5; --muted: #B8B1A4; --brand: #8FCBAD; --accent: #E0AE4A; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
h1, h2, h3, .brand { font-family: Fraunces, Georgia, serif; font-weight: 600; letter-spacing: -0.01em; }
header, main, footer { max-width: 760px; margin: 0 auto; padding: 0 20px; }
header { display: flex; align-items: center; justify-content: space-between; padding-top: 20px; padding-bottom: 20px; }
.brand { display: flex; align-items: center; gap: 10px; color: var(--text); font-weight: 700; font-size: 24px; text-decoration: none; }
.brand .dot { color: var(--accent); }
.brand img { width: 36px; height: 36px; border-radius: 9px; }
main { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 8px 28px 28px; }
h1 { font-size: 34px; line-height: 1.2; margin: 24px 0 8px; }
h2 { font-size: 22px; margin: 32px 0 4px; }
h3 { font-size: 18px; margin: 24px 0 0; }
p, li { color: var(--text); }
ul, ol { padding-left: 24px; }
li { margin: 6px 0; }
a { color: var(--brand); }
code { font-size: 15px; }
footer { padding-top: 24px; padding-bottom: 40px; color: var(--muted); font-size: 15px; }
footer nav { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-bottom: 8px; }
@media (max-width: 520px) { main { padding: 4px 18px 20px; border-radius: 16px; } h1 { font-size: 28px; } }
`;

function page({ lang, html, title, here, other, info }) {
  const rel = (to) => path.posix.relative(here || '.', to || '.') || '.';
  const ui = UI[lang];
  const target = (dir) => `${rel(dir)}/`.replace(/^\.\/$/, './').replace(/\/\/$/, '/');
  const links = PAGES.slice(1).map((p) => p[lang][1]);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} – ${escape(info.name)}</title>
<link rel="alternate" hreflang="${lang === 'da' ? 'en' : 'da'}" href="${target(other)}">
<link rel="icon" href="${rel('favicon.png')}">
<style>${STYLE.replaceAll('{{fonts}}', rel('fonts') + '/')}${html.includes('id="signup"') ? FORM_STYLE : ''}</style>
</head>
<body>
<header>
<a class="brand" href="${target(lang === 'da' ? '' : 'en/')}" aria-label="${escape(info.name)}"><img src="${rel('favicon.png')}" alt="">${escape(info.name.toLowerCase())}<span class="dot">.</span></a>
<a href="${target(other)}" hreflang="${lang === 'da' ? 'en' : 'da'}">${ui.other}</a>
</header>
<main>
${html}
</main>
<footer>
<nav>
<a href="${target(links[0])}">${ui.privacy}</a>
<a href="${target(links[1])}">${ui.terms}</a>
<a href="${target(links[2])}">${ui.support}</a>
<a href="${target(links[3])}">${ui.business}</a>
</nav>
© ${new Date().getFullYear()} ${escape(info.company)}
</footer>
</body>
</html>
`;
}

function buildWebsite(out = OUT, root = ROOT) {
  const info = appInfo(root);
  fs.rmSync(out, { recursive: true, force: true });
  const written = [];
  for (const entry of PAGES) {
    for (const lang of ['da', 'en']) {
      const [source, here] = entry[lang];
      const other = entry[lang === 'da' ? 'en' : 'da'][1];
      const values = {
        publisher: info.company,
        email: info.email,
        updated: formatDate(info.updated, UI[lang].locale),
        form: '{{form}}',
      };
      const markdown = fill(fs.readFileSync(path.join(root, source), 'utf8'), values, source);
      const link = (href) =>
        /^(https?:|mailto:|#)/.test(href)
          ? href
          : `${path.posix.relative(here || '.', href) || '.'}/`.replace(/\/\/$/, '/');
      const html = markdownToHtml(markdown, link).replace('<p>{{form}}</p>', () =>
        signupForm(lang, { root, email: info.email }),
      );
      const title = markdown.match(/^# (.*)$/m)?.[1] ?? info.name;
      const file = path.join(out, here, 'index.html');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, page({ lang, html, title, here, other, info }));
      written.push(path.relative(out, file));
    }
  }
  fs.copyFileSync(path.join(root, 'assets/images/favicon.png'), path.join(out, 'favicon.png'));
  // Fraunces (SIL Open Font License), the serif of the logo, for the headings.
  fs.mkdirSync(path.join(out, 'fonts'));
  for (const weight of ['600SemiBold', '700Bold']) {
    const font = require.resolve(`@expo-google-fonts/fraunces/${weight}/Fraunces_${weight}.ttf`, { paths: [root] });
    fs.copyFileSync(font, path.join(out, 'fonts', path.basename(font)));
  }
  fs.copyFileSync(
    require.resolve('@expo-google-fonts/fraunces/LICENSE_FONT', { paths: [root] }),
    path.join(out, 'fonts', 'OFL.txt'),
  );
  return { written, info };
}

if (require.main === module) {
  const { written, info } = buildWebsite();
  console.log(`Hjemmesiden er bygget i dist-website/ (${written.length} sider).`);
  if (info.unfinished)
    console.warn(
      'Bemærk: src/constants/app-info.ts har stadig TODO-felter, så siden viser pladsholder-navn og -e-mail.',
    );
  console.log('Læg mappen online, fx ved at trække den ind på https://app.netlify.com/drop');
}

module.exports = { buildWebsite, fill, markdownToHtml };
