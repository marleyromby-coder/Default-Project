import { CATEGORIES } from '@/data/categories';
import { msg } from '@/i18n';

import { DEDUCTION_VALUE, GREEN_DEDUCTION_MAX, GREEN_JOBS } from './quote-check';
import type { CategoryId } from './types';

/**
 * "Min bolig": the jobs done on the user's home, with invoices and pictures, so the user has
 * everything in one place: what the tax deduction gives this year, when the guarantee ends,
 * and when to ask for the 1- and 5-year inspection. Everything stays on the phone.
 */
export type DeductionKind = 'green' | 'service' | 'none';

export interface HomeJob {
  id: string;
  /** The business, when it is on FixMatch; else just its name. */
  businessId?: string;
  businessName: string;
  category: CategoryId;
  /** A job id from the category, when the work matches one. */
  job?: string;
  title: string;
  /** The day the work was done or paid, YYYY-MM-DD. */
  date: string;
  /** What was paid, incl. VAT. */
  total: number;
  /** The labour part, when the invoice shows it. */
  labour?: number;
  /** Pictures of the invoice and the work, as file URIs on the phone. */
  photos: string[];
  deduction: DeductionKind;
  /** Years of guarantee the business gave, if any. */
  guaranteeYears?: number;
  notes?: string;
}

/** Servicefradrag 2026: cleaning, window cleaning, gardening etc. per adult. */
export const SERVICE_DEDUCTION_MAX = 18_300;

/** Which jobs count as green renovation (håndværkerfradrag) by default. */
export function defaultDeduction(category: CategoryId, job: string | undefined): DeductionKind {
  if (job && GREEN_JOBS.includes(job)) return 'green';
  return 'none';
}

/** Trades whose work is "byggeri": the customer should ask for a 1- and 5-year inspection. */
const BUILDING_TRADES: readonly CategoryId[] = ['toemrer', 'murer', 'tagdaekker', 'vvs', 'elektriker'];

export function hasInspections(category: CategoryId): boolean {
  return BUILDING_TRADES.includes(category);
}

function addYears(date: string, years: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export type ReminderKind = 'inspection1' | 'inspection5' | 'guarantee';

export interface Reminder {
  kind: ReminderKind;
  job: HomeJob;
  /** YYYY-MM-DD. */
  due: string;
}

export const REMINDER_TEXT: Record<ReminderKind, string> = {
  inspection1: msg('1-års gennemgang'),
  inspection5: msg('5-års gennemgang'),
  guarantee: msg('Garantien udløber'),
};

/** Upcoming dates for the jobs, nearest first; past dates are left out. */
export function reminders(jobs: HomeJob[], today: string): Reminder[] {
  const list: Reminder[] = [];
  for (const job of jobs) {
    if (hasInspections(job.category) && job.total >= 5000) {
      list.push({ kind: 'inspection1', job, due: addYears(job.date, 1) });
      list.push({ kind: 'inspection5', job, due: addYears(job.date, 5) });
    }
    if (job.guaranteeYears) list.push({ kind: 'guarantee', job, due: addYears(job.date, job.guaranteeYears) });
  }
  return list.filter((r) => r.due >= today).sort((a, b) => a.due.localeCompare(b.due));
}

export interface YearDeduction {
  year: number;
  /** Labour that counts, before the caps. */
  greenLabour: number;
  serviceLabour: number;
  /** After the caps. */
  deduction: number;
  /** About what it gives back in tax. */
  saving: number;
  /** Whether a cap was hit, so a second adult in the household could claim the rest. */
  capped: boolean;
}

/**
 * The deduction for one year: labour on green jobs up to 9,000 kr. and on service jobs up to
 * 18,300 kr. per adult, worth about 26 %. Jobs without a labour amount are not counted.
 */
export function yearDeduction(jobs: HomeJob[], year: number, adults = 1): YearDeduction {
  const inYear = jobs.filter((j) => Number(j.date.slice(0, 4)) === year && j.labour && j.labour > 0);
  const greenLabour = inYear.filter((j) => j.deduction === 'green').reduce((sum, j) => sum + (j.labour ?? 0), 0);
  const serviceLabour = inYear.filter((j) => j.deduction === 'service').reduce((sum, j) => sum + (j.labour ?? 0), 0);
  const green = Math.min(greenLabour, GREEN_DEDUCTION_MAX * adults);
  const service = Math.min(serviceLabour, SERVICE_DEDUCTION_MAX * adults);
  const deduction = green + service;
  return {
    year,
    greenLabour,
    serviceLabour,
    deduction,
    saving: Math.round((deduction * DEDUCTION_VALUE) / 10) * 10,
    capped: greenLabour > green || serviceLabour > service,
  };
}

export function totalSpent(jobs: HomeJob[], year?: number): number {
  return jobs
    .filter((j) => year === undefined || Number(j.date.slice(0, 4)) === year)
    .reduce((sum, j) => sum + j.total, 0);
}

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function isValidHomeJob(value: unknown): value is HomeJob {
  if (typeof value !== 'object' || value === null) return false;
  const j = value as Partial<HomeJob>;
  return (
    typeof j.id === 'string' &&
    typeof j.businessName === 'string' &&
    typeof j.category === 'string' &&
    typeof j.title === 'string' &&
    typeof j.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(j.date) &&
    typeof j.total === 'number' &&
    Array.isArray(j.photos) &&
    (j.deduction === 'green' || j.deduction === 'service' || j.deduction === 'none')
  );
}
