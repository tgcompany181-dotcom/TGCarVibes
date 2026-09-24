import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { missingInvoiceDates } from '../derive';
import { createSupabaseServer } from '../supabase/server';
import type { Car, CarInput, Customer, Invoice, PublicCar, Rental } from '../types';
import type { Repo } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const num = (v: unknown) => (v == null ? 0 : Number(v));

const toCar = (r: Row): Car => ({
  id: r.id,
  model: r.model,
  year: r.year,
  category: r.category,
  seats: r.seats,
  bags: r.bags,
  fuel: r.fuel,
  gearbox: r.gearbox,
  weeklyRate: num(r.weekly_rate),
  plate: r.plate,
  status: r.status,
  regoExpiry: r.rego_expiry,
  serviceDue: r.service_due,
  odometer: r.odometer,
  photoUrl: r.photo_url,
  listed: r.listed,
  sortOrder: r.sort_order,
});

const toPublicCar = (r: Row): PublicCar => ({
  id: r.id,
  model: r.model,
  year: r.year,
  category: r.category,
  seats: r.seats,
  bags: r.bags,
  fuel: r.fuel,
  gearbox: r.gearbox,
  weeklyRate: num(r.weekly_rate),
  status: r.status,
  photoUrl: r.photo_url,
  sortOrder: r.sort_order,
});

const toCustomer = (r: Row): Customer => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  phone: r.phone,
  licenceNo: r.licence_no,
});

const toRental = (r: Row): Rental => ({
  id: r.id,
  carId: r.car_id,
  customerId: r.customer_id,
  startDate: r.start_date,
  endDate: r.end_date,
  weeklyRate: num(r.weekly_rate),
  bondAmount: num(r.bond_amount),
  bondStatus: r.bond_status,
});

const toInvoice = (r: Row): Invoice => ({
  id: r.id,
  rentalId: r.rental_id,
  dueDate: r.due_date,
  amount: num(r.amount),
  paidOn: r.paid_on,
  customerNotified: r.customer_notified,
});

const carRow = (c: CarInput) => ({
  model: c.model,
  year: c.year,
  category: c.category,
  seats: c.seats,
  bags: c.bags,
  weekly_rate: c.weeklyRate,
  plate: c.plate,
  rego_expiry: c.regoExpiry,
  service_due: c.serviceDue,
  odometer: c.odometer,
  listed: c.listed,
  ...(c.photoUrl !== undefined ? { photo_url: c.photoUrl } : {}),
});

type Res<T> = { data: T | null; error: { message: string } | null };

/** Throws on error; returns the (non-null) data. */
function check<T>(res: Res<T>): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

/** Throws on error; for queries that may legitimately return no row. */
function maybe<T>(res: Res<T>): T | null {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Shared by the request-scoped repo and the service-role cron job. */
export async function generateInvoicesWith(sb: SupabaseClient, today: string): Promise<number> {
  const rentals = check(await sb.from('rentals').select('*').or(`end_date.is.null,end_date.gt.${today}`)).map(toRental);
  if (!rentals.length) return 0;
  const ids = rentals.map((r) => r.id);
  const existing = check(await sb.from('invoices').select('id, rental_id, due_date, amount, paid_on, customer_notified').in('rental_id', ids)).map(toInvoice);
  const rows = rentals.flatMap((r) =>
    missingInvoiceDates(r, existing, today).map((due) => ({ rental_id: r.id, due_date: due, amount: r.weeklyRate })),
  );
  if (!rows.length) return 0;
  check(await sb.from('invoices').upsert(rows, { onConflict: 'rental_id,due_date', ignoreDuplicates: true }));
  return rows.length;
}

export const supabaseRepo: Repo = {
  mode: 'supabase',

  async publicCars() {
    // cookie-less anon client so the public page can be statically cached
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    return check(await sb.from('public_cars').select('*').order('sort_order')).map(toPublicCar);
  },

  async adminData() {
    const sb = await createSupabaseServer();
    const since = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
    const [cars, customers, rentals, invoices] = await Promise.all([
      sb.from('cars').select('*').order('sort_order').order('created_at', { ascending: false }),
      sb.from('customers').select('*').order('first_name'),
      sb.from('rentals').select('*'),
      // unpaid invoices of any age + everything from the last ~4 months
      sb.from('invoices').select('*').or(`paid_on.is.null,due_date.gte.${since}`).order('due_date'),
    ]);
    return {
      cars: check(cars).map(toCar),
      customers: check(customers).map(toCustomer),
      rentals: check(rentals).map(toRental),
      invoices: check(invoices).map(toInvoice),
    };
  },

  async customerData(customerId) {
    const sb = await createSupabaseServer();
    const c = maybe(await sb.from('customers').select('*').eq('id', customerId).maybeSingle());
    if (!c) return null;
    const rentals = check(
      await sb.from('rentals').select('*').eq('customer_id', customerId).order('start_date', { ascending: false }),
    ).map(toRental);
    const rental = rentals.find((r) => !r.endDate) ?? rentals[0] ?? null;
    if (!rental) return { customer: toCustomer(c), rental: null, car: null, invoices: [] };
    const [car, invoices] = await Promise.all([
      sb.from('cars').select('*').eq('id', rental.carId).maybeSingle(),
      sb.from('invoices').select('*').eq('rental_id', rental.id).order('due_date', { ascending: false }),
    ]);
    const carRowData = maybe(car);
    return {
      customer: toCustomer(c),
      rental,
      car: carRowData ? toCar(carRowData) : null,
      invoices: check(invoices).map(toInvoice),
    };
  },

  async setInvoicePaid(invoiceId, paidOn) {
    const sb = await createSupabaseServer();
    check(await sb.from('invoices').update({ paid_on: paidOn }).eq('id', invoiceId));
  },

  async notifyPaid(_customerId, invoiceId) {
    // ownership is enforced inside the SQL function
    const sb = await createSupabaseServer();
    check(await sb.rpc('notify_paid', { p_invoice: invoiceId }));
  },

  async setCarStatus(carId, status) {
    const sb = await createSupabaseServer();
    check(await sb.from('cars').update({ status }).eq('id', carId));
  },

  async saveCar(input, id) {
    const sb = await createSupabaseServer();
    if (id) {
      check(await sb.from('cars').update(carRow(input)).eq('id', id));
      return id;
    }
    const row = check(await sb.from('cars').insert({ ...carRow(input), sort_order: 1000 }).select('id').single()) as Row;
    return row.id as string;
  },

  async uploadCarPhoto(carId, file) {
    const sb = await createSupabaseServer();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${carId}/${Date.now()}.${ext}`;
    const up = await sb.storage.from('car-photos').upload(path, file, { contentType: file.type, upsert: true });
    if (up.error) throw new Error(up.error.message);
    const url = sb.storage.from('car-photos').getPublicUrl(path).data.publicUrl;
    check(await sb.from('cars').update({ photo_url: url }).eq('id', carId));
    return url;
  },

  async addCustomerWithRental(input) {
    const sb = await createSupabaseServer();
    const customer = check(
      await sb
        .from('customers')
        .insert({ first_name: input.firstName, last_name: input.lastName, phone: input.phone, licence_no: input.licenceNo })
        .select('id')
        .single(),
    ) as Row;
    const rental = await sb.from('rentals').insert({
      car_id: input.carId,
      customer_id: customer.id,
      start_date: input.startDate,
      weekly_rate: input.weeklyRate,
      bond_amount: input.weeklyRate * 2,
    });
    if (rental.error) {
      await sb.from('customers').delete().eq('id', customer.id);
      throw new Error(rental.error.message);
    }
    check(await sb.from('cars').update({ status: 'hire' }).eq('id', input.carId));
  },

  async endRental(rentalId, endDate) {
    const sb = await createSupabaseServer();
    const rental = check(await sb.from('rentals').update({ end_date: endDate }).eq('id', rentalId).select('car_id').single()) as Row;
    check(await sb.from('invoices').delete().eq('rental_id', rentalId).is('paid_on', null).gte('due_date', endDate));
    check(await sb.from('cars').update({ status: 'available' }).eq('id', rental.car_id));
  },

  async generateInvoices(today) {
    return generateInvoicesWith(await createSupabaseServer(), today);
  },
};
