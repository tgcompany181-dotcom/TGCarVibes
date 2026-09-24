import { getAdminData } from '@/lib/admin-data';
import { indexAdmin } from '@/lib/derive';
import { FleetTable } from './FleetTable';

export default async function FleetPage() {
  const { data, today } = await getAdminData();
  const ix = indexAdmin(data, today);
  const customerByCar: Record<string, string> = {};
  for (const [carId, r] of ix.activeRentalByCar) {
    const c = ix.customerById.get(r.customerId);
    if (c) customerByCar[carId] = `${c.firstName} ${c.lastName}`;
  }
  return <FleetTable cars={data.cars} customerByCar={customerByCar} today={today} />;
}
