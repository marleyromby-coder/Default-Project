import { timeZoneOf } from './business-text';
import type { Business } from './types';

/**
 * "Hvem har tid i dag?": a business marks that it has free time today or tomorrow. The days
 * are stored as dates (YYYY-MM-DD) in the business's own time zone, so a mark from yesterday
 * simply stops counting at midnight – nobody has to remember to switch it off.
 */
export type Availability = 'today' | 'tomorrow';

/** Business id → the days it has marked as free. */
export type AvailabilityMap = Record<string, string[]>;

const dayFormats = new Map<string, Intl.DateTimeFormat>();

/** The calendar date at `now` in a time zone, as YYYY-MM-DD (the phone's date without Intl). */
export function localDay(now: Date, timeZone?: string): string {
  if (timeZone) {
    try {
      let format = dayFormats.get(timeZone);
      if (!format) {
        format = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
        dayFormats.set(timeZone, format);
      }
      const parts = format.formatToParts(now);
      const part = (type: string) => parts.find((p) => p.type === type)?.value;
      const day = `${part('year')}-${part('month')}-${part('day')}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
    } catch {
      // Unknown time zone: use the phone's date below.
    }
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The day after a YYYY-MM-DD date. */
export function nextDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Whether the business has marked free time today, else tomorrow, else undefined. */
export function availableWhen(business: Business, now = new Date()): Availability | undefined {
  const days = business.availableOn;
  if (!days || days.length === 0) return undefined;
  const today = localDay(now, timeZoneOf(business));
  if (days.includes(today)) return 'today';
  if (days.includes(nextDay(today))) return 'tomorrow';
  return undefined;
}

/** Rows from the server's `availability` table, keeping only well-formed dates. */
export function parseAvailability(rows: unknown): AvailabilityMap {
  const map: AvailabilityMap = {};
  if (!Array.isArray(rows)) return map;
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    const { business_id: id, available_on: days } = row as { business_id?: unknown; available_on?: unknown };
    if (typeof id !== 'string' || !Array.isArray(days)) continue;
    const valid = days.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (valid.length > 0) map[id] = valid;
  }
  return map;
}

/** A small, stable number from a string (FNV-1a). */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Free days for the fictional demo businesses, so the feature can be shown without a server.
 * About a quarter are free today and a quarter tomorrow; it changes from day to day.
 */
export function demoAvailability(businesses: Business[], now = new Date()): AvailabilityMap {
  const map: AvailabilityMap = {};
  for (const business of businesses) {
    if (!business.demo) continue;
    const today = localDay(now, timeZoneOf(business));
    const roll = hash(`${business.id}|${today}`) % 100;
    if (roll < 25) map[business.id] = [today];
    else if (roll < 50) map[business.id] = [nextDay(today)];
  }
  return map;
}

/** The businesses with their free days from the map (the map wins; absent means none). */
export function withAvailability(businesses: Business[], map: AvailabilityMap): Business[] {
  return businesses.map((business) => {
    const days = map[business.id];
    if (!days && !business.availableOn) return business;
    return { ...business, availableOn: days };
  });
}
