import { CONSENT_VERSION, emptySignup, signupErrors, signupRow } from '@/lib/business-signup';

const complete = () => ({
  ...emptySignup('GB'),
  companyName: 'Copperleaf Plumbing',
  registryNumber: '12345678',
  trades: ['vvs' as const],
  street: '12 Station Road',
  postalCode: 'N1 8XX',
  city: 'London',
  phone: '+44 20 7946 0000',
  email: 'hello@copperleaf.example',
  website: 'copperleaf.example',
  hourlyMin: '75',
  hourlyMax: '95',
  calloutFee: '',
  contactName: 'Sam Taylor',
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
    expect(signupErrors({ ...complete(), hourlyMin: '1.200', hourlyMax: '' })).toEqual({});
    expect(signupErrors({ ...complete(), calloutFee: 'gratis' }).calloutFee).toBeDefined();
  });

  it('stores the consent with its wording and version', () => {
    const row = signupRow({ ...complete(), hourlyMin: '1.200', hourlyMax: '' });
    expect(row).toMatchObject({
      country: 'GB',
      website: 'https://copperleaf.example',
      hourly_min: 1200,
      hourly_max: 1200,
      callout_fee: null,
      consent_version: CONSENT_VERSION,
    });
    expect(row.consent.listing && row.consent.accurate && row.consent.authority).toBe(true);
    expect(Object.keys(row.consent.statements)).toEqual(['listing', 'accurate', 'authority']);
  });
});
