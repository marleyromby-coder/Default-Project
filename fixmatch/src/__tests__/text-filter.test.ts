import en from '@/i18n/en';
import { findTextProblem, TEXT_PROBLEM_MESSAGES } from '@/lib/text-filter';
import { hiddenSnapshot, hideContent, reportContent, resetReports } from '@/state/reports';

describe('text filter', () => {
  it('lets ordinary reviews and group notes through', () => {
    for (const text of [
      '',
      'Kom til tiden, gav fast pris og ryddede op efter sig. Han kan sit fag.',
      'Til slut kostede det 12 500 kr. inkl. moms, og de kom den 17-11-2026.',
      'Vi er to huse på Stefansgade 12, der vil have renset tagrender inden vinter.',
      'Pikant lille opgave, men de klarede det. Godt arbejde.De kom til tiden.',
      'Great job on the boiler service, fair price and very tidy.',
    ]) {
      expect(findTextProblem(text)).toBeUndefined();
    }
  });

  it('stops slurs and obscenities in Danish and English', () => {
    expect(findTextProblem('Sikke noget fucking lort')).toBe('offensive');
    expect(findTextProblem('Han er en kælling')).toBe('offensive');
    expect(findTextProblem('Din PERKER')).toBe('offensive');
    expect(findTextProblem('what a bastard')).toBe('offensive');
    expect(findTextProblem('Total asshole')).toBe('offensive');
  });

  it('stops phone numbers', () => {
    expect(findTextProblem('Ring til mig på 12 34 56 78')).toBe('phone');
    expect(findTextProblem('Mit nummer er +45 12345678')).toBe('phone');
  });

  it('stops links and e-mail addresses', () => {
    expect(findTextProblem('Se mere på https://example.com')).toBe('link');
    expect(findTextProblem('Gå ind på www.billighaandvaerker.dk')).toBe('link');
    expect(findTextProblem('Skriv til mig på naboen@mail.dk')).toBe('link');
    expect(findTextProblem('Brug hellere tagrens.dk')).toBe('link');
  });

  it('has a translated message for every problem', () => {
    for (const message of Object.values(TEXT_PROBLEM_MESSAGES)) expect(en[message]).toBeTruthy();
  });
});

describe('Rapportér', () => {
  beforeEach(() => resetReports());

  it('hides the item on this phone once, newest first', () => {
    hideContent('review', 'r1');
    hideContent('group', 'g1');
    hideContent('review', 'r1');
    expect(hiddenSnapshot()).toEqual(['group:g1', 'review:r1']);
  });

  it('never sends demo content anywhere, but still hides it', async () => {
    const how = await reportContent(
      { kind: 'group', id: 'demo-tagrender', subject: 'Rapportér', body: 'Gruppen' },
      'Krænkende eller grov',
    );
    expect(how).toBe('local');
    expect(hiddenSnapshot()).toContain('group:demo-tagrender');
  });
});
