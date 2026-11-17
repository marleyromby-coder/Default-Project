import { fetchReviewPage, loadNextPage, type Pages, REVIEW_PAGE_SIZE, type Review } from '@/state/community';

// public_reviews on the server, newest first, and the ranges the app asked for.
const mockRows: { id: number; business_id: string; rating: number; created_at: string; initial: string }[] = [];
const mockRanges: [number, number][] = [];
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      getSession: async () => ({ data: { session: null } }),
    },
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        range: async (from: number, to: number) => {
          mockRanges.push([from, to]);
          return { data: mockRows.slice(from, to + 1), error: null };
        },
      };
      return query;
    },
  },
}));

function serverWith(count: number) {
  mockRows.length = 0;
  mockRanges.length = 0;
  for (let i = 0; i < count; i++) {
    mockRows.push({ id: count - i, business_id: 'live', rating: 1 + (i % 5), created_at: '2026-11-01', initial: 'A' });
  }
}

/** What "Alle anmeldelser" does while the user scrolls to the end, page by page. */
async function readAll(): Promise<Pages<Review>> {
  let pages: Pages<Review> = { items: [], done: false };
  while (!pages.done) pages = await loadNextPage(pages.items, (from) => fetchReviewPage('live', from));
  return pages;
}

describe('Alle anmeldelser', () => {
  it('reads 50 reviews at a time until a page comes back with fewer', async () => {
    expect(REVIEW_PAGE_SIZE).toBe(50);
    serverWith(120);
    const pages = await readAll();
    expect(mockRanges).toEqual([
      [0, 49],
      [50, 99],
      [100, 149],
    ]);
    expect(pages.items).toHaveLength(120);
    expect(pages.items.map((review) => review.id)).toEqual(mockRows.map((row) => String(row.id)));
    // The bad ones too.
    expect(pages.items.filter((review) => review.rating === 1)).toHaveLength(24);
  });

  it('asks once more after a full last page, and stops on an empty one', async () => {
    serverWith(100);
    expect((await readAll()).items).toHaveLength(100);
    expect(mockRanges).toHaveLength(3);
    serverWith(0);
    expect(await readAll()).toEqual({ items: [], done: true });
    expect(mockRanges).toEqual([[0, 49]]);
  });

  it('keeps what was loaded when the next page is short', async () => {
    const first = await loadNextPage([], async () => ['a', 'b'], 2);
    expect(first).toEqual({ items: ['a', 'b'], done: false });
    expect(await loadNextPage(first.items, async (from) => (from === 2 ? ['c'] : []), 2)).toEqual({
      items: ['a', 'b', 'c'],
      done: true,
    });
  });
});
