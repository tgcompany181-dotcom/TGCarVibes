import { Tag } from '@/components/ui/Tag';
import { BUSINESS } from '@/lib/config';
import { fmtLong, fmtShort, todaySydney } from '@/lib/dates';
import { invoiceStatus } from '@/lib/derive';
import { money, plural } from '@/lib/format';
import { getMyData } from '@/lib/my-data';
import s from '../../my.module.css';

export default async function MyPayments() {
  const { invoices } = await getMyData();
  const today = todaySydney();
  const list = [...invoices].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const paid = list.filter((i) => i.paidOn);

  return (
    <div className={s.section}>
      <h3 style={{ margin: '0 0 4px' }}>Payments</h3>
      <div className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
        {money(paid.reduce((a, i) => a + i.amount, 0))} paid over {plural(paid.length, 'week')}
      </div>
      <div className="rows">
        {list.length === 0 && <div className="muted" style={{ padding: '14px 0' }}>No payments yet.</div>}
        {list.map((i) => {
          const st = invoiceStatus(i, today);
          return (
            <div key={i.id} className={s.hist}>
              <div>
                <div style={{ fontWeight: 600 }}>Week due {fmtShort(i.dueDate)}</div>
                <div className={s.histSub}>
                  {i.paidOn ? `Received ${fmtLong(i.paidOn)}` : i.customerNotified ? 'Transfer sent, awaiting confirmation' : `PayID ${BUSINESS.payId}`}
                </div>
              </div>
              <div className={s.histRight}>
                <b>{money(i.amount)}</b>
                <Tag tone={st.tone}>{st.label}</Tag>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
