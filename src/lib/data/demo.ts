import 'server-only';
import { addDays, todaySydney } from '../dates';
import { missingInvoiceDates } from '../derive';
import { FLEET_SEED } from '../fleet-seed';
import { toIntlPhone } from '../format';
import type { AdminData, Car, CarStatus, Customer, Invoice, Rental } from '../types';
import type { Repo } from './types';

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

const g = globalThis as unknown as { __tgDemo?: AdminData };
const db = () => (g.__tgDemo ??= seed(todaySydney()));
const clone = <T,>(v: T): T => structuredClone(v);
let nextId = 1000;
const newId = (p: string) => p + nextId++;

export const demoRepo: Repo = {
  mode: 'demo',

  async publicCars() {
    return db()
      .cars.filter((c) => c.listed)
      .map(({ id, model, year, category, seats, bags, fuel, gearbox, weeklyRate, status, photoUrl, sortOrder }) => ({
        id, model, year, category, seats, bags, fuel, gearbox, weeklyRate, status, photoUrl, sortOrder,
      }));
  },

  async adminData() {
    return clone(db());
  },

  async customerData(customerId) {
    const d = db();
    const customer = d.customers.find((c) => c.id === customerId);
    if (!customer) return null;
    const rental =
      d.rentals.filter((r) => r.customerId === customerId).sort((a, b) => (a.endDate ? 1 : 0) - (b.endDate ? 1 : 0))[0] ?? null;
    const car = rental ? d.cars.find((c) => c.id === rental.carId) ?? null : null;
    const invoices = rental ? d.invoices.filter((i) => i.rentalId === rental.id) : [];
    return clone({ customer, rental, car, invoices });
  },

  async setInvoicePaid(invoiceId, paidOn) {
    const inv = db().invoices.find((i) => i.id === invoiceId);
    if (inv) inv.paidOn = paidOn;
  },

  async notifyPaid(customerId, invoiceId) {
    const d = db();
    const inv = d.invoices.find((i) => i.id === invoiceId);
    const rental = inv && d.rentals.find((r) => r.id === inv.rentalId);
    if (!inv || rental?.customerId !== customerId) throw new Error('Invoice not found');
    inv.customerNotified = true;
  },

  async setCarStatus(carId, status) {
    const car = db().cars.find((c) => c.id === carId);
    if (car) car.status = status;
  },

  async saveCar(input, id) {
    const d = db();
    const { photoUrl, ...rest } = input;
    if (id) {
      const car = d.cars.find((c) => c.id === id);
      if (!car) throw new Error('Car not found');
      Object.assign(car, rest, photoUrl !== undefined ? { photoUrl } : {});
      return id;
    }
    const car: Car = {
      id: newId('c'),
      ...rest,
      fuel: 'Petrol',
      gearbox: 'Auto',
      status: 'available',
      photoUrl: photoUrl ?? null,
      sortOrder: d.cars.length + 100,
    };
    d.cars.unshift(car);
    return car.id;
  },

  async uploadCarPhoto(carId, file) {
    const buf = Buffer.from(await file.arrayBuffer());
    const url = `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`;
    const car = db().cars.find((c) => c.id === carId);
    if (car) car.photoUrl = url;
    return url;
  },

  async addCustomerWithRental(input) {
    const d = db();
    const car = d.cars.find((c) => c.id === input.carId);
    if (!car) throw new Error('Car not found');
    if (d.customers.some((c) => c.phone === input.phone)) throw new Error('A customer with this mobile already exists');
    const customer: Customer = {
      id: newId('d'),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      licenceNo: input.licenceNo,
    };
    d.customers.push(customer);
    d.rentals.push({
      id: newId('r'),
      carId: car.id,
      customerId: customer.id,
      startDate: input.startDate,
      endDate: null,
      weeklyRate: input.weeklyRate,
      bondAmount: input.weeklyRate * 2,
      bondStatus: 'held',
    });
    car.status = 'hire';
    await this.generateInvoices(todaySydney());
  },

  async endRental(rentalId, endDate) {
    const d = db();
    const rental = d.rentals.find((r) => r.id === rentalId);
    if (!rental) throw new Error('Rental not found');
    rental.endDate = endDate;
    // drop future invoices that fall on/after the return date and are unpaid
    d.invoices = d.invoices.filter((i) => !(i.rentalId === rentalId && !i.paidOn && i.dueDate >= endDate));
    const car = d.cars.find((c) => c.id === rental.carId);
    if (car) car.status = 'available';
  },

  async generateInvoices(today) {
    const d = db();
    let created = 0;
    for (const rental of d.rentals) {
      if (rental.endDate && rental.endDate <= today) continue;
      for (const due of missingInvoiceDates(rental, d.invoices, today)) {
        d.invoices.push({ id: newId('i'), rentalId: rental.id, dueDate: due, amount: rental.weeklyRate, paidOn: null, customerNotified: false });
        created++;
      }
    }
    return created;
  },
};
