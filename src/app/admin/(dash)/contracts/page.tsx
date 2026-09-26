import { headers } from 'next/headers';
import { getAdminData } from '@/lib/admin-data';
import { addDays, todaySydney } from '@/lib/dates';
import { indexAdmin } from '@/lib/derive';
import { displayPhone } from '@/lib/format';
import { ContractsList, type HireOption } from './ContractsList';

export default async function ContractsPage() {
  const { data, contracts } = await getAdminData();
  if (!contracts) return <p className="muted">Online contracts are not available in this setup.</p>;
  const today = todaySydney();
  const ix = indexAdmin(data, today);

  // every customer can be picked; those with an active hire also prefill the car and rent
  const hires: HireOption[] = data.customers.map((c) => {
    const r = ix.activeRentalByCustomer.get(c.id);
    const car = r ? ix.carById.get(r.carId) : undefined;
    const name = `${c.firstName} ${c.lastName}`.trim();
    return {
      customerId: c.id,
      label: car ? `${name} — ${car.plate ?? ''} ${car.model} ${car.year}`.replace(/\s+/g, ' ') : `${name} — no current hire`,
      renterName: name,
      mobile: displayPhone(c.phone),
      vehicleRego: car?.plate ?? '',
      vehicleDescription: car ? `${car.model} ${car.year}` : '',
      start: r?.startDate ?? today,
      end: r ? addDays(r.startDate, 56) : '',
      weeklyRent: r?.weeklyRate ?? car?.weeklyRate ?? 0,
      bond: r?.bondAmount ?? 0,
    };
  });
  hires.sort((a, b) => Number(!a.vehicleRego) - Number(!b.vehicleRego) || a.renterName.localeCompare(b.renterName));

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'tgcarvibes.com';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const nameById = new Map(data.customers.map((c) => [c.id, c]));

  return (
    <ContractsList
      contracts={contracts.map((c) => ({ ...c, customerEmail: '', customerPhone: c.customerId ? nameById.get(c.customerId)?.phone ?? null : null }))}
      hires={hires}
      today={today}
      siteUrl={`${proto}://${host}`}
    />
  );
}
