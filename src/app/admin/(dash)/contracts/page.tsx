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

  // customers with an active hire → prefill the new-contract form
  const hires: HireOption[] = [...ix.activeRentalByCustomer.values()].flatMap((r) => {
    const c = ix.customerById.get(r.customerId);
    const car = ix.carById.get(r.carId);
    if (!c || !car) return [];
    return [
      {
        customerId: c.id,
        label: `${c.firstName} ${c.lastName} — ${car.plate ?? ''} ${car.model} ${car.year}`.trim(),
        renterName: `${c.firstName} ${c.lastName}`.trim(),
        mobile: displayPhone(c.phone),
        vehicleRego: car.plate ?? '',
        vehicleDescription: `${car.model} ${car.year}`,
        start: r.startDate,
        end: addDays(r.startDate, 56),
        weeklyRent: r.weeklyRate,
        bond: r.bondAmount,
      },
    ];
  });

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
