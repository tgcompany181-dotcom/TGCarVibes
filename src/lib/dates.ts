import { BUSINESS } from './config';
import type { ISODate } from './types';

const DAY = 86_400_000;

/** Today's date in Sydney, as YYYY-MM-DD. */
export function todaySydney(now = new Date()): ISODate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const toUTC = (d: ISODate) => {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
};

export const addDays = (d: ISODate, n: number): ISODate =>
  new Date(toUTC(d) + n * DAY).toISOString().slice(0, 10);

/** Whole days from a to b (b − a). */
export const daysBetween = (a: ISODate, b: ISODate) => Math.round((toUTC(b) - toUTC(a)) / DAY);

export const isISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUTC(s));

const fmt = (d: ISODate, opts: Intl.DateTimeFormatOptions) =>
  new Date(toUTC(d)).toLocaleDateString('en-AU', { ...opts, timeZone: 'UTC' });

/** "Wed 23 Sept" */
export const fmtShort = (d: ISODate) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' });
/** "23 Sept 2026" */
export const fmtLong = (d: ISODate) => fmt(d, { day: 'numeric', month: 'short', year: 'numeric' });
/** "Wed 23 Sep 2026" */
export const fmtFull = (d: ISODate) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
