/// <reference types="node" />
import path from 'node:path';

import demo from '@/data/demo-businesses.json';
import places from '@/data/places.json';
import { emptySignup, signupErrors, signupRow } from '@/lib/business-signup';
import { parseBusinesses } from '@/lib/data-source';
import { MAX_REVIEW_LINKS, parseReviewLinks, reviewSiteOf, splitReviewLinks } from '@/lib/review-links';

// The website form and the CSV import are plain Node.js (CommonJS).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const web = require('../../scripts/lib/signup-form');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const csv = require('../../scripts/lib/business-csv');

// "Se anmeldelser andre steder": plain links to the business's own profiles, on fixed sites only.
const GOOGLE = 'https://www.google.com/maps/place/Kobberbladet+VVS';
const SHORT = 'https://maps.app.goo.gl/AbC123';
const PAGE = 'https://g.page/kobberbladet-vvs';
const TP = 'https://dk.trustpilot.com/review/kobberbladet.dk';
const AH = 'https://www.anmeldhaandvaerker.dk/firma/kobberbladet-vvs';
// What a browser shows for a Google business profile: commas between the map position and zoom.
const MAPS =
  'https://www.google.com/maps/place/Kobberbladet+VVS/@55.7303212,12.3632145,17z/data=!3m1!4b1!4m6!3m5!1s0x4652508e1e5d1f2b:0x8f5e2c1a3b4d5e6f!8m2!3d55.7303212!4d12.3657894!16s%2Fg%2F11c1q2w3e4?entry=ttu';

describe('review links', () => {
  it('accepts profiles on the allowed sites', () => {
    expect(reviewSiteOf(GOOGLE)?.id).toBe('google');
    expect(reviewSiteOf(SHORT)?.id).toBe('google');
    expect(reviewSiteOf(PAGE)?.id).toBe('google');
    expect(reviewSiteOf('https://www.google.dk/maps/search/?api=1&query=Kobberbladet')?.id).toBe('google');
    expect(reviewSiteOf(TP)?.name).toBe('Trustpilot');
    expect(reviewSiteOf('https://www.trustpilot.com/review/kobberbladet.dk')?.id).toBe('trustpilot');
    expect(reviewSiteOf(AH)?.name).toBe('Anmeld Håndværker');
    expect(reviewSiteOf('HTTPS://G.PAGE/Kobberbladet')?.id).toBe('google');
  });

  it('refuses other hosts, other pages, http and tricks', () => {
    for (const url of [
      'http://g.page/kobberbladet',
      'https://g.page/',
      'https://g.page.evil.example/x',
      'https://evil.example/https://g.page/x',
      'https://www.google.com/search?q=kobberbladet',
      'https://www.google.com/maps@evil.example/x',
      'https://dk.trustpilot.com/categories/plumber',
      'https://uk.trustpilot.com/review/kobberbladet.dk',
      'javascript:alert(1)',
      'https://g.page/a b',
      'https://g.page/"><script>',
      `https://g.page/${'x'.repeat(400)}`,
      42,
      undefined,
    ]) {
      expect({ url, site: reviewSiteOf(url)?.id }).toEqual({ url, site: undefined });
    }
  });

  it('keeps valid links from data, without duplicates, and takes the site from the link', () => {
    const links = parseReviewLinks([
      { site: 'trustpilot', url: GOOGLE },
      { site: 'google', url: GOOGLE },
      'http://evil.example',
      { url: 'https://evil.example/review' },
      TP,
      null,
      { site: 'google', url: SHORT },
      { site: 'anmeldhaandvaerker', url: AH },
    ]);
    expect(links).toEqual([
      { site: 'google', url: GOOGLE },
      { site: 'trustpilot', url: TP },
      { site: 'google', url: SHORT },
    ]);
    expect(links).toHaveLength(MAX_REVIEW_LINKS);
    expect(parseReviewLinks('not a list')).toEqual([]);
  });

  it('checks the links again when listings are read', () => {
    const [business] = parseBusinesses(
      [
        {
          ...demo[0],
          reviewLinks: [
            { site: 'google', url: PAGE },
            { site: 'google', url: 'https://evil.example' },
          ],
        },
      ],
      true,
    );
    expect(business.reviewLinks).toEqual([{ site: 'google', url: PAGE }]);
    const [none] = parseBusinesses([{ ...demo[0], reviewLinks: [{ site: 'x', url: 'https://evil.example' }] }], true);
    expect(none.reviewLinks).toBeUndefined();
  });

  it('reads links typed into a form', () => {
    expect(splitReviewLinks(` g.page/kobberbladet-vvs,\n${TP} `)).toEqual([PAGE, TP]);
    expect(splitReviewLinks('')).toEqual([]);
  });

  it('keeps the commas in a Google Maps link and splits on commas between links only', () => {
    expect(splitReviewLinks(MAPS)).toEqual([MAPS]);
    expect(reviewSiteOf(MAPS)?.id).toBe('google');
    expect(splitReviewLinks(`${MAPS}, ${TP}`)).toEqual([MAPS, TP]);
    expect(splitReviewLinks(`${MAPS},${TP}`)).toEqual([MAPS, TP]);
    expect(splitReviewLinks(`${MAPS},www.anmeldhaandvaerker.dk/firma/kobberbladet-vvs | ${PAGE}`)).toEqual([
      MAPS,
      AH,
      PAGE,
    ]);
  });

  it('makes the scheme and host lower case, but not the path', () => {
    expect(splitReviewLinks('Https://DK.Trustpilot.com/review/Kobberbladet.dk')).toEqual([
      'https://dk.trustpilot.com/review/Kobberbladet.dk',
    ]);
    expect(splitReviewLinks('WWW.Google.com/maps/place/Kobberbladet+VVS')).toEqual([
      'https://www.google.com/maps/place/Kobberbladet+VVS',
    ]);
  });
});

describe('review links in the business sign-up', () => {
  const complete = () => ({
    ...emptySignup('DK'),
    companyName: 'Kobberbladet VVS',
    registryNumber: '12345678',
    trades: ['vvs' as const],
    street: 'Stationsvej 12',
    postalCode: '2200',
    city: 'København N',
    phone: '+45 10 10 10 10',
    email: 'hej@kobberbladet.example',
    hourlyMin: '650',
    contactName: 'Sam Hansen',
    consent: { listing: true, accurate: true, authority: true },
  });

  it('is optional and sends no links when the field is empty', () => {
    expect(signupErrors(complete())).toEqual({});
    expect(signupRow(complete()).review_links).toBeNull();
  });

  it('sends allowed links and refuses others', () => {
    const signup = { ...complete(), reviewLinks: `g.page/kobberbladet-vvs ${TP}` };
    expect(signupErrors(signup)).toEqual({});
    expect(signupRow(signup).review_links).toEqual([PAGE, TP]);
    expect(signupErrors({ ...complete(), reviewLinks: 'https://evil.example/anmeldelser' }).reviewLinks).toMatch(
      /Google, Trustpilot, Anmeld Håndværker/,
    );
    expect(signupErrors({ ...complete(), reviewLinks: [GOOGLE, SHORT, PAGE, AH].join(' ') }).reviewLinks).toBe(
      'Højst 3 links.',
    );
  });
});

describe('review links on the app, the website and the CSV import', () => {
  const root = path.join(__dirname, '../..');
  const typed = [
    MAPS,
    `${MAPS}, ${TP}`,
    `Https://G.Page/Kobberbladet-VVS,${MAPS}`,
    ` g.page/kobberbladet-vvs,\n${TP} `,
    `${AH} | ${MAPS}`,
    'www.google.dk/maps/place/Kobberbladet,+Stationsvej+12,+2200+K%C3%B8benhavn',
    '',
  ];

  it('splits typed links the same way in the app and on the website', () => {
    for (const text of typed)
      expect({ text, links: web.splitReviewLinks(text) }).toEqual({ text, links: splitReviewLinks(text) });
  });

  it('saves links the database takes, and the CSV import reads them back unchanged', () => {
    const context = { places, jobsByCategory: {}, photoKeys: [], today: '2026-11-17' };
    const header = 'navn;kategorier;cvr;telefon;postnummer;timepris_min;samtykke_dato;anmeldelseslinks';
    for (const text of typed.filter(Boolean)) {
      const signup = { ...emptySignup('DK'), reviewLinks: text };
      const links = signupRow(signup).review_links as string[];
      expect(signupErrors(signup).reviewLinks).toBeUndefined();
      // The CHECK on business_signups.review_links (supabase/migrations/20261117120000_review_links.sql).
      expect(links.join(' ')).toMatch(/^https:\/\/[^ ]+( https:\/\/[^ ]+)*$/);
      // The export view joins the links with '|' for the CSV column anmeldelseslinks.
      const { business, errors } = csv.rowToBusiness(
        csv.parseCsv(`${header}\nTest VVS;vvs;12345674;22334455;2200;550;2026-11-01;"${links.join('|')}"`)[0],
        context,
      );
      expect(errors).toEqual([]);
      expect(business.reviewLinks.map((link: { url: string }) => link.url)).toEqual(links);
    }
  });

  it('lets three links of the longest allowed length fit in the website field', () => {
    const html: string = web.signupForm('da', { root, email: 'hej@fixmatch.example' });
    const maxlength = Number(html.match(/name="review_links"[^>]*maxlength="(\d+)"/)?.[1]);
    expect(maxlength).toBeGreaterThanOrEqual(3 * 300 + 2);
  });
});
