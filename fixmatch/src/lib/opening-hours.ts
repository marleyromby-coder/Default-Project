import { getLanguage, t } from '@/i18n';

import type { WeekHours } from './types';

export const WEEKDAYS = [t('Mandag'), t('Tirsdag'), t('Onsdag'), t('Torsdag'), t('Fredag'), t('Lørdag'), t('Søndag')];
export const WEEKDAYS_SHORT = [t('man'), t('tir'), t('ons'), t('tor'), t('fre'), t('lør'), t('søn')];

/** JavaScript's Sunday-first day index to our Monday-first index. */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export interface OpenStatus {
  open: boolean;
  /** Short human text, e.g. "Åben til 16.00" or "Åbner tir. kl. 7.00". */
  label: string;
}

/** Danish clock style "07:00" → "7.00"; English "07:00" → "7:00". */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}${getLanguage() === 'da' ? '.' : ':'}${minutes ?? '00'}`;
}

const WEEKDAY_CODES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const clockFormats = new Map<string, Intl.DateTimeFormat>();

/**
 * The weekday (Monday = 0) and minutes past midnight at `now` in a time zone, so a London
 * business shows London opening times to someone in Copenhagen. Without time zone support
 * in the JS engine it falls back to the phone's clock, which is right in the user's own country.
 */
export function clockAt(now: Date, timeZone?: string): { day: number; minutes: number } {
  if (timeZone) {
    try {
      let format = clockFormats.get(timeZone);
      if (!format) {
        format = new Intl.DateTimeFormat('en-US', {
          timeZone,
          weekday: 'short',
          hour: 'numeric',
          minute: 'numeric',
          hourCycle: 'h23',
        });
        clockFormats.set(timeZone, format);
      }
      const parts = format.formatToParts(now);
      const part = (type: string) => parts.find((p) => p.type === type)?.value;
      const day = WEEKDAY_CODES.indexOf(part('weekday') ?? '');
      const hour = Number(part('hour')) % 24;
      const minute = Number(part('minute'));
      if (day >= 0 && Number.isFinite(hour) && Number.isFinite(minute)) return { day, minutes: hour * 60 + minute };
    } catch {
      // Unknown time zone or no Intl support: use the phone's clock below.
    }
  }
  return { day: mondayIndex(now), minutes: now.getHours() * 60 + now.getMinutes() };
}

/** Open or closed at `now`, read in the business's time zone. */
export function getOpenStatus(hours: WeekHours, now: Date = new Date(), timeZone?: string): OpenStatus {
  const { day: today, minutes: minutesNow } = clockAt(now, timeZone);
  const todays = hours[today];

  if (todays) {
    const [from, to] = todays;
    if (minutesNow >= toMinutes(from) && minutesNow < toMinutes(to)) {
      return { open: true, label: t('Åben til {time}', { time: formatTime(to) }) };
    }
    if (minutesNow < toMinutes(from)) {
      return { open: false, label: t('Åbner kl. {time}', { time: formatTime(from) }) };
    }
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (today + offset) % 7;
    const slot = hours[day];
    if (slot) {
      const when = offset === 1 ? t('i morgen') : WEEKDAYS_SHORT[day] + (getLanguage() === 'da' ? '.' : '');
      return { open: false, label: t('Åbner {when} kl. {time}', { when, time: formatTime(slot[0]) }) };
    }
  }

  return { open: false, label: t('Lukket') };
}

export function isOpenNow(hours: WeekHours, now: Date = new Date(), timeZone?: string): boolean {
  return getOpenStatus(hours, now, timeZone).open;
}

/** Groups equal consecutive days: "Man–tor 7.00–15.30", "Fre 7.00–14.00", "Lør–søn Lukket". */
export function summarizeHours(hours: WeekHours): { days: string; time: string }[] {
  const rows: { start: number; end: number; key: string }[] = [];
  hours.forEach((slot, index) => {
    const key = slot ? `${slot[0]}-${slot[1]}` : 'closed';
    const last = rows[rows.length - 1];
    if (last && last.key === key && last.end === index - 1) {
      last.end = index;
    } else {
      rows.push({ start: index, end: index, key });
    }
  });

  return rows.map(({ start, end, key }) => {
    const first = WEEKDAYS_SHORT[start];
    const label = start === end ? first : `${first}–${WEEKDAYS_SHORT[end]}`;
    const days = label.charAt(0).toUpperCase() + label.slice(1);
    if (key === 'closed') return { days, time: t('Lukket') };
    const [from, to] = key.split('-');
    return { days, time: `${formatTime(from)}–${formatTime(to)}` };
  });
}
