import demo from '@/data/demo-businesses.json';
import { emptySignup, signupErrors, signupRow } from '@/lib/business-signup';
import { parseBusinesses } from '@/lib/data-source';
import { MAX_REVIEW_LINKS, parseReviewLinks, reviewSiteOf, splitReviewLinks } from '@/lib/review-links';

// "Se anmeldelser andre steder": plain links to the business's own profiles, on fixed sites only.
const GOOGLE = 'https://www.google.com/maps/place/Kobberbladet+VVS';
const SHORT = 'https://maps.app.goo.gl/AbC123';
const PAGE = 'https://g.page/kobberbladet-vvs';
const TP = 'https://dk.trustpilot.com/review/kobberbladet.dk';
const AH = 'https://www.anmeldhaandvaerker.dk/firma/kobberbladet-vvs';

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
