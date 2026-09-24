import { Car as CarIcon } from 'lucide-react';
import Image from 'next/image';
import { Tag } from '@/components/ui/Tag';
import { BUSINESS, telHref } from '@/lib/config';
import { fmtLong, fmtShort, todaySydney } from '@/lib/dates';
import { currentInvoice, invoiceStatus } from '@/lib/derive';
import { money } from '@/lib/format';
import { getMyData } from '@/lib/my-data';
import s from '../my.module.css';
import { PayActions } from './PayActions';

export default async function MyHome() {
  const { rental, car, invoices } = await getMyData();
  const today = todaySydney();
  const cur = currentInvoice(invoices);

  if (!rental || !car) {
    return (
      <div className={s.section}>
        <h3>No active rental</h3>
        <p className="muted">
          Call {BUSINESS.ownerName} on <a href={telHref}>{BUSINESS.ownerPhone}</a> to book your next car.
        </p>
      </div>
    );
  }

  const status = cur ? invoiceStatus(cur, today) : null;
  const blockClass = !cur || cur.paidOn ? s.payPaid : status?.cat === 'overdue' ? s.payOverdue : '';

  return (
    <>
      {cur && status && (
        <section className={`${s.pay} ${blockClass}`} aria-label="Next payment">
          <div className="kicker">{cur.paidOn ? 'Latest payment' : 'Next payment'}</div>
          <div className={s.amountRow}>
            <div className={s.amount}>{money(cur.amount)}</div>
            <Tag tone={status.tone}>{cur.paidOn ? `Paid ${fmtShort(cur.paidOn)}` : status.label}</Tag>
          </div>
          <div style={{ fontSize: 15 }}>Due {fmtShort(cur.dueDate)}</div>
          {!cur.paidOn && (
            <>
              <div className={s.payRows}>
                <div className="row"><span>PayID</span><span>{BUSINESS.payId}</span></div>
                <div className="row"><span>Account name</span><span>{BUSINESS.accountName}</span></div>
                <div className="row"><span>Reference</span><span>{car.plate ?? '—'}</span></div>
              </div>
              <PayActions invoiceId={cur.id} notified={cur.customerNotified} />
            </>
          )}
        </section>
      )}

      <section className={s.section}>
        <h6 style={{ margin: '0 0 12px' }}>Your car</h6>
        <div className={s.carPhoto}>
          {car.photoUrl ? (
            <Image src={car.photoUrl} alt={`${car.model} ${car.year}`} fill sizes="480px" unoptimized={car.photoUrl.startsWith('data:')} />
          ) : (
            <CarIcon size={56} strokeWidth={1.5} aria-hidden />
          )}
        </div>
        <div className={s.carHead}>
          <div className={s.carName}>
            {car.model} {car.year}
          </div>
          {car.plate && <div className={s.plate}>{car.plate}</div>}
        </div>
        <div className="rows" style={{ marginTop: 12 }}>
          <div className="row"><span>Weekly rate</span><span>{money(rental.weeklyRate)}</span></div>
          <div className="row"><span>Hired since</span><span>{fmtLong(rental.startDate)}</span></div>
          <div className="row"><span>Rego expires</span><span>{car.regoExpiry ? fmtLong(car.regoExpiry) : '—'}</span></div>
          <div className="row"><span>Next service</span><span>{car.serviceDue ? fmtLong(car.serviceDue) : '—'}</span></div>
          <div className="row"><span>Bond held</span><span>{rental.bondStatus === 'refunded' ? 'Refunded' : money(rental.bondAmount)}</span></div>
        </div>
      </section>
    </>
  );
}
