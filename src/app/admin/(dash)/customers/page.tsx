import { getAdminData } from '@/lib/admin-data';
import { dataMode } from '@/lib/config';
import { fmtLong, fmtShort } from '@/lib/dates';
import { currentInvoice, indexAdmin, invoiceStatus } from '@/lib/derive';
import { displayPhone, money } from '@/lib/format';
import { CustomersTable, type CustomerRow } from './CustomersTable';

export default async function CustomersPage() {
  const { data, today } = await getAdminData();
  const ix = indexAdmin(data, today);

  const rows: CustomerRow[] = data.customers.map((c) => {
    const rental = ix.activeRentalByCustomer.get(c.id) ?? null;
    const car = rental ? ix.carById.get(rental.carId) : undefined;
    const inv = rental ? currentInvoice(ix.invoicesByRental.get(rental.id) ?? []) : null;
    const st = inv ? invoiceStatus(inv, today) : null;
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      firstName: c.firstName,
      lastName: c.lastName,
      licenceNo: c.licenceNo ?? '',
      phone: c.phone,
      phoneText: displayPhone(c.phone),
      rentalId: rental?.id ?? null,
      plate: car?.plate ?? (rental ? '—' : ''),
      model: car ? `${car.model} ${car.year}` : '',
      rateText: rental ? money(rental.weeklyRate) : '—',
      sinceText: rental ? fmtLong(rental.startDate) : '—',
      dueText: inv ? fmtShort(inv.dueDate) : '—',
      statusText: rental ? (st?.label ?? '—') : 'No car',
      tone: rental ? (st?.tone ?? 'neutral') : 'neutral',
    };
  });
  rows.sort((a, b) => Number(!a.rentalId) - Number(!b.rentalId) || a.name.localeCompare(b.name));

  const availableCars = data.cars
    .filter((c) => c.status === 'available' && !ix.activeRentalByCar.has(c.id))
    .map((c) => ({ id: c.id, label: `${c.plate ?? 'no plate'} · ${c.model} ${c.year}`, rate: c.weeklyRate }));

  return (
    <CustomersTable
      rows={rows}
      availableCars={availableCars}
      today={today}
      activeCount={ix.activeRentalByCustomer.size}
      usePins={dataMode() !== 'supabase'}
    />
  );
}
