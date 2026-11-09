import { makeBusiness } from '@/__fixtures__/business';
import {
  answerCall,
  answerRateOf,
  answerRateText,
  callToAskAbout,
  demoAnswerRate,
  MIN_ANSWERS,
  rememberCall,
  resetAnswers,
} from '@/state/answers';

describe('Fik du fat i dem?', () => {
  beforeEach(() => resetAnswers());

  it('asks only when the user comes back soon after the call, but not at once', () => {
    const business = makeBusiness({ id: 'b' });
    rememberCall(business);
    const started = Date.now();
    expect(callToAskAbout(started + 2_000)).toBeNull();
    expect(callToAskAbout(started + 60_000)?.businessId).toBe('b');
    expect(callToAskAbout(started + 2 * 60 * 60_000)).toBeNull();
    // Too old: forgotten for good.
    expect(callToAskAbout(started + 60_000)).toBeNull();
  });

  it('counts the user’s own answers until the server has them, and shows a rate from 5 answers', async () => {
    const business = makeBusiness({ id: 'b' });
    expect(answerRateOf(business)).toBeUndefined();
    for (let i = 0; i < MIN_ANSWERS - 1; i += 1) await answerCall(business, true, undefined);
    expect(answerRateText(answerRateOf(business))).toBeUndefined();
    await answerCall(business, false, undefined);
    expect(answerRateOf(business)).toEqual({ answered: 4, total: 5 });
    expect(answerRateText(answerRateOf(business))).toEqual({ answered: 8, outOf: 10 });
  });

  it('makes up rates for demo businesses only', () => {
    expect(demoAnswerRate(makeBusiness({ id: 'real' }))).toBeUndefined();
    const demos = Array.from({ length: 30 }, (_, i) => demoAnswerRate(makeBusiness({ id: `d${i}`, demo: true })));
    const withRate = demos.filter(Boolean);
    expect(withRate.length).toBeGreaterThan(15);
    for (const rate of withRate) expect(rate!.answered).toBeLessThanOrEqual(rate!.total);
  });
});
