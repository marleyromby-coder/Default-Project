import { setLanguage } from '@/i18n';
import { getMarket } from '@/lib/markets';
import { projectBrief } from '@/lib/project-brief';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const dk = getMarket('DK');

describe('projectBrief', () => {
  afterEach(() => setLanguage('da'));

  it('collects the trade, job, quantity, place, timing, budget and description', () => {
    const brief = projectBrief({
      trade: 'Maler',
      job: { name: 'Male stue', unit: 'm2' },
      quantity: 40,
      budget: 12000,
      urgent: true,
      text: '  Loft og vægge i stuen  ',
      place: '8000 Aarhus C',
      market: dk,
    });
    const lines = brief.split('\n');
    expect(lines[0]).toBe('Min opgave · FixMatch');
    expect(lines).toContain('Fag: Maler');
    expect(lines).toContain('Opgave: Male stue');
    expect(lines).toContain('Antal: 40 m²');
    expect(lines).toContain('Sted: 8000 Aarhus C');
    expect(lines).toContain('Tidspunkt: Det haster');
    expect(brief).toMatch(/Budget: 12\.000 kr\. inkl\. moms/);
    expect(lines).toContain('Loft og vægge i stuen');
    expect(lines[lines.length - 1]).toMatch(/^Bed om en samlet pris med materialer og kørsel \(inkl\. moms\)/);
  });

  it('leaves out what the user did not give', () => {
    const brief = projectBrief({ trade: 'VVS', urgent: false, text: '', market: dk });
    expect(brief).toContain('Opgave: Ved ikke');
    expect(brief).toContain('Tidspunkt: Jeg er fleksibel');
    expect(brief).not.toMatch(/Antal|Sted|Budget/);
    expect(brief).toContain('Beskrivelse:\n—');
  });

  it('does not count jobs priced per job', () => {
    const brief = projectBrief({
      trade: 'VVS',
      job: { name: 'Stoppet afløb', unit: 'opgave' },
      quantity: 1,
      urgent: false,
      text: 'Køkkenvasken',
      market: dk,
    });
    expect(brief).not.toContain('Antal');
  });

  it('is translated to English', () => {
    setLanguage('en');
    const brief = projectBrief({ trade: 'Plumber', urgent: false, text: 'Sink', market: dk });
    expect(brief.split('\n')[0]).toBe('My project · FixMatch');
    expect(brief).toContain('Timing: I’m flexible');
    expect(brief).toContain('Trade: Plumber');
    expect(brief).toContain("Job: Don't know");
    expect(brief).toMatch(/including materials and travel \(incl\. VAT\)/);
  });
});
