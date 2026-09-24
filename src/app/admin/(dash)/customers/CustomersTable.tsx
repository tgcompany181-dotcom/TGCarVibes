'use client';

import { useMemo, useState, useTransition } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import type { Tone } from '@/lib/derive';
import { whatsappLink } from '@/lib/format';
import { addCustomer, endRental, resetCustomerPin, updateCustomer } from '../../actions';
import s from '../../admin.module.css';

export interface CustomerRow {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  licenceNo: string;
  phone: string | null;
  phoneText: string;
  rentalId: string | null;
  plate: string;
  model: string;
  rateText: string;
  sinceText: string;
  dueText: string;
  statusText: string;
  tone: Tone;
}

type CarOption = { id: string; label: string; rate: number };

export function CustomersTable({
  rows,
  availableCars,
  today,
  activeCount,
  usePins,
}: {
  rows: CustomerRow[];
  availableCars: CarOption[];
  today: string;
  activeCount: number;
  usePins: boolean;
}) {
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [ending, setEnding] = useState<CustomerRow | null>(null);
  const [editing, setEditing] = useState<CustomerRow | null>(null);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    const digits = n.replace(/\D/g, '');
    return rows.filter(
      (r) => !n || r.name.toLowerCase().includes(n) || r.plate.toLowerCase().includes(n) || (digits && ((r.phone ?? '').includes(digits) || r.phoneText.replace(/\D/g, '').includes(digits))),
    );
  }, [rows, q]);

  return (
    <>
      <div className={s.head}>
        <h2>
          Customers <span className={s.count}>{activeCount}</span>
        </h2>
        <input className={`input ${s.search}`} placeholder="Search name, phone or plate" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          + New hire
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Car</th>
              <th>Rate / wk</th>
              <th>Hired since</th>
              <th>Next due</th>
              <th>Payment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td className="empty" colSpan={8}>No customers match.</td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td className={s.nowrap}>{r.phoneText || <span className="muted">no mobile</span>}</td>
                <td>
                  <span className={s.plate}>{r.plate}</span> <span className="muted">{r.model}</span>
                </td>
                <td>{r.rateText}</td>
                <td className={s.nowrap}>{r.sinceText}</td>
                <td className={s.nowrap}>{r.dueText}</td>
                <td>
                  <Tag tone={r.tone}>{r.statusText}</Tag>
                </td>
                <td className={s.nowrap}>
                  {r.phone && (
                    <>
                      <a className="btn btn-ghost" href={`tel:0${r.phone.slice(2)}`}>
                        Call
                      </a>{' '}
                      <a className="btn btn-ghost" href={whatsappLink(r.phone)} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>{' '}
                    </>
                  )}
                  <button className="btn btn-ghost" onClick={() => setEditing(r)}>
                    Edit
                  </button>{' '}
                  {r.rentalId && (
                    <button className="btn btn-ghost" onClick={() => setEnding(r)}>
                      End hire
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adding && <NewHireDialog cars={availableCars} today={today} onClose={() => setAdding(false)} />}
      {ending && <EndHireDialog row={ending} today={today} onClose={() => setEnding(null)} />}
      {editing && <EditCustomerDialog row={editing} usePins={usePins} onClose={() => setEditing(null)} />}
    </>
  );
}

function NewHireDialog({ cars, today, onClose }: { cars: CarOption[]; today: string; onClose: () => void }) {
  const [carId, setCarId] = useState(cars[0]?.id ?? '');
  const [rate, setRate] = useState(String(cars[0]?.rate ?? ''));
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const flash = useToast();

  const submit = (form: FormData) =>
    start(async () => {
      const res = await addCustomer(form);
      if (!res.ok) return setError(res.error);
      flash(`${form.get('firstName')} added`);
      onClose();
    });

  return (
    <Dialog onClose={onClose} width={520} labelledBy="hire-title">
      <div id="hire-title" className="dialog-title">
        New hire
      </div>
      {cars.length === 0 ? (
        <>
          <div className="muted">No available cars. Set a car to “Available” in Fleet first.</div>
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <form action={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" name="firstName" className="input" required />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" name="lastName" className="input" required />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="phone">Mobile (used to sign in)</label>
              <input id="phone" name="phone" type="tel" className="input" placeholder="0412 345 678" required />
            </div>
            <div className="field">
              <label htmlFor="licenceNo">Licence no.</label>
              <input id="licenceNo" name="licenceNo" className="input" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="carId">Car</label>
            <select
              id="carId"
              name="carId"
              className="input"
              value={carId}
              onChange={(e) => {
                setCarId(e.target.value);
                setRate(String(cars.find((c) => c.id === e.target.value)?.rate ?? ''));
              }}
            >
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="startDate">Pick-up date (first payment due)</label>
              <input id="startDate" name="startDate" type="date" className="input" defaultValue={today} required />
            </div>
            <div className="field">
              <label htmlFor="weeklyRate">Rate / wk ($)</label>
              <input id="weeklyRate" name="weeklyRate" className="input" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} required />
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            Bond recorded as 2 weeks’ rent (${(Number(rate) || 0) * 2}). Weekly payments are created automatically every 7 days from the pick-up date.
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={pending}>
              {pending ? 'Saving…' : 'Start hire'}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function EndHireDialog({ row, today, onClose }: { row: CustomerRow; today: string; onClose: () => void }) {
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const flash = useToast();

  const submit = () =>
    start(async () => {
      const res = await endRental(row.rentalId!, date);
      if (!res.ok) return setError(res.error);
      flash(`${row.plate} returned — now available`);
      onClose();
    });

  return (
    <Dialog onClose={onClose} labelledBy="end-title">
      <div id="end-title" className="dialog-title">
        End hire — {row.name}
      </div>
      <div className="muted" style={{ fontSize: 14 }}>
        {row.plate} {row.model} goes back to “Available”. Unpaid weeks due on or after the return date are removed; earlier unpaid weeks stay
        on record. Remember to refund the bond.
      </div>
      <div className="field">
        <label htmlFor="endDate">Return date</label>
        <input id="endDate" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={pending}>
          {pending ? 'Saving…' : 'End hire'}
        </button>
      </div>
    </Dialog>
  );
}

function EditCustomerDialog({ row, usePins, onClose }: { row: CustomerRow; usePins: boolean; onClose: () => void }) {
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [pending, start] = useTransition();
  const flash = useToast();

  const submit = (form: FormData) =>
    start(async () => {
      const res = await updateCustomer(row.id, form);
      if (!res.ok) return setError(res.error);
      flash('Customer updated');
      onClose();
    });

  const newPin = () =>
    start(async () => {
      const res = await resetCustomerPin(row.id);
      if (!res.ok) return setError(res.error);
      setPin(res.pin);
    });

  const smsText = `Hi ${row.firstName}, your TG Car Vibes app login: https://tgcarvibes.com/my — mobile ${row.phoneText}, PIN ${pin}`;

  return (
    <Dialog onClose={onClose} width={520} labelledBy="cust-title">
      <div id="cust-title" className="dialog-title">
        {row.name}
      </div>
      <form action={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="c-first">First name</label>
            <input id="c-first" name="firstName" className="input" defaultValue={row.firstName} required />
          </div>
          <div className="field">
            <label htmlFor="c-last">Last name</label>
            <input id="c-last" name="lastName" className="input" defaultValue={row.lastName} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="c-phone">Mobile (used to sign in)</label>
            <input id="c-phone" name="phone" type="tel" className="input" defaultValue={row.phoneText} placeholder="0412 345 678" />
          </div>
          <div className="field">
            <label htmlFor="c-lic">Licence no.</label>
            <input id="c-lic" name="licenceNo" className="input" defaultValue={row.licenceNo} />
          </div>
        </div>
        {usePins && (
          <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 800 }}>App login PIN</div>
            {pin ? (
              <>
                <div>
                  New PIN: <b style={{ fontSize: 22, letterSpacing: '0.1em' }}>{pin}</b>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Shown once only — send it to the customer now. Any old PIN no longer works.
                </div>
                {row.phone && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a className="btn btn-secondary btn-sm" href={`sms:0${row.phone.slice(2)}?&body=${encodeURIComponent(smsText)}`}>
                      Send by SMS
                    </a>
                    <a className="btn btn-secondary btn-sm" href={whatsappLink(row.phone, smsText)} target="_blank" rel="noopener noreferrer">
                      Send on WhatsApp
                    </a>
                  </div>
                )}
              </>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={newPin} disabled={pending}>
                Create new PIN
              </button>
            )}
          </div>
        )}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
