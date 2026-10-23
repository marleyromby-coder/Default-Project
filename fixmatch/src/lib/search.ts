import { CATEGORIES } from '@/data/categories';

import { loose } from './text';
import type { Business, Category, JobType } from './types';

export interface JobHit {
  category: Category;
  job: JobType;
}

export interface SearchResults {
  categories: Category[];
  jobs: JobHit[];
  businesses: Business[];
}

/** Plain-language phrases mapped to a trade, for searches like "låst ude". */
export const SYNONYMS: [string, Category['id']][] = [
  ['blikkenslager', 'vvs'],
  ['rørlægger', 'vvs'],
  ['vandhane', 'vvs'],
  ['utæt', 'vvs'],
  ['fyr', 'vvs'],
  ['strøm', 'elektriker'],
  ['el', 'elektriker'],
  ['elbil', 'elektriker'],
  ['snedker', 'toemrer'],
  ['vinduer', 'toemrer'],
  ['fliser', 'murer'],
  ['flisemand', 'murer'],
  ['bil', 'mekaniker'],
  ['værksted', 'mekaniker'],
  ['autoværksted', 'mekaniker'],
  ['bilværksted', 'mekaniker'],
  ['dæk', 'mekaniker'],
  ['maling', 'maler'],
  ['tag', 'tagdaekker'],
  ['tagrende', 'tagdaekker'],
  ['låst ude', 'laasesmed'],
  ['nøgle', 'laasesmed'],
];

function matches(haystack: string, needle: string): boolean {
  const target = loose(haystack);
  return target.startsWith(needle) || target.includes(` ${needle}`) || (needle.length >= 4 && target.includes(needle));
}

export function search(query: string, businesses: Business[]): SearchResults {
  const needle = loose(query);
  if (needle.length < 2) return { categories: [], jobs: [], businesses: [] };

  const categoryIds = new Set<Category['id']>();
  for (const category of CATEGORIES) {
    if ([category.name, category.plural, category.description, ...category.keywords].some((k) => matches(k, needle))) {
      categoryIds.add(category.id);
    }
  }
  for (const [phrase, id] of SYNONYMS) {
    if (matches(phrase, needle) || (needle.length >= 3 && loose(phrase).startsWith(needle))) categoryIds.add(id);
  }

  const jobs: JobHit[] = [];
  for (const category of CATEGORIES) {
    for (const job of category.jobs) {
      if ([job.name, ...job.keywords].some((k) => matches(k, needle))) jobs.push({ category, job });
    }
  }

  const found = businesses.filter((b) =>
    [b.name, b.tagline, b.address.city, ...b.services].some((k) => matches(k, needle)),
  );

  return {
    categories: CATEGORIES.filter((c) => categoryIds.has(c.id)),
    jobs: jobs.slice(0, 8),
    businesses: found.slice(0, 20),
  };
}

export const SEARCH_SUGGESTIONS = ['Stoppet afløb', 'Ladestander', 'Nyt badeværelse', 'Stort service', 'Låst ude', 'Tagrender'];
