import { Tag } from '@/components/ui/Tag';
import { getAdminData } from '@/lib/admin-data';
import { dueDateTag } from '@/lib/derive';
import { km } from '@/lib/format';
import s from '../../admin.module.css';

export default async function CompliancePage() {
  const { data, today } = await getAdminData();
  const soonest = (d: (string | null)[]) => d.filter(Boolean).sort()[0] ?? '9999-12-31';
  const cars = [...data.cars].sort((a, b) => soonest([a.regoExpiry, a.serviceDue]).localeCompare(soonest([b.regoExpiry, b.serviceDue])));

  return (
    <>
      <h2 style={{ margin: '0 0 4px' }}>Rego &amp; servicing</h2>
      <div className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        Sorted by what’s due first. Items within 30 days are highlighted. Update dates from Fleet → Edit.
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Plate</th>
              <th>Car</th>
              <th>Rego expires</th>
              <th>Next service</th>
              <th>Odometer</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((c) => {
              const rego = dueDateTag(c.regoExpiry, today);
              const svc = dueDateTag(c.serviceDue, today);
              return (
                <tr key={c.id}>
                  <td className={s.plate}>{c.plate ?? '—'}</td>
                  <td>
                    {c.model} <span className="muted">{c.year}</span>
                  </td>
                  <td>
                    <Tag tone={rego.tone}>{rego.label}</Tag>
                  </td>
                  <td>
                    <Tag tone={svc.tone}>{svc.label}</Tag>
                  </td>
                  <td className={s.nowrap}>{km(c.odometer)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
