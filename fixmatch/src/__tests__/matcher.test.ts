import {
  analyzeProblem,
  fitForPrice,
  matchBudget,
  parseBudget,
  parseQuantity,
  PROBLEM_EXAMPLES,
  wordMatches,
} from '@/lib/matcher';
import { scoreBusinesses } from '@/lib/ranking';
import { getCategory } from '@/data/categories';
import { loose } from '@/lib/text';

import { makeBusiness } from '@/__fixtures__/business';

const ORIGIN = { lat: 55.6941, lon: 12.5486 };

describe('analyzeProblem', () => {
  it.each([
    ['Køkkenvasken er stoppet, og vandet løber ikke ud', 'vvs', 'stoppet-afloeb'],
    ['Ladestander til elbilen – budget 8.000 kr.', 'elektriker', 'ladestander'],
    ['Bilen skal have stort service, max 3.500 kr.', 'mekaniker', 'stort-service'],
    ['Jeg er låst ude, det haster', 'laasesmed', 'doeroplukning'],
    ['Nyt trægulv i stuen, ca. 25 m²', 'toemrer', 'gulv'],
    ['Taget er utæt, det drypper fra loftet', 'tagdaekker', 'tagreparation'],
    ['Sikringen springer hele tiden', 'elektriker', 'fejlsoegning'],
    ['Motorlampen lyser på min bil', 'mekaniker', 'fejlkode'],
    ['Vi skal have nye fliser på badeværelset', 'murer', 'fliser'],
    ['Stuen skal males', 'maler', undefined],
  ])('reads "%s"', (text, category, job) => {
    const result = analyzeProblem(text);
    expect(result.category?.id).toBe(category);
    expect(result.job?.id).toBe(job);
  });

  it('understands every example shown in the app', () => {
    for (const text of PROBLEM_EXAMPLES) expect(analyzeProblem(text).category).toBeDefined();
  });

  it('picks up budget, size and urgency from the text', () => {
    const floor = analyzeProblem('Nyt trægulv i stuen, ca. 25 m², budget 12.000 kr.');
    expect(floor.quantity).toBe(25);
    expect(floor.budget).toBe(12000);
    expect(analyzeProblem('Jeg er låst ude, det haster').urgent).toBe(true);
    expect(analyzeProblem('Ny stikkontakt i køkkenet').urgent).toBe(false);
  });

  it('returns nothing for text it does not understand', () => {
    expect(analyzeProblem('hej med dig').category).toBeUndefined();
    expect(analyzeProblem('').category).toBeUndefined();
  });

  it('does not match short keywords inside unrelated words', () => {
    expect(wordMatches(loose('elsker'), 'el')).toBe(false);
    expect(wordMatches(loose('synes'), 'syn')).toBe(false);
    expect(wordMatches(loose('synet'), 'syn')).toBe(true);
    expect(wordMatches(loose('stikket'), 'stik')).toBe(true);
    expect(wordMatches(loose('køkkenvasken'), 'vask')).toBe(true);
  });
});

describe('parseBudget', () => {
  it.each([
    ['budget 5.000 kr.', 5000],
    ['max 3500', 3500],
    ['maks 3.500, tak', 3500],
    ['under 2.000,-', 2000],
    ['højst 8k', 8000],
    ['det må koste 1 200 kroner', 1200],
    ['budgettet er 15.000', 15000],
  ])('reads "%s"', (text, amount) => {
    expect(parseBudget(text)).toBe(amount);
  });

  it('ignores sizes and small numbers', () => {
    expect(parseBudget('under 120 m²')).toBeUndefined();
    expect(parseBudget('3 vinduer i stuen')).toBeUndefined();
    expect(parseBudget('bilen er fra 2015')).toBeUndefined();
  });
});

describe('parseQuantity', () => {
  it('reads square metres and pieces', () => {
    expect(parseQuantity('ca. 25 m²', 'm2')).toBe(25);
    expect(parseQuantity('40 kvm terrasse', 'm2')).toBe(40);
    expect(parseQuantity('tre nye vinduer', 'stk')).toBe(3);
    expect(parseQuantity('2 vinduer', 'stk')).toBe(2);
    expect(parseQuantity('stort service', 'opgave')).toBeUndefined();
  });
});

describe('matchBudget', () => {
  const job = getCategory('vvs')!.jobs.find((j) => j.id === 'stoppet-afloeb')!;
  const price = (min: number, max: number) => ({
    hourlyMin: 500,
    hourlyMax: 600,
    examples: [{ job: job.id, label: job.name, min, max, unit: job.unit }],
    updatedAt: '2026-10-01',
  });
  const businesses = [
    makeBusiness({ id: 'cheap', pricing: price(1000, 1800) }),
    makeBusiness({ id: 'maybe', pricing: price(1500, 2600) }),
    makeBusiness({ id: 'close', pricing: price(2200, 3000) }),
    makeBusiness({ id: 'over', pricing: price(4000, 6000) }),
    makeBusiness({ id: 'noprice' }),
    makeBusiness({ id: 'other-trade', categories: ['elektriker'] }),
  ];

  it('groups by how well the price fits the budget', () => {
    const scored = scoreBusinesses(businesses, ORIGIN, {
      price: 3,
      distance: 3,
      reviews: 3,
    });
    const result = matchBudget({ category: 'vvs', job, budget: 2000 }, scored);
    expect(result.map((r) => [r.business.id, r.fit])).toEqual([
      ['cheap', 'within'],
      ['maybe', 'maybe'],
      ['close', 'close'],
      ['noprice', 'unknown'],
      ['over', 'over'],
    ]);
    expect(result.find((r) => r.business.id === 'close')?.overBy).toBeCloseTo(0.1);
    expect(result.some((r) => r.business.id === 'other-trade')).toBe(false);
  });

  it('multiplies prices per m² by the size', () => {
    const gulv = getCategory('toemrer')!.jobs.find((j) => j.id === 'gulv')!;
    const floorer = makeBusiness({
      id: 'floor',
      categories: ['toemrer'],
      pricing: {
        ...price(0, 0),
        examples: [{ job: 'gulv', label: 'Gulv', min: 400, max: 600, unit: 'm2' }],
      },
    });
    const scored = scoreBusinesses([floorer], ORIGIN, {
      price: 3,
      distance: 3,
      reviews: 3,
    });
    const [match] = matchBudget({ category: 'toemrer', job: gulv, quantity: 25, budget: 12000 }, scored);
    expect(match.price).toEqual({ min: 10000, max: 15000 });
    expect(match.fit).toBe('maybe');
  });

  it('puts døgnvagt first when it is urgent', () => {
    const list = [
      makeBusiness({ id: 'day', pricing: price(1000, 1500) }),
      makeBusiness({
        id: 'night',
        pricing: price(1000, 1500),
        emergency: true,
      }),
    ];
    const scored = scoreBusinesses(list, ORIGIN, {
      price: 3,
      distance: 3,
      reviews: 3,
    });
    expect(matchBudget({ category: 'vvs', job, budget: 2000, urgent: true }, scored)[0].business.id).toBe('night');
  });

  it('marks fit as unknown without a budget', () => {
    expect(fitForPrice({ min: 100, max: 200 }, undefined).fit).toBe('unknown');
    expect(fitForPrice({ min: 2500, max: 3000 }, 2000).fit).toBe('over');
  });
});
