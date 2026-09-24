import { getAdminData } from '@/lib/admin-data';
import { invoiceRows } from '@/lib/admin-rows';
import { BUSINESS } from '@/lib/config';
import { addDays } from '@/lib/dates';
import { paymentTotals } from '@/lib/derive';
import { money } from '@/lib/format';
import s from '../../admin.module.css';
import { PaymentsTable } from './PaymentsTable';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const { data, today } = await getAdminData();
  const pay = paymentTotals(data.invoices, today);
  // recent invoices (last 2 weeks) plus anything still unpaid
  const recent = data.invoices.filter((i) => i.dueDate >= addDays(today, -14) || !i.paidOn);
  const order = (c: string) => (c === 'overdue' ? 0 : c === 'due' ? 1 : 2);
  const rows = invoiceRows(data, recent, today).sort(
    (a, b) => order(a.status.cat) - order(b.status.cat) || (a.status.cat === 'paid' ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate)),
  );

  const kpis = [
    { label: 'Overdue', value: money(pay.overdueAmount), red: pay.overdueCount > 0 },
    { label: 'Due next 7 days', value: money(pay.upcomingAmount) },
    { label: 'Collected ±7 days', value: money(pay.collected) },
    { label: 'Awaiting confirmation', value: String(pay.awaitingConfirmation) },
  ];

  return (
    <>
      <div className={s.head} style={{ marginBottom: 8 }}>
        <h2>Payments</h2>
        <div className="muted" style={{ fontSize: 13 }}>
          PayID {BUSINESS.payId} · reference = plate
        </div>
      </div>
      <div className={s.kpis}>
        {kpis.map((k) => (
          <div key={k.label} className={s.kpi} style={{ paddingTop: 14, paddingBottom: 14 }}>
            <div className={s.kpiLabel}>{k.label}</div>
            <div className={`${s.kpiValue} ${s.kpiValueSm} ${k.red ? s.red : ''}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <PaymentsTable rows={rows} initialFilter={f === 'overdue' || f === 'due' || f === 'paid' ? f : 'all'} />
    </>
  );
}
