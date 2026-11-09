import { WARNING_LAMPS } from '@/data/warning-lamps';
import { GREEN_MEASURES, greenBenefit } from '@/lib/green';
import { defaultDeduction, type HomeJob, reminders, yearDeduction } from '@/lib/home-log';
import { amountIn, parseQuoteLines, summarizeQuote } from '@/lib/quote-lines';

const job = (overrides: Partial<HomeJob>): HomeJob => ({
  id: 'j',
  businessName: 'Fjordvand VVS',
  category: 'vvs',
  title: 'Nyt toilet',
  date: '2026-03-10',
  total: 6000,
  photos: [],
  deduction: 'none',
  ...overrides,
});

describe('Min bolig', () => {
  it('adds up the deduction per year with the caps per adult', () => {
    const jobs = [
      job({ id: 'a', deduction: 'green', labour: 7000 }),
      job({ id: 'b', deduction: 'green', labour: 5000, date: '2026-09-01' }),
      job({ id: 'c', deduction: 'service', labour: 2000 }),
      job({ id: 'd', deduction: 'green', labour: 9000, date: '2025-09-01' }),
      job({ id: 'e', deduction: 'green', total: 3000 }),
    ];
    const one = yearDeduction(jobs, 2026, 1);
    expect(one).toMatchObject({
      greenLabour: 12000,
      serviceLabour: 2000,
      deduction: 11000,
      saving: 2860,
      capped: true,
    });
    const two = yearDeduction(jobs, 2026, 2);
    expect(two).toMatchObject({ deduction: 14000, capped: false });
    expect(yearDeduction(jobs, 2025).deduction).toBe(9000);
  });

  it('reminds about inspections on building work and about guarantees', () => {
    const list = reminders(
      [
        job({ id: 'big', category: 'toemrer', total: 60000, date: '2026-01-15', guaranteeYears: 2 }),
        job({ id: 'small', category: 'toemrer', total: 2000, date: '2026-01-15' }),
        job({ id: 'old', category: 'murer', total: 90000, date: '2020-01-15' }),
      ],
      '2026-11-09',
    );
    expect(list.map((r) => [r.kind, r.due])).toEqual([
      ['inspection1', '2027-01-15'],
      ['guarantee', '2028-01-15'],
      ['inspection5', '2031-01-15'],
    ]);
    expect(defaultDeduction('toemrer', 'vindue')).toBe('green');
    expect(defaultDeduction('vvs', 'stoppet-afloeb')).toBe('none');
  });
});

describe('Tjek hele tilbuddet', () => {
  it('reads Danish amounts and skips rates, counts and years', () => {
    expect(amountIn('Udskiftning af toilet 4.800,00 kr.')).toBe(4800);
    expect(amountIn('Arbejdsløn 3 timer 1.950,-')).toBe(1950);
    expect(amountIn('Moms 25 %')).toBeUndefined();
    expect(amountIn('Tilbud af 7. november 2026')).toBeUndefined();
    expect(amountIn('CVR 12345678')).toBeUndefined();
    expect(amountIn('Fliser 12 m2 à 950 = 11.400')).toBe(11400);
  });

  it('matches lines to jobs and finds labour, VAT and the total', () => {
    const lines = parseQuoteLines(`Udskiftning af toilet 4.800,00
Arbejdsløn 3 timer 1.950,00
Materialer 2.400,00
Moms 25 % 2.287,50
I alt 11.437,50 kr.`);
    expect(lines.map((l) => l.kind)).toEqual(['job', 'labour', 'materials', 'vat', 'total']);
    expect(lines[0].job?.id).toBe('skift-toilet');
    expect(summarizeQuote(lines)).toEqual({ total: 11437, labour: 1950, materials: 2400, mentionsVat: true });
  });
});

describe('Grøn guide and warning lamps', () => {
  it('gives the deduction on the labour part and a payback time', () => {
    const pump = GREEN_MEASURES.find((m) => m.id === 'varmepumpe')!;
    const benefit = greenBenefit(pump);
    expect(benefit.taxBack).toBe(2300);
    expect(benefit.paybackYears).toBeGreaterThan(5);
    expect(benefit.paybackYears).toBeLessThan(12);
    expect(greenBenefit(GREEN_MEASURES.find((m) => m.id === 'energimaerke')!).paybackYears).toBeUndefined();
  });

  it('has a known mechanic job behind every lamp that needs a workshop', () => {
    const jobs = ['fejlkode', 'bremser', 'hjulskift'];
    for (const lamp of WARNING_LAMPS) {
      if (lamp.job) expect(jobs).toContain(lamp.job);
      if (lamp.advice === 'stop') expect(lamp.color).toBe('red');
    }
  });
});
