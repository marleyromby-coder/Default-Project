import { makeBusiness } from '@/__fixtures__/business';
import { REVIEW_PRIOR_MEAN, reviewValue, scoreBusinesses, sortScored } from '@/lib/ranking';
import {
  communitySnapshot,
  loadReviewSummaries,
  resetCommunityStore,
  reviewSource,
  reviewSummaryOf,
  submitReview,
  withReviews,
} from '@/state/community';

// The bulk read of review_summary, as the Supabase view returns it (average is numeric).
const mockRows: { business_id: string; average: number | string; reviews: number }[] = [];
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      getSession: async () => ({ data: { session: null } }),
    },
    from: (table: string) => ({
      select: () => ({
        limit: async () => ({ data: table === 'review_summary' ? mockRows : [], error: null }),
      }),
    }),
  },
}));

const ORIGIN = { lat: 55.6941, lon: 12.5486 };
const user = { id: undefined, name: 'Alex' };
const live = makeBusiness({ id: 'live' });
const demoBusiness = makeBusiness({ id: 'demo', demo: true, demoReviews: { average: 4, reviews: 3 } });

beforeEach(() => {
  resetCommunityStore();
  mockRows.length = 0;
});

describe('FixMatch review summaries', () => {
  it('loads every business’s average and count from the server in one go', async () => {
    mockRows.push(
      { business_id: 'live', average: '4.67', reviews: 3 },
      { business_id: 'broken', average: 'x', reviews: 2 },
    );
    await loadReviewSummaries();
    expect(communitySnapshot().summaries).toEqual({ live: { average: 4.67, reviews: 3 } });
    expect(reviewSummaryOf(live)).toEqual({ average: 4.67, reviews: 3 });
  });

  it('uses made-up reviews for demo businesses only, and the server’s numbers first', async () => {
    expect(reviewSummaryOf(demoBusiness)).toEqual({ average: 4, reviews: 3 });
    expect(reviewSummaryOf({ ...live, demoReviews: { average: 5, reviews: 9 } })).toBeUndefined();
    mockRows.push({ business_id: 'demo', average: 2, reviews: 1 });
    await loadReviewSummaries();
    expect(reviewSummaryOf(demoBusiness)).toEqual({ average: 2, reviews: 1 });
  });

  it('adds the user’s own review until the server has it, and an edited review replaces the old one', async () => {
    await submitReview({ business: demoBusiness, rating: 5 }, user);
    expect(reviewSummaryOf(demoBusiness)).toEqual({ average: 4.25, reviews: 4 });
    await submitReview({ business: demoBusiness, rating: 1 }, user);
    expect(reviewSummaryOf(demoBusiness)).toEqual({ average: 3.25, reviews: 4 });

    await submitReview({ business: live, rating: 4 }, user);
    expect(reviewSummaryOf(live)).toEqual({ average: 4, reviews: 1 });
    // Once the server has a summary, the user's review is in it.
    mockRows.push({ business_id: 'live', average: 4.5, reviews: 2 });
    await loadReviewSummaries();
    expect(reviewSummaryOf(live)).toEqual({ average: 4.5, reviews: 2 });
  });

  it('puts the summaries on the businesses, so the ranking uses them at once', async () => {
    const plain = makeBusiness({ id: 'plain', demo: true });
    const before = withReviews([plain, demoBusiness], reviewSource());
    expect(before[0].reviewSummary).toBeUndefined();
    expect(before[0]).toBe(plain); // unchanged businesses are not copied
    expect(reviewValue(before[0])).toBe(REVIEW_PRIOR_MEAN);

    // During a pitch: a 5-star review moves the business up the "Anmeldelser" sort.
    await submitReview({ business: plain, rating: 5 }, user);
    const after = withReviews(before, reviewSource());
    expect(after[0].reviewSummary).toEqual({ average: 5, reviews: 1 });
    const order = sortScored(scoreBusinesses(after, ORIGIN, { price: 1, distance: 1, reviews: 5 }), 'rating');
    expect(order.map((s) => s.business.id)).toEqual(['plain', 'demo']);
  });
});
