import { getAdminData } from '@/lib/admin-data';
import { getRepo } from '@/lib/data';
import { ComplianceTable } from './ComplianceTable';

export default async function CompliancePage() {
  const { data, today } = await getAdminData();
  const services = (await getRepo().listServices?.()) ?? null;
  const soonest = (d: (string | null)[]) => d.filter(Boolean).sort()[0] ?? '9999-12-31';
  const cars = [...data.cars].sort((a, b) => soonest([a.regoExpiry, a.serviceDue]).localeCompare(soonest([b.regoExpiry, b.serviceDue])));

  return (
    <>
      <h2 style={{ margin: '0 0 4px' }}>Rego &amp; servicing</h2>
      <div className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        Sorted by what’s due first. Items within 30 days are highlighted. Click <b>Service log</b> to record a service and set the next one.
      </div>
      <ComplianceTable cars={cars} services={services} today={today} />
    </>
  );
}
