import 'server-only';
import { todaySydney } from '../dates';
import { missingInvoiceDates } from '../derive';
import type { AdminData, BookingRequest, Car, Contract, Customer, ServiceRecord } from '../types';
import type { Repo } from './types';

/** Everything the local/demo modes keep: the admin data plus hashed customer PINs. */
export interface StoredData extends AdminData {
  pins: Record<string, string>;
  /** Admin password set from the website (overrides ADMIN_PASSWORD). `epoch` invalidates old sessions. */
  admin?: { passwordHash: string; epoch: number };
  /** Home page cover images, in display order. */
  banners?: string[];
  requests?: BookingRequest[];
  contracts?: Contract[];
  services?: ServiceRecord[];
}

export interface MemoryStore {
  mode: 'demo' | 'local';
  /** The live data object; mutate it, then call save(). */
  load(): Promise<StoredData>;
  save(): Promise<void>;
  savePhoto(carId: string, file: File): Promise<string>;
  /** Private files (customer ID documents). Returns the stored file name. */
  saveDocument(file: File, ext: string): Promise<string>;
  readDocument(name: string): Promise<Buffer | null>;
  deleteDocument(name: string): Promise<void>;
}

const clone = <T,>(v: T): T => structuredClone(v);
const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Repo over an in-process data object (used by DEMO and LOCAL modes). */
export function createMemoryRepo(store: MemoryStore): Repo {
  const repo: Repo = {
    mode: store.mode,

    async publicCars() {
      return (await store.load()).cars
        .filter((c) => c.listed)
        .map(({ id, model, year, category, seats, bags, fuel, gearbox, weeklyRate, status, photoUrl, sortOrder }) => ({
          id, model, year, category, seats, bags, fuel, gearbox, weeklyRate, status, photoUrl, sortOrder,
        }));
    },

    async adminData() {
      const { cars, customers, rentals, invoices } = await store.load();
      return clone({ cars, customers, rentals, invoices });
    },

    async customerData(customerId) {
      const d = await store.load();
      const customer = d.customers.find((c) => c.id === customerId);
      if (!customer) return null;
      const rentals = d.rentals.filter((r) => r.customerId === customerId).sort((a, b) => b.startDate.localeCompare(a.startDate));
      const rental = rentals.find((r) => !r.endDate) ?? rentals[0] ?? null;
      const car = rental ? d.cars.find((c) => c.id === rental.carId) ?? null : null;
      const invoices = rental ? d.invoices.filter((i) => i.rentalId === rental.id) : [];
      return clone({ customer, rental, car, invoices });
    },

    async setInvoicePaid(invoiceId, paidOn) {
      const inv = (await store.load()).invoices.find((i) => i.id === invoiceId);
      if (!inv) throw new Error('Payment not found');
      inv.paidOn = paidOn;
      await store.save();
    },

    async notifyPaid(customerId, invoiceId) {
      const d = await store.load();
      const inv = d.invoices.find((i) => i.id === invoiceId);
      const rental = inv && d.rentals.find((r) => r.id === inv.rentalId);
      if (!inv || rental?.customerId !== customerId) throw new Error('Invoice not found');
      inv.customerNotified = true;
      await store.save();
    },

    async setCarStatus(carId, status) {
      const car = (await store.load()).cars.find((c) => c.id === carId);
      if (!car) throw new Error('Car not found');
      car.status = status;
      await store.save();
    },

    async saveCar(input, id) {
      const d = await store.load();
      const { photoUrl, ...rest } = input;
      if (rest.plate && d.cars.some((c) => c.plate === rest.plate && c.id !== id)) throw new Error('Another car already has this plate');
      if (id) {
        const car = d.cars.find((c) => c.id === id);
        if (!car) throw new Error('Car not found');
        Object.assign(car, rest, photoUrl !== undefined ? { photoUrl } : {});
        await store.save();
        return id;
      }
      const car: Car = {
        id: newId('c'),
        ...rest,
        fuel: 'Petrol',
        gearbox: 'Auto',
        status: 'available',
        photoUrl: photoUrl ?? null,
        sortOrder: Math.max(0, ...d.cars.map((c) => c.sortOrder)) + 1,
      };
      d.cars.unshift(car);
      await store.save();
      return car.id;
    },

    async uploadCarPhoto(carId, file) {
      const d = await store.load();
      const car = d.cars.find((c) => c.id === carId);
      if (!car) throw new Error('Car not found');
      car.photoUrl = await store.savePhoto(carId, file);
      await store.save();
      return car.photoUrl;
    },

    async addCustomerWithRental(input) {
      const d = await store.load();
      const car = d.cars.find((c) => c.id === input.carId);
      if (!car) throw new Error('Car not found');
      if (d.rentals.some((r) => r.carId === car.id && !r.endDate)) throw new Error('This car is already on hire');
      // re-use an existing customer with the same mobile (returning customer)
      let customer = d.customers.find((c) => c.phone === input.phone);
      if (customer && d.rentals.some((r) => r.customerId === customer!.id && !r.endDate)) {
        throw new Error('This customer already has a car on hire');
      }
      if (!customer) {
        customer = { id: newId('d'), firstName: input.firstName, lastName: input.lastName, phone: input.phone, licenceNo: input.licenceNo } satisfies Customer;
        d.customers.push(customer);
      }
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
      await store.save();
      await repo.generateInvoices(todaySydney());
    },

    async endRental(rentalId, endDate) {
      const d = await store.load();
      const rental = d.rentals.find((r) => r.id === rentalId);
      if (!rental) throw new Error('Rental not found');
      rental.endDate = endDate;
      d.invoices = d.invoices.filter((i) => !(i.rentalId === rentalId && !i.paidOn && i.dueDate >= endDate));
      const car = d.cars.find((c) => c.id === rental.carId);
      if (car) car.status = 'available';
      await store.save();
    },

    async updateCustomer(id, input) {
      const d = await store.load();
      const c = d.customers.find((x) => x.id === id);
      if (!c) throw new Error('Customer not found');
      if (input.phone && d.customers.some((x) => x.phone === input.phone && x.id !== id)) throw new Error('Another customer has this mobile');
      Object.assign(c, input);
      await store.save();
    },

    async generateInvoices(today) {
      const d = await store.load();
      let created = 0;
      for (const rental of d.rentals) {
        if (rental.endDate && rental.endDate <= today) continue;
        for (const due of missingInvoiceDates(rental, d.invoices, today)) {
          d.invoices.push({ id: newId('i'), rentalId: rental.id, dueDate: due, amount: rental.weeklyRate, paidOn: null, customerNotified: false });
          created++;
        }
      }
      if (created) await store.save();
      return created;
    },

    async findCustomerByPhone(phone) {
      const d = await store.load();
      const c = d.customers.find((x) => x.phone === phone);
      return c ? { id: c.id, pinHash: d.pins[c.id] } : null;
    },

    async getBanners() {
      return [...((await store.load()).banners ?? [])];
    },

    async addBanner(file) {
      const d = await store.load();
      const url = await store.savePhoto('banner', file);
      d.banners = [...(d.banners ?? []), url];
      await store.save();
    },

    async setBanners(urls) {
      const d = await store.load();
      const current = new Set(d.banners ?? []);
      d.banners = urls.filter((u) => current.has(u)); // only re-order / remove existing ones
      await store.save();
    },

    async listRequests() {
      return clone((await store.load()).requests ?? []);
    },

    async addRequest(input) {
      const d = await store.load();
      d.requests = [{ ...input, id: newId('q'), createdAt: new Date().toISOString(), status: 'new' as const }, ...(d.requests ?? [])].slice(0, 2000);
      await store.save();
    },

    saveDocument: (file, ext) => store.saveDocument(file, ext),
    readDocument: (name) => store.readDocument(name),

    async deleteRequest(id) {
      const d = await store.load();
      const r = d.requests?.find((x) => x.id === id);
      if (!r) throw new Error('Request not found');
      for (const doc of r.documents ?? []) await store.deleteDocument(doc.file);
      d.requests = d.requests!.filter((x) => x.id !== id);
      await store.save();
    },

    async setRequestStatus(id, status) {
      const r = (await store.load()).requests?.find((x) => x.id === id);
      if (!r) throw new Error('Request not found');
      r.status = status;
      await store.save();
    },

    async listContracts() {
      return clone((await store.load()).contracts ?? []);
    },

    async getContractByToken(token) {
      const c = (await store.load()).contracts?.find((x) => x.token === token);
      return c ? clone(c) : null;
    },

    async getContract(id) {
      const c = (await store.load()).contracts?.find((x) => x.id === id);
      return c ? clone(c) : null;
    },

    async saveContract(contract) {
      const d = await store.load();
      const list = (d.contracts ??= []);
      const i = list.findIndex((x) => x.id === contract.id);
      if (i >= 0) list[i] = contract;
      else list.unshift(contract);
      await store.save();
    },

    async deleteContract(id) {
      const d = await store.load();
      const c = d.contracts?.find((x) => x.id === id);
      if (!c) throw new Error('Contract not found');
      for (const f of [c.insuranceSignature, c.finalSignature, c.ownerSignature]) if (f) await store.deleteDocument(f);
      d.contracts = d.contracts!.filter((x) => x.id !== id);
      await store.save();
    },

    async listServices() {
      return clone((await store.load()).services ?? []);
    },

    async addService(input) {
      const d = await store.load();
      const car = d.cars.find((c) => c.id === input.carId);
      if (!car) throw new Error('Car not found');
      (d.services ??= []).unshift({ id: newId('s'), ...input });
      if (input.nextDate) car.serviceDue = input.nextDate;
      if (input.odometer != null && (car.odometer == null || input.odometer > car.odometer)) car.odometer = input.odometer;
      await store.save();
    },

    async deleteService(id) {
      const d = await store.load();
      d.services = (d.services ?? []).filter((x) => x.id !== id);
      await store.save();
    },

    async getAdminAuth() {
      const a = (await store.load()).admin;
      return a ? { ...a } : null;
    },

    async setAdminPassword(passwordHash) {
      const d = await store.load();
      d.admin = { passwordHash, epoch: (d.admin?.epoch ?? 0) + 1 };
      await store.save();
      return d.admin.epoch;
    },

    async setCustomerPin(customerId, pinHash) {
      const d = await store.load();
      if (!d.customers.some((c) => c.id === customerId)) throw new Error('Customer not found');
      d.pins[customerId] = pinHash;
      await store.save();
    },
  };
  return repo;
}
