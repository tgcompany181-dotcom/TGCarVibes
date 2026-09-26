'use client';

import { useState, useTransition } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { Dialog } from '@/components/ui/Dialog';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { fmtLong, todaySydney } from '@/lib/dates';
import { dueDateTag, WARN_DAYS, type Tone } from '@/lib/derive';
import { km, money } from '@/lib/format';
import type { Car, ISODate, ServiceRecord } from '@/lib/types';
import { addService, deleteService, updateService } from '../../actions';
import s from '../../admin.module.css';

/** Km-based service reminder from the latest record, e.g. "or at 185,000 km". */
function kmTag(nextKm: number | null, odometer: number | null): { label: string; tone: Tone } | null {
  if (nextKm == null) return null;
  if (odometer == null) return { label: `at ${km(nextKm)}`, tone: 'neutral' };
  const left = nextKm - odometer;
  if (left <= 0) return { label: `${km(-left)} over`, tone: 'accent' };
  if (left <= 1000) return { label: `${km(left)} left`, tone: 'outline' };
  return { label: `at ${km(nextKm)}`, tone: 'neutral' };
}

/**
 * The km the next service is due at. Early records may hold the gap ("5000")
 * rather than the reading, so a value below the service odometer is treated as a gap.
 */
function nextKmOf(r: ServiceRecord | undefined): number | null {
  if (!r || r.nextKm == null) return null;
  if (r.odometer != null && r.nextKm <= r.odometer) return r.odometer + r.nextKm;
  // Ignore values mistyped with other text mixed in (e.g. 19,700,022,156,016 km).
  if (r.nextKm > (r.odometer ?? 0) + 200_000) return null;
  return r.nextKm;
}

export function ComplianceTable({ cars, services, today }: { cars: Car[]; services: ServiceRecord[] | null; today: ISODate }) {
  const [open, setOpen] = useState<Car | null>(null);
  const byCar = (id: string) => (services ?? []).filter((r) => r.carId === id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Plate</th>
              <th>Car</th>
              <th>Rego expires</th>
              <th>Next service</th>
              <th>Last service</th>
              <th>Odometer</th>
              {services && <th />}
            </tr>
          </thead>
          <tbody>
            {cars.map((c) => {
              const rego = dueDateTag(c.regoExpiry, today);
              const svc = dueDateTag(c.serviceDue, today, WARN_DAYS.Service);
              const last = byCar(c.id)[0];
              const kt = kmTag(nextKmOf(last), c.odometer);
              return (
                <tr key={c.id} onClick={services ? () => setOpen(c) : undefined} style={services ? { cursor: 'pointer' } : undefined}>
                  <td className={s.plate}>{c.plate ?? '—'}</td>
                  <td>
                    {c.model} <span className="muted">{c.year}</span>
                  </td>
                  <td>
                    <Tag tone={rego.tone}>{rego.label}</Tag>
                  </td>
                  <td>
                    <div className={s.tags}>
                      {(c.serviceDue || !kt) && <Tag tone={svc.tone}>{svc.label}</Tag>}
                      {kt && <Tag tone={kt.tone}>{kt.label}</Tag>}
                    </div>
                    {last?.nextNote && (
                      <div className={s.itemSub} style={{ marginTop: 4, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={last.nextNote}>
                        To do: {last.nextNote}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    {last ? (
                      <>
                        <div className={s.nowrap}>{fmtLong(last.date)}</div>
                        <div className={s.itemSub} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={last.work}>
                          {last.work}
                        </div>
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className={s.nowrap}>{km(c.odometer)}</td>
                  {services && (
                    <td className={s.right}>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => (e.stopPropagation(), setOpen(c))}>
                        Service log
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && <ServiceDialog car={open} records={byCar(open.id)} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Default gap between services. */
const SERVICE_MONTHS = 4;

function plusMonths(d: string, n: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const [y, m, day] = d.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(day, last))).toISOString().slice(0, 10);
}

function ServiceDialog({ car, records, onClose }: { car: Car; records: ServiceRecord[]; onClose: () => void }) {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const flash = useToast();
  const [date, setDate] = useState(todaySydney());
  const [nextDate, setNextDate] = useState(plusMonths(todaySydney(), SERVICE_MONTHS));
  const [odo, setOdo] = useState(car.odometer != null ? String(car.odometer) : '');
  const [every, setEvery] = useState('');
  const digits = (v: string) => (v.replace(/[^\d]/g, '') ? Number(v.replace(/[^\d]/g, '')) : null);
  const nextAt = digits(odo) != null && digits(every) != null ? digits(odo)! + digits(every)! : null;
  const [editing, setEditing] = useState<ServiceRecord | null>(null);

  const reset = () => {
    setEditing(null);
    setError('');
    setFormKey((k) => k + 1);
    setDate(todaySydney());
    setNextDate(plusMonths(todaySydney(), SERVICE_MONTHS));
    setOdo(car.odometer != null ? String(car.odometer) : '');
    setEvery('');
  };

  const startEdit = (r: ServiceRecord) => {
    const at = nextKmOf(r);
    setEditing(r);
    setError('');
    setFormKey((k) => k + 1);
    setDate(r.date);
    setNextDate(r.nextDate ?? '');
    setOdo(r.odometer != null ? String(r.odometer) : '');
    setEvery(at != null && r.odometer != null ? String(at - r.odometer) : '');
    document.getElementById('svc-title')?.scrollIntoView({ behavior: 'smooth' });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start(async () => {
      const res = editing ? await updateService(editing.id, form) : await addService(car.id, form);
      if (!res.ok) return setError(res.error);
      flash(editing ? 'Service updated' : 'Service saved');
      reset();
    });
  };

  return (
    <Dialog onClose={onClose} width={640} labelledBy="svc-title">
      <div id="svc-title" className="dialog-title">
        Service log · {car.plate ?? ''} {car.model} {car.year}
      </div>
      {editing && (
        <div className="muted" style={{ marginBottom: 12, fontWeight: 600 }}>
          Editing the service of {fmtLong(editing.date)}
        </div>
      )}

      <form key={formKey} onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="svc-date">Service date</label>
            <input
              id="svc-date"
              name="date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setNextDate(plusMonths(e.target.value, SERVICE_MONTHS));
              }}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="svc-odo">Odometer (km)</label>
            <input id="svc-odo" name="odometer" className="input" inputMode="numeric" value={odo} onChange={(e) => setOdo(e.target.value)} placeholder="182000" />
          </div>
          <div className="field">
            <label htmlFor="svc-cost">Cost ($)</label>
            <input id="svc-cost" name="cost" className="input" inputMode="decimal" placeholder="optional" defaultValue={editing?.cost ?? ''} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="svc-work">Work done</label>
          <textarea
            id="svc-work"
            name="work"
            className="input"
            rows={3}
            required
            defaultValue={editing?.work ?? ''}
            placeholder="e.g. Oil + oil filter, 2 front tyres, brake pads front, wipers. Mechanic: ABC Auto Bankstown"
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="svc-next">Next service date ({SERVICE_MONTHS} months, change if needed)</label>
            <input id="svc-next" name="nextDate" type="date" className="input" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="svc-nextkm">Or after (km)</label>
            <input
              id="svc-nextkm"
              name="nextKmIn"
              className="input"
              inputMode="numeric"
              value={every}
              onChange={(e) => setEvery(e.target.value)}
              placeholder="e.g. 10000"
            />
            {nextAt != null && <div className={s.itemSub}>Next service at {km(nextAt)}</div>}
            {nextAt == null && digits(every) != null && <div className="form-error">Enter the odometer above first</div>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="svc-nextnote">Notes for next service (optional)</label>
          <input id="svc-nextnote" name="nextNote" className="input" placeholder="e.g. Replace rear tyres, check aircon" defaultValue={editing?.nextNote ?? ''} />
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="dialog-actions">
          {editing ? (
            <button type="button" className="btn btn-secondary" onClick={reset}>
              Cancel edit
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
          <button className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Save service'}
          </button>
        </div>
      </form>

      <h4 style={{ margin: '20px 0 0' }}>History</h4>
      {records.length === 0 ? (
        <div className={s.empty}>No services recorded yet.</div>
      ) : (
        records.map((r) => (
          <div key={r.id} className={s.item} style={{ alignItems: 'flex-start' }}>
            <div className={s.itemMain}>
              <b>{fmtLong(r.date)}</b>
              {r.odometer != null && <span className="muted"> · {km(r.odometer)}</span>}
              {r.cost != null && <span className="muted"> · {money(r.cost)}</span>}
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, margin: '2px 0' }}>{r.work}</div>
              {(r.nextDate || nextKmOf(r) != null) && (
                <div className={s.itemSub}>
                  Next: {[r.nextDate && fmtLong(r.nextDate), nextKmOf(r) != null && km(nextKmOf(r))].filter(Boolean).join(' or ')}
                </div>
              )}
              {r.nextNote && <div className={s.itemSub}>To do next time: {r.nextNote}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => startEdit(r)}>
              Edit
            </button>
            <ActionButton action={deleteService.bind(null, r.id)} className="btn btn-ghost btn-sm" success="Service deleted" confirmText="Delete this service record?">
              Delete
            </ActionButton>
          </div>
        ))
      )}
    </Dialog>
  );
}
