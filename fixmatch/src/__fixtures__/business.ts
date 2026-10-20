import type { Business } from '@/lib/types';

/** A minimal valid business for tests; override what the test is about. */
export function makeBusiness(overrides: Partial<Business> & { id: string }): Business {
  return {
    name: overrides.id,
    categories: ['vvs'],
    tagline: '',
    description: '',
    cvr: '12345678',
    address: { street: 'Testvej 1', postalCode: '2200', city: 'København N' },
    coords: { lat: 55.6941, lon: 12.5486 },
    serviceRadiusKm: 25,
    contact: { phone: '+4512345678' },
    pricing: { hourlyMin: 500, hourlyMax: 600, examples: [], updatedAt: '2026-10-01' },
    authorizations: [],
    memberships: [],
    services: [],
    hours: [['07:00', '16:00'], ['07:00', '16:00'], ['07:00', '16:00'], ['07:00', '16:00'], ['07:00', '14:00'], null, null],
    emergency: false,
    photo: 'vvs-1',
    consent: { date: '2026-09-01' },
    updatedAt: '2026-10-01',
    ...overrides,
  };
}
