import { CATEGORIES } from '@/data/categories';

import type { ScoredBusiness } from './ranking';
import { SYNONYMS } from './search';
import { loose } from './text';
import type { Category, CategoryId, JobType } from './types';

/**
 * "Beskriv dit problem": turns a free-text description and a budget into a
 * trade, a job and a list of businesses ordered by how well their own prices
 * fit the budget. Everything runs on the phone; the text is never sent anywhere.
 */

/** Everyday wording that points at a trade (and sometimes a specific job). */
const PROBLEM_PHRASES: {
  phrase: string;
  category: CategoryId;
  job?: string;
}[] = [
  { phrase: 'løber ikke ud', category: 'vvs', job: 'stoppet-afloeb' },
  { phrase: 'stoppet', category: 'vvs', job: 'stoppet-afloeb' },
  { phrase: 'lugter', category: 'vvs', job: 'stoppet-afloeb' },
  { phrase: 'drypper', category: 'vvs', job: 'blandingsbatteri' },
  { phrase: 'løbende toilet', category: 'vvs', job: 'skift-toilet' },
  { phrase: 'intet varmt vand', category: 'vvs', job: 'service-fyr' },
  { phrase: 'radiatoren er kold', category: 'vvs', job: 'radiator' },
  { phrase: 'oversvømmet', category: 'vvs', job: 'vandskade' },
  { phrase: 'sprunget et rør', category: 'vvs', job: 'vandskade' },
  { phrase: 'strømmen er gået', category: 'elektriker', job: 'fejlsoegning' },
  { phrase: 'ingen strøm', category: 'elektriker', job: 'fejlsoegning' },
  { phrase: 'sikringen springer', category: 'elektriker', job: 'fejlsoegning' },
  { phrase: 'relæet slår fra', category: 'elektriker', job: 'fejlsoegning' },
  { phrase: 'motorlampen', category: 'mekaniker', job: 'fejlkode' },
  { phrase: 'lampe lyser', category: 'mekaniker', job: 'fejlkode' },
  { phrase: 'bremserne hviner', category: 'mekaniker', job: 'bremser' },
  { phrase: 'bremserne', category: 'mekaniker', job: 'bremser' },
  { phrase: 'skifte dæk', category: 'mekaniker', job: 'hjulskift' },
  { phrase: 'til syn', category: 'mekaniker', job: 'syn' },
  { phrase: 'smækket døren', category: 'laasesmed', job: 'doeroplukning' },
  { phrase: 'tabt nøglerne', category: 'laasesmed', job: 'doeroplukning' },
  { phrase: 'nøglen knækket', category: 'laasesmed', job: 'cylinder' },
  {
    phrase: 'drypper fra loftet',
    category: 'tagdaekker',
    job: 'tagreparation',
  },
  { phrase: 'vand gennem taget', category: 'tagdaekker', job: 'tagreparation' },
  { phrase: 'nedløbsrør', category: 'tagdaekker', job: 'tagrender' },
  { phrase: 'revner i muren', category: 'murer' },
  { phrase: 'male', category: 'maler' },
];

const URGENT_WORDS = [
  'akut',
  'haster',
  'hurtigst muligt',
  'med det samme',
  'i nat',
  'i aften',
  'oversvømmet',
  'sprunget',
  'låst ude',
];

/** Endings that may follow a short keyword: "dør" → "døren", "syn" → "synet". */
const ENDINGS = ['', 'e', 'en', 'et', 'er', 'ere', 'erne', 'ene', 's', 'ens', 'ets', 'n', 't'];

const WEIGHT = {
  categoryWord: 1,
  categoryName: 2,
  jobWord: 2,
  phrase: 3,
} as const;

interface IndexEntry {
  words: string[];
  category: CategoryId;
  job?: string;
  weight: number;
}

const INDEX: IndexEntry[] = (() => {
  const entries: IndexEntry[] = [];
  const add = (phrase: string, category: CategoryId, weight: number, job?: string) => {
    const words = loose(phrase).split(' ').filter(Boolean);
    // A longer phrase is more specific: "drypper fra loftet" beats "drypper".
    if (words.length > 0)
      entries.push({
        words,
        category,
        job,
        weight: weight + (words.length - 1) * 2,
      });
  };
  for (const category of CATEGORIES) {
    add(category.name, category.id, WEIGHT.categoryName);
    add(category.plural, category.id, WEIGHT.categoryName);
    for (const keyword of category.keywords) add(keyword, category.id, WEIGHT.categoryWord);
    for (const job of category.jobs)
      for (const keyword of job.keywords) add(keyword, category.id, WEIGHT.jobWord, job.id);
  }
  for (const [phrase, category] of SYNONYMS) add(phrase, category, WEIGHT.categoryWord);
  for (const { phrase, category, job } of PROBLEM_PHRASES) add(phrase, category, WEIGHT.phrase, job);
  return entries;
})();

/**
 * Does a word in the text match a keyword? Short keywords must match the whole
 * word (plus a Danish ending), so "el" does not match "elsker" and "syn" not
 * "synes". Longer keywords also match inside compounds ("køkkenvasken").
 */
export function wordMatches(word: string, keyword: string): boolean {
  if (keyword.length >= 5) return word.includes(keyword);
  if (keyword.length === 4) {
    if (word.startsWith(keyword) && ENDINGS.includes(word.slice(4))) return true;
    if (word.startsWith(keyword + keyword.slice(-1)) && ENDINGS.includes(word.slice(5))) return true;
    // Compounds ending in the keyword: "køkkenvasken".
    return ENDINGS.some(
      (ending) => word.endsWith(keyword + ending) && word.length > keyword.length + ending.length + 2,
    );
  }
  // Short words double their last consonant before an ending: "stik" → "stikket", "dæk" → "dækkene".
  const doubled = keyword + keyword.slice(-1);
  return ENDINGS.some((ending) => word === keyword + ending || (ending !== '' && word === doubled + ending));
}

function phraseMatches(words: string[], phrase: string[]): boolean {
  if (phrase.length === 1) return words.some((w) => wordMatches(w, phrase[0]));
  for (let i = 0; i + phrase.length <= words.length; i += 1) {
    if (phrase.every((p, j) => (j === phrase.length - 1 ? wordMatches(words[i + j], p) : words[i + j] === p)))
      return true;
  }
  return false;
}

/** Reads a Danish amount: "3.500", "3500", "3 500" or "3,5" with "k"/"tusind". */
function parseAmount(raw: string, thousands?: string): number | undefined {
  const value = Number(raw.replace(/[.\s](?=\d{3}\b)/g, '').replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(thousands ? value * 1000 : value);
}

const AMOUNT = String.raw`(\d{1,3}(?:[.\s]\d{3})+|\d+(?:,\d+)?)\s*(k\b|tusind)?`;
/** "budget 5.000", "max 3500", "højst 8k" – but not "under 25 m²". */
const BUDGET_BEFORE = new RegExp(
  String.raw`(?:budget(?:tet)?|max(?:imum)?|maks|højst|under|op til|råd til)\s*(?:er\s+|på\s+|:\s*)?${AMOUNT}(?!\d|[.,]\d|\s*(?:m2|m²|kvm|km|stk|timer|år|dage))`,
);
/** "5.000 kr.", "2.000,-", "8000 kroner". */
const BUDGET_AFTER = new RegExp(String.raw`${AMOUNT}\s*(?:kr\b|kr\.|kroner|dkk|,-)`);

/** Finds a budget like "budget 5.000 kr.", "max 3500", "under 2.000,-" or "8k". */
export function parseBudget(text: string): number | undefined {
  const t = text.toLowerCase();
  for (const pattern of [BUDGET_BEFORE, BUDGET_AFTER]) {
    const match = t.match(pattern);
    const amount = match ? parseAmount(match[1], match[2]) : undefined;
    if (amount !== undefined && amount >= 100) return amount;
  }
  return undefined;
}

const NUMBER_WORDS: Record<string, number> = {
  en: 1,
  et: 1,
  én: 1,
  ét: 1,
  to: 2,
  tre: 3,
  fire: 4,
  fem: 5,
  seks: 6,
  syv: 7,
  otte: 8,
};

/** Finds "25 m²", "25 kvm" or "3 vinduer" for jobs priced per m² or per piece. */
export function parseQuantity(text: string, unit: JobType['unit']): number | undefined {
  const t = text.toLowerCase();
  if (unit === 'm2') {
    const match = t.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|kvm|kvadratmeter|kvadrat)/);
    return match ? Math.round(Number(match[1].replace(',', '.'))) || undefined : undefined;
  }
  if (unit === 'stk') {
    const match = t.match(
      /(?:^|\s)(\d+|en|et|én|ét|to|tre|fire|fem|seks|syv|otte)\s+(?:nye?t?\s+)?(?:stk|vinduer|vindue|døre|dør)/,
    );
    if (!match) return undefined;
    return NUMBER_WORDS[match[1]] ?? (Number(match[1]) || undefined);
  }
  return undefined;
}

export interface ProblemAnalysis {
  category?: Category;
  job?: JobType;
  /** Other trades that also matched, best first. */
  alternatives: Category[];
  quantity?: number;
  budget?: number;
  urgent: boolean;
}

export function analyzeProblem(text: string): ProblemAnalysis {
  const normalized = loose(text);
  const words = normalized.split(' ').filter(Boolean);
  const budget = parseBudget(text);
  const urgent = URGENT_WORDS.some((w) => phraseMatches(words, loose(w).split(' ')));
  if (words.length === 0) return { alternatives: [], urgent: false, budget };

  const categoryScores = new Map<CategoryId, number>();
  const jobScores = new Map<string, number>();
  const seen = new Set<string>();
  for (const entry of INDEX) {
    const key = `${entry.category}:${entry.job ?? ''}:${entry.words.join(' ')}`;
    if (seen.has(key) || !phraseMatches(words, entry.words)) continue;
    seen.add(key);
    categoryScores.set(entry.category, (categoryScores.get(entry.category) ?? 0) + entry.weight);
    if (entry.job) {
      const jobKey = `${entry.category}:${entry.job}`;
      jobScores.set(jobKey, (jobScores.get(jobKey) ?? 0) + entry.weight);
    }
  }

  const ranked = [...categoryScores.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return { alternatives: [], urgent, budget };
  const category = CATEGORIES.find((c) => c.id === ranked[0][0]);
  if (!category) return { alternatives: [], urgent, budget };

  let job: JobType | undefined;
  let bestJobScore = 0;
  for (const candidate of category.jobs) {
    const score = jobScores.get(`${category.id}:${candidate.id}`) ?? 0;
    if (score > bestJobScore) {
      job = candidate;
      bestJobScore = score;
    }
  }
  const alternatives = ranked
    .slice(1)
    .filter(([, score]) => score >= 2)
    .map(([id]) => CATEGORIES.find((c) => c.id === id))
    .filter((c): c is Category => c !== undefined)
    .slice(0, 3);

  return {
    category,
    job,
    alternatives,
    quantity: job ? parseQuantity(text, job.unit) : undefined,
    budget,
    urgent,
  };
}

/** Assumed size when the user has not said how much (shown and editable in the app). */
export function defaultQuantity(job: JobType): number {
  if (job.unit === 'm2') return 20;
  return 1;
}

export type BudgetFit = 'within' | 'maybe' | 'close' | 'unknown' | 'over';

/** How far above the budget the lowest price may be and still count as "close". */
export const CLOSE_MARGIN = 0.2;

/** Mechanics are visited, so they are matched within this distance instead of a service radius. */
export const WORKSHOP_RADIUS_KM = 30;

export interface BudgetMatch extends ScoredBusiness {
  /** The business's own price for the job × quantity, incl. VAT. */
  price?: { min: number; max: number };
  fit: BudgetFit;
  /** Lowest price above the budget, as a fraction (0.12 = 12 % over). */
  overBy?: number;
}

export interface BudgetMatchInput {
  category: CategoryId;
  job?: JobType;
  quantity?: number;
  budget?: number;
  urgent?: boolean;
}

export function priceForJob(
  item: ScoredBusiness,
  job: JobType,
  quantity: number,
): { min: number; max: number } | undefined {
  const example = item.business.pricing.examples.find((e) => e.job === job.id && e.unit === job.unit);
  if (!example) return undefined;
  const factor = job.unit === 'opgave' ? 1 : Math.max(1, quantity);
  return { min: example.min * factor, max: example.max * factor };
}

export function fitForPrice(
  price: { min: number; max: number } | undefined,
  budget: number | undefined,
): Pick<BudgetMatch, 'fit' | 'overBy'> {
  if (!price || budget === undefined) return { fit: 'unknown' };
  if (price.max <= budget) return { fit: 'within' };
  if (price.min <= budget) return { fit: 'maybe' };
  const overBy = (price.min - budget) / budget;
  return { fit: overBy <= CLOSE_MARGIN ? 'close' : 'over', overBy };
}

/** Whether the business works where the user is. */
export function inReach(item: ScoredBusiness, category: CategoryId): boolean {
  const radius = category === 'mekaniker' ? WORKSHOP_RADIUS_KM : item.business.serviceRadiusKm;
  return item.distanceKm <= radius;
}

const FIT_ORDER: Record<BudgetFit, number> = {
  within: 0,
  maybe: 0,
  close: 1,
  unknown: 2,
  over: 3,
};

/**
 * Orders businesses by budget fit: those whose price fits first, then those
 * close to it, then those without a price for the job, then the rest. Inside
 * each group the FixMatch score decides, and with "det haster" businesses with
 * døgnvagt come first. Payment never changes the order.
 */
export function matchBudget(input: BudgetMatchInput, scored: ScoredBusiness[]): BudgetMatch[] {
  const quantity = input.quantity ?? (input.job ? defaultQuantity(input.job) : 1);
  const matches: BudgetMatch[] = scored
    .filter((item) => item.business.categories.includes(input.category))
    .map((item) => {
      const price = input.job ? priceForJob(item, input.job, quantity) : undefined;
      return { ...item, price, ...fitForPrice(price, input.budget) };
    });

  return matches.sort((a, b) => {
    const group = FIT_ORDER[a.fit] - FIT_ORDER[b.fit];
    if (group !== 0) return group;
    if (input.urgent && a.business.emergency !== b.business.emergency) return a.business.emergency ? -1 : 1;
    if (a.fit === 'close' || a.fit === 'over') return (a.overBy ?? 0) - (b.overBy ?? 0);
    return b.score - a.score;
  });
}

export const FIT_LABELS: Record<BudgetFit, string> = {
  within: 'Inden for budget',
  maybe: 'Kan passe',
  close: 'Tæt på budget',
  unknown: 'Pris på forespørgsel',
  over: 'Over budget',
};

export const PROBLEM_EXAMPLES = [
  'Køkkenvasken er stoppet, og vandet løber ikke ud',
  'Ladestander til elbilen – budget 8.000 kr.',
  'Bilen skal have stort service, max 3.500 kr.',
  'Jeg er låst ude, det haster',
  'Nyt trægulv i stuen, ca. 25 m²',
];
