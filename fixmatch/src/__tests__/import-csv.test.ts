import places from '@/data/places.json';

// The import script is plain Node.js (CommonJS) so the team can run it without a build step.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const csv = require('../../scripts/lib/business-csv');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadJobs } = require('../../scripts/import-businesses');

const context = {
  places,
  jobsByCategory: {
    vvs: [{ id: 'stoppet-afloeb', name: 'Stoppet afløb', unit: 'opgave', keywords: ['afløb'] }],
  },
  photoKeys: ['vvs-1'],
  today: '2026-10-20',
};

const HEADER =
  'navn;kategorier;cvr;telefon;hjemmeside;postnummer;by;timepris_min;timepris_max;prisexempler;trustpilot_score;trustpilot_antal;trustpilot_url;autorisationer;aabningstider;doegnvagt;samtykke_dato';

function row(values: string) {
  return csv.parseCsv(`${HEADER}\n${values}`)[0];
}

describe('CSV import', () => {
  it('parses Danish Excel CSV with quotes and semicolons', () => {
    const rows = csv.parseCsv('navn;beskrivelse\n"A; B";"Siger ""hej"""\r\n');
    expect(rows).toEqual([{ navn: 'A; B', beskrivelse: 'Siger "hej"' }]);
  });

  it('accepts a complete, consented row', () => {
    const { business, errors } = csv.rowToBusiness(
      row(
        'Test VVS;VVS;12345674;22 33 44 55;www.test.dk;2200;København N;550;650;"Stoppet afløb=1.200-2.500";4,6;120;https://dk.trustpilot.com/review/test.dk;vvs:12345;"man-tor 07:00-15:30; fre 7-14";ja;2026-10-01',
      ),
      context,
    );
    expect(errors).toEqual([]);
    expect(business.contact).toEqual({ phone: '+4522334455', website: 'https://www.test.dk' });
    expect(business.pricing.examples).toEqual([
      { job: 'stoppet-afloeb', label: 'Stoppet afløb', min: 1200, max: 2500, unit: 'opgave' },
    ]);
    expect(business.trustpilot.score).toBe(4.6);
    expect(business.hours[0]).toEqual(['07:00', '15:30']);
    expect(business.hours[4]).toEqual(['07:00', '14:00']);
    expect(business.hours[5]).toBeNull();
    expect(business.emergency).toBe(true);
    expect(business.authorizations).toEqual([{ kind: 'vvs', number: '12345' }]);
  });

  it('refuses rows without consent', () => {
    const { errors } = csv.rowToBusiness(row('Test VVS;vvs;12345674;22334455;;2200;;550;650;;;;;vvs:1;;nej;'), context);
    expect(errors.some((e: string) => e.startsWith('Samtykke mangler'))).toBe(true);
  });

  it('explains bad data in Danish', () => {
    const { errors } = csv.rowToBusiness(
      row(';snedker x;123;1234;ftp://x;9999;;50;40;;7;;http://evil.example;;;;2026-10-01'),
      context,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        'Navn mangler',
        'CVR skal være 8 cifre',
        'Telefonnummer skal være et dansk nummer med 8 cifre',
        'Postnummer skal være et gyldigt dansk postnummer',
        'Trustpilot-score skal være mellem 1 og 5',
      ]),
    );
  });

  it('validates CVR check digits and phone numbers', () => {
    expect(csv.isValidCvr('12345674')).toBe(true);
    expect(csv.isValidCvr('12345678')).toBe(false);
    expect(csv.normalizePhone('+45 70 12 34 56')).toBe('+4570123456');
    expect(csv.normalizePhone('10203040')).toBeUndefined();
  });

  it('reads every job from the categories file', () => {
    const jobs = loadJobs();
    expect(Object.keys(jobs)).toHaveLength(8);
    expect(jobs.vvs.map((j: { id: string }) => j.id)).toContain('stoppet-afloeb');
    expect(Object.values(jobs).flat()).toHaveLength(38);
  });

  it('keeps decimals in coordinates and scores', () => {
    expect(csv.toNumber('55.676', { decimal: true })).toBe(55.676);
    expect(csv.toNumber('4,5', { decimal: true })).toBe(4.5);
    expect(csv.toNumber('1.200 kr.')).toBe(1200);
  });

  it('rejects impossible and overnight opening hours', () => {
    const errors: string[] = [];
    csv.parseHours('man 18-02; tir 25-30; ons 0-24', errors);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/doegnvagt/);
  });
});

describe('CSV import abroad', () => {
  const cities = [['London', 'GB', 51.5085, -0.1257, 8961989]];
  const header =
    'navn;kategorier;land;cvr;telefon;adresse;postnummer;by;timepris_min;timepris_max;aabningstider;samtykke_dato;samtykke_kontakt';
  const signup = (values: string) => csv.parseCsv(`${header}\n${values}`)[0];

  it('imports a sign-up from London with local phone number, currency and town', () => {
    const { business, errors, warnings } = csv.rowToBusiness(
      signup(
        'Copperleaf Plumbing;vvs;GB;12345678;020 7946 0000;12 Station Road;N1 8XX;London;75;95;"Mon-Fri 07-16; Sat-Sun closed";2026-10-30;"Sam Taylor (selvbetjent web)"',
      ),
      { ...context, cities },
    );
    expect(errors).toEqual([]);
    expect(business.country).toBe('GB');
    expect(business.cvr).toBe('12345678');
    expect(business.contact.phone).toBe('+442079460000');
    expect(business.pricing).toMatchObject({ hourlyMin: 75, hourlyMax: 95, currency: 'GBP' });
    expect(business.coords).toEqual({ lat: 51.5085, lon: -0.1257 });
    expect(business.hours[0]).toEqual(['07:00', '16:00']);
    expect(business.hours[6]).toBeNull();
    expect(warnings.some((w: string) => w.includes('byens midtpunkt'))).toBe(true);
  });

  it('checks prices in the local currency and unknown countries', () => {
    const { errors } = csv.rowToBusiness(
      signup('Dyr VVS;vvs;GB;12345678;+44 20 7946 0000;Road 1;N1;London;600;700;;2026-10-30;Sam'),
      { ...context, cities },
    );
    expect(errors.some((e: string) => e.includes('GBP'))).toBe(true);
    const unknown = csv.rowToBusiness(
      signup('X;vvs;US;123456;+1 212 555 0100;A;10001;New York;100;120;;2026-10-30;Sam'),
      {
        ...context,
        cities,
      },
    );
    expect(unknown.errors.some((e: string) => e.startsWith('Land skal være'))).toBe(true);
  });
});
