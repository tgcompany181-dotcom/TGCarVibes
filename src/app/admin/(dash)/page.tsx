import Link from 'next/link';
import { ActionButton } from '@/components/ui/ActionButton';
import { Tag } from '@/components/ui/Tag';
import { getAdminData } from '@/lib/admin-data';
import { invoiceRows } from '@/lib/admin-rows';
import { fmtLong } from '@/lib/dates';
import { complianceItems, paymentTotals } from '@/lib/derive';
import { money } from '@/lib/format';
import { markPaid } from '../actions';
import s from '../admin.module.css';

export default async function Overview() {
  const { data, today, requests } = await getAdminData();
  const newRequests = requests?.filter((r) => r.status === 'new').length ?? 0;
  const count = (st: string) => data.cars.filter((c) => c.status === st).length;
  const pay = paymentTotals(data.invoices, today);
  const comp = complianceItems(data.cars, today);
  const overdue = invoiceRows(data, [...pay.overdue].sort((a, b) => a.dueDate.localeCompare(b.dueDate)), today);

  const kpis = [
    { label: 'On hire', value: count('hire'), sub: `of ${data.cars.length} cars` },
    { label: 'Available', value: count('available'), sub: 'ready to rent' },
    { label: 'In service', value: count('service'), sub: 'off the road' },
    { label: 'Collected ±7 days', value: money(pay.collected), sub: `of ${money(pay.expected)} expected` },
    { label: 'Overdue', value: money(pay.overdueAmount), sub: `${pay.overdueCount} payments`, red: pay.overdueCount > 0 },
    { label: 'Compliance', value: comp.length, sub: 'items due ≤ 30 days' },
  ];

  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Overview</h2>
      {newRequests > 0 && (
        <Link href="/admin/requests" className={s.newRequestsBanner}>
          <b>{newRequests === 1 ? '1 new booking request' : `${newRequests} new booking requests`}</b> from the website — view and call back →
        </Link>
      )}
      <div className={s.kpis}>
        {kpis.map((k) => (
          <div key={k.label} className={s.kpi}>
            <div className={s.kpiLabel}>{k.label}</div>
            <div className={`${s.kpiValue} ${k.red ? s.red : ''}`}>{k.value}</div>
            <div className={s.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div className={s.lists}>
        <section>
          <div className={s.listHead}>
            <h4>Overdue payments</h4>
            <Link className="btn btn-ghost" href="/admin/payments?f=overdue">
              All payments
            </Link>
          </div>
          {overdue.length === 0 && <div className={s.empty}>Nothing overdue.</div>}
          {overdue.map((r) => (
            <div key={r.id} className={s.item}>
              <div className={s.itemMain}>
                <div style={{ fontWeight: 600 }}>
                  {r.name} {r.notified && <Tag tone="outline">Customer says sent</Tag>}
                </div>
                <div className={s.itemSub}>
                  {r.plate} · due {r.dueText} · {r.lateText}
                </div>
              </div>
              <b>{r.amountText}</b>
              {r.reminderHref && <a className="btn btn-secondary btn-sm" href={r.reminderHref} target="_blank" rel="noopener noreferrer">
                Message
              </a>}
              <ActionButton action={markPaid.bind(null, r.id)} success={`${r.name} marked paid`}>
                Mark paid
              </ActionButton>
            </div>
          ))}
        </section>
        <section>
          <div className={s.listHead}>
            <h4>Due in the next 30 days</h4>
            <Link className="btn btn-ghost" href="/admin/compliance">
              Compliance
            </Link>
          </div>
          {comp.length === 0 && <div className={s.empty}>Nothing due.</div>}
          {comp.slice(0, 8).map((x) => (
            <div key={x.kind + x.car.id} className={s.item}>
              <div className={s.itemMain}>
                <div style={{ fontWeight: 600 }}>
                  {x.kind} · {x.car.plate ?? 'no plate'}
                </div>
                <div className={s.itemSub}>
                  {x.car.model} {x.car.year} · {fmtLong(x.date)}
                </div>
              </div>
              <Tag tone={x.days < 7 ? 'accent' : 'outline'}>{x.days < 0 ? `Overdue ${-x.days}d` : x.days === 0 ? 'Today' : `In ${x.days}d`}</Tag>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
