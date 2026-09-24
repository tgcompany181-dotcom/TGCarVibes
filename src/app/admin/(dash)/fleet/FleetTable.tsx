'use client';

import { useMemo, useState, useTransition } from 'react';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { dueDateTag } from '@/lib/derive';
import { km, money } from '@/lib/format';
import type { Car, CarStatus } from '@/lib/types';
import { setCarStatus } from '../../actions';
import s from '../../admin.module.css';
import { CarDialog } from './CarDialog';

const FILTERS: [CarStatus | 'all', string][] = [
  ['all', 'All'],
  ['hire', 'On hire'],
  ['available', 'Available'],
  ['service', 'In service'],
];

export function FleetTable({ cars, customerByCar, today }: { cars: Car[]; customerByCar: Record<string, string>; today: string }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState<CarStatus | 'all'>('all');
  const [editing, setEditing] = useState<Car | 'new' | null>(null);
  const [pending, start] = useTransition();
  const flash = useToast();

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cars.filter(
      (c) =>
        (f === 'all' || c.status === f) &&
        (!needle || [c.plate, c.model, String(c.year), customerByCar[c.id]].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [cars, q, f, customerByCar]);

  const onStatus = (car: Car, status: CarStatus) =>
    start(async () => {
      const res = await setCarStatus(car.id, status);
      flash(res.ok ? `${car.plate ?? car.model} updated` : res.error);
    });

  return (
    <>
      <div className={s.head}>
        <h2>
          Fleet <span className={s.count}>{cars.length}</span>
        </h2>
        <input className={`input ${s.search}`} placeholder="Search plate, model or customer" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search fleet" />
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add car
        </button>
      </div>
      <div className="seg" style={{ marginBottom: 16 }}>
        {FILTERS.map(([id, label]) => (
          <button key={id} className={f === id ? 'on-accent' : undefined} aria-pressed={f === id} onClick={() => setF(id)}>
            {label} · {id === 'all' ? cars.length : cars.filter((c) => c.status === id).length}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Plate</th>
              <th>Car</th>
              <th>Customer</th>
              <th>Rate / wk</th>
              <th>Odometer</th>
              <th>Rego</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="empty" colSpan={8}>No cars match.</td>
              </tr>
            )}
            {rows.map((c) => {
              const rego = dueDateTag(c.regoExpiry, today);
              return (
                <tr key={c.id}>
                  <td className={s.plate}>{c.plate ?? '—'}</td>
                  <td>
                    {c.model} <span className="muted">{c.year}</span>
                    {!c.listed && <span className="muted"> · hidden</span>}
                  </td>
                  <td>{customerByCar[c.id] ?? '—'}</td>
                  <td>{money(c.weeklyRate)}</td>
                  <td className={s.nowrap}>{km(c.odometer)}</td>
                  <td>
                    <Tag tone={rego.tone}>{rego.label}</Tag>
                  </td>
                  <td>
                    <select
                      className={`input ${s.statusSelect}`}
                      value={c.status}
                      disabled={pending}
                      onChange={(e) => onStatus(c, e.target.value as CarStatus)}
                      aria-label={`Status of ${c.plate ?? c.model}`}
                    >
                      <option value="hire">On hire</option>
                      <option value="available">Available</option>
                      <option value="service">In service</option>
                    </select>
                  </td>
                  <td className={s.right}>
                    <button className="btn btn-ghost" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && <CarDialog car={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
