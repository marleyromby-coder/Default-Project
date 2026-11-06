import { CONSENT_VERSION, emptySignup, signupErrors, signupRow } from '@/lib/business-signup';

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
  website: 'kobberbladet.example',
  hourlyMin: '650',
  hourlyMax: '795',
  calloutFee: '',
  contactName: 'Sam Hansen',
  consent: { listing: true, accurate: true, authority: true },
});

describe('business sign-up', () => {
  it('accepts a complete sign-up', () => {
    expect(signupErrors(complete())).toEqual({});
  });

  it('asks for the required details and all three consents', () => {
    const errors = signupErrors(emptySignup('DK'));
    expect(Object.keys(errors).sort()).toEqual(
      [
        'city',
        'companyName',
        'consent',
        'contactName',
        'email',
        'hourlyMin',
        'phone',
        'postalCode',
        'registryNumber',
        'street',
        'trades',
      ].sort(),
    );
    expect(
      signupErrors({ ...complete(), consent: { listing: true, accurate: true, authority: false } }).consent,
    ).toBeDefined();
  });

  it('checks the prices', () => {
    expect(signupErrors({ ...complete(), hourlyMax: '50' }).hourlyMax).toBeDefined();
    expect(signupErrors({ ...complete(), country: 'GB' }).country).toBeDefined(); // not launched yet
    expect(signupErrors({ ...complete(), hourlyMin: '1.200', hourlyMax: '' })).toEqual({});
    expect(signupErrors({ ...complete(), calloutFee: 'gratis' }).calloutFee).toBeDefined();
  });

  it('stores the consent with its wording and version', () => {
    const row = signupRow({ ...complete(), hourlyMin: '1.200', hourlyMax: '' });
    expect(row).toMatchObject({
      country: 'DK',
      website: 'https://kobberbladet.example',
      hourly_min: 1200,
      hourly_max: 1200,
      callout_fee: null,
      consent_version: CONSENT_VERSION,
    });
    expect(row.consent.listing && row.consent.accurate && row.consent.authority).toBe(true);
    expect(Object.keys(row.consent.statements)).toEqual(['listing', 'accurate', 'authority']);
  });
});
