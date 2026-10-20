import type { WeekHours } from './types';

export const WEEKDAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
export const WEEKDAYS_SHORT = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];

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

/** Danish clock style: "07:00" → "7.00". */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}.${minutes ?? '00'}`;
}

export function getOpenStatus(hours: WeekHours, now: Date = new Date()): OpenStatus {
  const today = mondayIndex(now);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const todays = hours[today];

  if (todays) {
    const [from, to] = todays;
    if (minutesNow >= toMinutes(from) && minutesNow < toMinutes(to)) {
      return { open: true, label: `Åben til ${formatTime(to)}` };
    }
    if (minutesNow < toMinutes(from)) {
      return { open: false, label: `Åbner kl. ${formatTime(from)}` };
    }
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (today + offset) % 7;
    const slot = hours[day];
    if (slot) {
      const when = offset === 1 ? 'i morgen' : WEEKDAYS_SHORT[day] + '.';
      return { open: false, label: `Åbner ${when} kl. ${formatTime(slot[0])}` };
    }
  }

  return { open: false, label: 'Lukket' };
}

export function isOpenNow(hours: WeekHours, now: Date = new Date()): boolean {
  return getOpenStatus(hours, now).open;
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
    if (key === 'closed') return { days, time: 'Lukket' };
    const [from, to] = key.split('-');
    return { days, time: `${formatTime(from)}–${formatTime(to)}` };
  });
}
