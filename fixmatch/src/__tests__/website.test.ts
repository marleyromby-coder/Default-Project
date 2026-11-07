/// <reference types="node" />
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CONSENT_VERSION, emptySignup, signupRow } from '@/lib/business-signup';

// The website builder is plain Node.js (CommonJS) so it runs without a build step.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildWebsite, fill, markdownToHtml, summary } = require('../../scripts/build-website');

/** The text as a browser shows it: e-mail addresses are written as character references. */
const decode = (html: string) => html.replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));

describe('website', () => {
  it('converts the Markdown the legal texts use', () => {
    const html = markdownToHtml(
      '# Titel\n\n> Note til teamet\n\nTekst med **fed** og [link](https://x.dk).\n\n- a\n- b\n\n1. en\n2. to',
    );
    expect(html).toBe(
      '<h1>Titel</h1>\n<p>Tekst med <strong>fed</strong> og <a href="https://x.dk">link</a>.</p>\n<ul><li>a</li><li>b</li></ul>\n<ol><li>en</li><li>to</li></ol>',
    );
  });

  it('refuses to publish unfilled placeholders', () => {
    expect(() => fill('Adresse: [adresse]', {}, 'x.md')).toThrow(/adresse/);
    expect(() => fill('{{ukendt}}', {}, 'x.md')).toThrow(/ukendt/);
    expect(fill('> Note med [klammer]\n{{email}}', { email: 'a@b.dk' }, 'x.md')).toContain('a@b.dk');
  });

  it('builds every page in Danish and English, filled in and without team notes', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-site-'));
    const { written, info } = buildWebsite(out);
    expect(written).toHaveLength(12);
    for (const file of written) {
      const html = fs.readFileSync(path.join(out, file), 'utf8');
      expect(html).toMatch(/<html lang="(da|en)">/);
      expect(html).not.toMatch(/\{\{|Skabelon|Template\./);
      expect(decode(html)).toContain(info.email);
      // Address harvesters looking for plain text find nothing outside the sign-up form's script.
      if (!file.includes('tilmeld') && !file.includes('sign-up')) expect(html).not.toContain(info.email);
    }
  });

  it('has what a public site needs: descriptions, sharing image, sitemap, robots.txt, 404 and headers', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-site-'));
    const { info, urls } = buildWebsite(out);
    expect(info.website).toMatch(/^https:\/\/[^/]+$/);
    expect(info.unfinished).toBe(false);
    const home = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    expect(home).toContain(`<link rel="canonical" href="${info.website}/">`);
    expect(home).toMatch(/<meta name="description" content="[^"]{50,160}">/);
    expect(home).toContain(`<meta property="og:image" content="${info.website}/icon.png">`);
    expect(fs.existsSync(path.join(out, 'icon.png'))).toBe(true);
    expect(fs.readFileSync(path.join(out, 'robots.txt'), 'utf8')).toContain(`Sitemap: ${info.website}/sitemap.xml`);
    const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
    expect(urls).toHaveLength(12);
    for (const url of urls) expect(sitemap).toContain(`<loc>${url}</loc>`);
    const notFound = fs.readFileSync(path.join(out, '404.html'), 'utf8');
    expect(notFound).toContain('<base href="/">');
    expect(notFound).toContain('noindex');
    expect(fs.readFileSync(path.join(out, '_headers'), 'utf8')).toContain('X-Content-Type-Options: nosniff');
  });

  it('describes a page with its first paragraph', () => {
    expect(summary('# Titel\n\nFørste afsnit med [et link](x) og **fed**.\n\n- punkt')).toBe(
      'Første afsnit med et link og fed.',
    );
    expect(summary(`# T\n\n${'ord '.repeat(60)}`).length).toBeLessThanOrEqual(156);
    expect(summary('Skriv til hej@fixmatch.example. Vi svarer.', 'da')).toBe('Skriv til os. Vi svarer.');
    expect(summary('Write to hej@fixmatch.example.', 'en')).toBe('Write to us.');
  });

  it('puts the business sign-up form, with the consent statements of the app, on the sign-up pages', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-site-'));
    buildWebsite(out);
    const da = fs.readFileSync(path.join(out, 'tilmeld/index.html'), 'utf8');
    const en = fs.readFileSync(path.join(out, 'en/sign-up/index.html'), 'utf8');
    expect(da).toContain('id="signup"');
    expect(da).toContain('Jeg må give samtykke på virksomhedens vegne.');
    expect(en).toContain('I am allowed to give consent on behalf of the business.');
    expect(en).toContain(`"version":"${CONSENT_VERSION}"`);
  });

  it('lets businesses ask for the Verificeret badge on the website too, with the same row as the app', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-site-'));
    buildWebsite(out);
    const da = fs.readFileSync(path.join(out, 'tilmeld/index.html'), 'utf8');
    const en = fs.readFileSync(path.join(out, 'en/sign-up/index.html'), 'utf8');
    expect(da).toContain('Ja tak, verificér os');
    expect(en).toContain('Yes, verify us');
    expect(da).toContain('name="authorization_number"');
    expect(da).toContain('"authorizationTrades":["vvs","elektriker"]');
    // Every column the app sends, the website sends too.
    for (const key of Object.keys(signupRow(emptySignup('DK')))) expect(da).toMatch(new RegExp(`\\b${key}[:,]`));
  });

  it('has a page where businesses mark free time with their personal link', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-site-'));
    buildWebsite(out);
    const da = fs.readFileSync(path.join(out, 'ledig/index.html'), 'utf8');
    const en = fs.readFileSync(path.join(out, 'en/available/index.html'), 'utf8');
    expect(da).toContain('id="availability"');
    expect(da).toContain('Ledig i dag');
    expect(en).toContain('Free today');
    expect(da).toContain('/rest/v1/rpc/set_availability');
    // The code is read from the link's #fragment, which is never sent to a server.
    expect(da).toContain("hash.get('kode')");
  });
});
