/// <reference types="node" />
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CONSENT_VERSION } from '@/lib/business-signup';

// The website builder is plain Node.js (CommonJS) so it runs without a build step.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildWebsite, fill, markdownToHtml } = require('../../scripts/build-website');

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
    expect(written).toHaveLength(10);
    for (const file of written) {
      const html = fs.readFileSync(path.join(out, file), 'utf8');
      expect(html).toMatch(/<html lang="(da|en)">/);
      expect(html).not.toMatch(/\{\{|Skabelon|Template\./);
      expect(html).toContain(info.email);
    }
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
});
