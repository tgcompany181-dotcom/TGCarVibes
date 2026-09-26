import 'server-only';
import { randomUUID } from 'node:crypto';
import { addDays, todaySydney } from '../dates';
import { FLEET_SEED } from '../fleet-seed';
import { toIntlPhone } from '../format';
import { hashPin } from '../session';
import type { AdminData, Car, CarStatus, Customer, Invoice, Rental } from '../types';
import { createMemoryRepo, type StoredData } from './memory';

/*
 * DEMO mode: an in-memory store seeded with generated dummy data (same shape as the
 * design prototype). It is used when Supabase is not configured, so the whole app can
 * be clicked through locally. Data resets when the server restarts.
 */

const FIRST = ['Minh', 'Arjun', 'Mohammed', 'Daniel', 'Priya', 'Wei', 'Tuan', 'Ali', 'Harpreet', 'James', 'Omar', 'Linh', 'Ravi', 'Sam', 'Nikhil', 'Chen', 'Hassan', 'Duc', 'Jason', 'Amir'];
const LAST = ['Tran', 'Singh', 'Nguyen', 'Khan', 'Patel', 'Zhang', 'Le', 'Hussain', 'Smith', 'Kaur', 'Pham', 'Ahmed', 'Wong', 'Sharma', 'Rahman', 'Li'];

export const DEMO_CUSTOMER_PHONE = '0412 558 203';
export const DEMO_OTP = '123456';
export const DEMO_ADMIN = { email: 'admin@demo.local', password: 'demo' };

const demoStatus = (i: number): CarStatus =>
  i === 39 ? 'service' : i === 0 || i === 3 || i === 7 || (i >= 11 && i < 36) ? 'hire' : 'available';

function seed(today: string): AdminData {
  let s = 11;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const L = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const pick = (n: number) => Math.floor(r() * n);
  const plate = () => L[pick(23)] + L[pick(23)] + L[pick(23)] + (10 + pick(90)) + L[pick(23)];

  const cars: Car[] = [];
  for (let i = 0; i < 40; i++) {
    const m = i < FLEET_SEED.length ? FLEET_SEED[i] : i === 38 ? FLEET_SEED[0] : FLEET_SEED[pick(FLEET_SEED.length)];
    cars.push({
      id: 'c' + i,
      model: m.model,
      year: m.year,
      category: m.category,
      seats: m.seats,
      bags: m.bags,
      fuel: 'Petrol',
      gearbox: 'Auto',
      weeklyRate: m.weeklyRate,
      plate: i === 0 ? 'EQR42K' : plate(),
      status: demoStatus(i),
      regoExpiry: addDays(today, pick(340) - 8),
      serviceDue: addDays(today, pick(110) - 4),
      odometer: 28000 + pick(140000),
      photoUrl: m.photoUrl ?? null,
      listed: true,
      sortOrder: i < FLEET_SEED.length ? i : 100 + i,
    });
  }

  const hired = cars.filter((c) => c.status === 'hire');
  const customers: Customer[] = [];
  const rentals: Rental[] = [];
  const invoices: Invoice[] = [];
  hired.forEach((car, i) => {
    const first = i === 0 ? 'Minh' : FIRST[pick(FIRST.length)];
    const last = i === 0 ? 'Tran' : LAST[pick(LAST.length)];
    const phone = i === 0 ? DEMO_CUSTOMER_PHONE : `04${10 + pick(89)} ${100 + pick(899)} ${100 + pick(899)}`;
    customers.push({ id: 'd' + i, firstName: first, lastName: last, phone: toIntlPhone(phone)!, licenceNo: null });

    const off = i === 0 ? 5 : ((i * 3) % 11) - 4; // current invoice due in `off` days
    const curDue = addDays(today, off);
    const startDate = addDays(curDue, -7 * (6 + pick(40)));
    const rental: Rental = {
      id: 'r' + i,
      carId: car.id,
      customerId: 'd' + i,
      startDate,
      endDate: null,
      weeklyRate: car.weeklyRate,
      bondAmount: car.weeklyRate * 2,
      bondStatus: 'held',
    };
    rentals.push(rental);
    for (let w = 6; w >= 0; w--) {
      const due = addDays(curDue, -7 * w);
      let paid = w > 0;
      if (w === 0 && off < 0) paid = i % 3 !== 1;
      if (w === 0 && off >= 0 && i % 5 === 0 && i !== 0) paid = true;
      if (w === 1 && i % 13 === 7) paid = false;
      invoices.push({
        id: `i${i}-${w}`,
        rentalId: rental.id,
        dueDate: due,
        amount: car.weeklyRate,
        paidOn: paid ? addDays(due, -pick(2)) : null,
        customerNotified: false,
      });
    }
  });
  return { cars, customers, rentals, invoices };
}

const g = globalThis as unknown as { __tgDemo?: StoredData; __tgDemoDocs?: Map<string, Buffer> };
const demoDocs = (g.__tgDemoDocs ??= new Map());
const db = () => (g.__tgDemo ??= { ...seed(todaySydney()), pins: { d0: hashPin(DEMO_OTP) } });

export const demoRepo = createMemoryRepo({
  mode: 'demo',
  load: async () => db(),
  save: async () => {},
  async savePhoto(_carId, file) {
    const buf = Buffer.from(await file.arrayBuffer());
    return `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`;
  },
  async saveDocument(file, ext) {
    const name = `${randomUUID()}.${ext}`;
    demoDocs.set(name, Buffer.from(await file.arrayBuffer()));
    return name;
  },
  readDocument: async (name) => demoDocs.get(name) ?? null,
  deleteDocument: async (name) => void demoDocs.delete(name),
});
