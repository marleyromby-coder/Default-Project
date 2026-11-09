import { analyzeProblem } from './matcher';
import type { CategoryId, JobType } from './types';

/**
 * "Tjek hele tilbuddet": the text of a quote, pasted from a photo (iOS Live Text) or typed,
 * is split into lines with an amount. Each line is matched to a job FixMatch knows, so the
 * price can be compared, and the labour, materials, VAT and total lines are picked out for
 * the deduction. Everything runs on the phone.
 */
export type LineKind = 'job' | 'labour' | 'materials' | 'vat' | 'total' | 'other';

export interface QuoteLine {
  text: string;
  amount: number;
  kind: LineKind;
  category?: CategoryId;
  job?: JobType;
  quantity?: number;
}

/** The last amount on a line: "12.500,00 kr." → 12500, "1.250,-" → 1250, "25 %" → none. */
export function amountIn(line: string): number | undefined {
  const matches = [...line.matchAll(/(?<![\d,.])(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{2}))?(?!\d)\s*(?:kr\.?|dkk|,-)?/gi)];
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i];
    const after = line.slice((match.index ?? 0) + match[0].length).trimStart();
    // "25 %" or "3 stk." is a rate or a count, and "7. november" is a date, not a price.
    if (/^(%|stk|timer?|m2|m²|pcs)/i.test(after)) continue;
    if (/^\.\s*[^\d\s]/.test(line.slice((match.index ?? 0) + match[0].length))) continue;
    const whole = Number(match[1].replace(/\./g, ''));
    // Nothing on a quote costs less than 50 kr.; smaller numbers are counts or item numbers.
    if (!Number.isFinite(whole) || whole < 50) continue;
    // A 4-digit year or an 8-digit CVR number is not a price either.
    if (/^(19|20)\d{2}$/.test(match[1]) && !match[2]) continue;
    if (/^\d{8}$/.test(match[1])) continue;
    return whole;
  }
  return undefined;
}

function kindOf(text: string, job: JobType | undefined): LineKind {
  const lower = text.toLowerCase();
  if (/\b(i alt|total|at betale|samlet|sum)\b/.test(lower)) return 'total';
  if (/\bmoms\b|\bvat\b/.test(lower)) return 'vat';
  if (job) return 'job';
  if (/arbejdsl[øo]n|\btimer?\b|timepris|montering|arbejde|labour|labor/.test(lower)) return 'labour';
  if (/material|varer|dele|reservedele|parts/.test(lower)) return 'materials';
  return 'other';
}

export function parseQuoteLines(text: string): QuoteLine[] {
  return text
    .split(/\r?\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const amount = amountIn(line);
      if (!amount) return [];
      const analysis = analyzeProblem(line.replace(/[\d.,]+\s*(kr\.?|dkk|,-)?/gi, ' '));
      const job = analysis.job;
      const kind = kindOf(line, job);
      return [
        {
          text: line,
          amount,
          kind,
          category: kind === 'job' ? analysis.category?.id : undefined,
          job: kind === 'job' ? job : undefined,
          quantity: kind === 'job' ? analysis.quantity : undefined,
        },
      ];
    });
}

export interface QuoteSummary {
  /** The total on the quote: the "i alt" line, else the sum of the other lines. */
  total: number;
  /** Labour found on the quote, for the deduction. */
  labour: number;
  materials: number;
  /** Whether VAT was mentioned, so the user knows if the prices include it. */
  mentionsVat: boolean;
}

export function summarizeQuote(lines: QuoteLine[]): QuoteSummary {
  const totalLine = lines.filter((l) => l.kind === 'total').sort((a, b) => b.amount - a.amount)[0];
  const items = lines.filter((l) => l.kind !== 'total' && l.kind !== 'vat');
  return {
    total: totalLine?.amount ?? items.reduce((sum, l) => sum + l.amount, 0),
    labour: lines.filter((l) => l.kind === 'labour').reduce((sum, l) => sum + l.amount, 0),
    materials: lines.filter((l) => l.kind === 'materials').reduce((sum, l) => sum + l.amount, 0),
    mentionsVat: lines.some((l) => l.kind === 'vat') || /moms/i.test(lines.map((l) => l.text).join(' ')),
  };
}
