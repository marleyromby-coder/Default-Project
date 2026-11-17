import { setLanguage } from '@/i18n';
import { reviewRatingLabel } from '@/lib/review-label';

describe('what VoiceOver reads for a rating', () => {
  afterEach(() => setLanguage('da'));

  it('uses the singular for one review', () => {
    setLanguage('da');
    expect(reviewRatingLabel({ average: 4, reviews: 1 })).toBe('4,0 af 5 stjerner fra 1 bruger via FixMatch');
    expect(reviewRatingLabel({ average: 4.5, reviews: 12 })).toBe('4,5 af 5 stjerner fra 12 brugere via FixMatch');
    setLanguage('en');
    expect(reviewRatingLabel({ average: 4, reviews: 1 })).toBe('4.0 out of 5 stars from 1 user via FixMatch');
    expect(reviewRatingLabel({ average: 4.5, reviews: 12 })).toBe('4.5 out of 5 stars from 12 users via FixMatch');
  });

  it('says nothing when there are no reviews', () => {
    expect(reviewRatingLabel(undefined)).toBeUndefined();
    expect(reviewRatingLabel({ average: 0, reviews: 0 })).toBeUndefined();
  });
});
