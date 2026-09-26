import { addDays, daysBetween, fmtLong, fmtShort } from './dates';
import type { AdminData, Car, Invoice, ISODate, PublicCar, Rental } from './types';

export type Tone = 'neutral' | 'accent' | 'outline';
export type PayCategory = 'paid' | 'overdue' | 'due';

export interface InvoiceStatus {
  label: string;
  tone: Tone;
  cat: PayCategory;
}

/** paid_on set → Paid; else due_date < today → Overdue; else Due in N days. */
export function invoiceStatus(inv: Invoice, today: ISODate): InvoiceStatus {
  if (inv.paidOn) return { label: 'Paid', tone: 'neutral', cat: 'paid' };
  const n = daysBetween(today, inv.dueDate);
  if (n < 0) return { label: 'Overdue', tone: 'accent', cat: 'overdue' };
  if (n === 0) return { label: 'Due today', tone: 'outline', cat: 'due' };
  return { label: `Due in ${n}d`, tone: 'outline', cat: 'due' };
}

/** Tag for a compliance date (rego / service). */
/** Days before a due date that it gets highlighted. */
export const WARN_DAYS = { Rego: 30, Service: 14 } as const;

export function dueDateTag(d: ISODate | null, today: ISODate, warnDays: number = WARN_DAYS.Rego): { label: string; tone: Tone } {
  if (!d) return { label: 'Not set', tone: 'neutral' };
  const n = daysBetween(today, d);
  if (n < 0) return { label: `Expired ${fmtShort(d)}`, tone: 'accent' };
  if (n <= warnDays) return { label: `${fmtShort(d)} · ${n}d`, tone: 'outline' };
  return { label: fmtLong(d), tone: 'neutral' };
}

/**
 * The invoice a customer should look at: the oldest unpaid one if any,
 * otherwise the most recent.
 */
export function currentInvoice(invoices: Invoice[]): Invoice | null {
  const unpaid = invoices.filter((i) => !i.paidOn).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (unpaid.length) return unpaid[0];
  return [...invoices].sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0] ?? null;
}

export const activeRentals = (rentals: Rental[], today: ISODate) =>
  rentals.filter((r) => !r.endDate || r.endDate > today);

/**
 * Invoices that should exist for a rental up to `today`: one every 7 days from
 * the start date, always keeping one upcoming invoice in the future.
 */
export function missingInvoiceDates(rental: Rental, existing: Invoice[], today: ISODate): ISODate[] {
  const out: ISODate[] = [];
  const dues = existing.filter((i) => i.rentalId === rental.id).map((i) => i.dueDate).sort();
  let last = dues.length ? dues[dues.length - 1] : null;
  if (!last) {
    out.push(rental.startDate);
    last = rental.startDate;
  }
  while (last <= today) {
    const next = addDays(last, 7);
    if (rental.endDate && next >= rental.endDate) break;
    out.push(next);
    last = next;
  }
  return out;
}

export interface FleetGroup {
  key: string;
  model: string;
  year: number;
  title: string;
  category: PublicCar['category'];
  seats: number;
  bags: string;
  weeklyRate: number;
  photoUrl: string | null;
  available: number;
}

/** Group physical cars into the model cards shown on the public site. */
export function groupFleet(cars: PublicCar[]): FleetGroup[] {
  const map = new Map<string, FleetGroup & { order: number }>();
  for (const c of [...cars].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const key = [c.model, c.year, c.category, c.seats, c.bags, c.weeklyRate].join('|');
    const g = map.get(key) ?? {
      key,
      model: c.model,
      year: c.year,
      title: `${c.model} ${c.year}`,
      category: c.category,
      seats: c.seats,
      bags: c.bags,
      weeklyRate: c.weeklyRate,
      photoUrl: null,
      available: 0,
      order: c.sortOrder,
    };
    if (!g.photoUrl && c.photoUrl) g.photoUrl = c.photoUrl;
    if (c.status === 'available') g.available++;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.order - b.order).map(({ order: _order, ...g }) => g);
}

export interface ComplianceItem {
  kind: 'Rego' | 'Service';
  date: ISODate;
  days: number;
  car: Car;
}

export function complianceItems(cars: Car[], today: ISODate): ComplianceItem[] {
  const items: ComplianceItem[] = [];
  for (const car of cars) {
    for (const [kind, date] of [['Rego', car.regoExpiry], ['Service', car.serviceDue]] as const) {
      if (!date) continue;
      const days = daysBetween(today, date);
      if (days <= WARN_DAYS[kind]) items.push({ kind, date, days, car });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** Index helpers used by the admin screens. */
export function indexAdmin(data: AdminData, today: ISODate) {
  const carById = new Map(data.cars.map((c) => [c.id, c]));
  const customerById = new Map(data.customers.map((c) => [c.id, c]));
  const rentalById = new Map(data.rentals.map((r) => [r.id, r]));
  const active = activeRentals(data.rentals, today);
  const activeRentalByCar = new Map(active.map((r) => [r.carId, r]));
  const activeRentalByCustomer = new Map(active.map((r) => [r.customerId, r]));
  const invoicesByRental = new Map<string, Invoice[]>();
  for (const i of data.invoices) {
    const list = invoicesByRental.get(i.rentalId) ?? [];
    list.push(i);
    invoicesByRental.set(i.rentalId, list);
  }
  return { carById, customerById, rentalById, activeRentalByCar, activeRentalByCustomer, invoicesByRental };
}

export function paymentTotals(invoices: Invoice[], today: ISODate) {
  const weekStart = addDays(today, -7);
  const weekEnd = addDays(today, 7);
  const window = invoices.filter((i) => i.dueDate >= weekStart && i.dueDate < weekEnd);
  const overdue = invoices.filter((i) => !i.paidOn && i.dueDate < today);
  const upcoming = invoices.filter((i) => !i.paidOn && i.dueDate >= today && i.dueDate < weekEnd);
  const sum = (l: Invoice[]) => l.reduce((a, i) => a + i.amount, 0);
  return {
    expected: sum(window),
    collected: sum(window.filter((i) => i.paidOn)),
    overdueAmount: sum(overdue),
    overdueCount: overdue.length,
    overdue,
    upcomingAmount: sum(upcoming),
    awaitingConfirmation: invoices.filter((i) => !i.paidOn && i.customerNotified).length,
  };
}
