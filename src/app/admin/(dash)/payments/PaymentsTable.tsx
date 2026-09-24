'use client';

import { useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { Tag } from '@/components/ui/Tag';
import type { InvoiceRow } from '@/lib/admin-rows';
import { fmtShort } from '@/lib/dates';
import { markPaid, undoPaid } from '../../actions';
import s from '../../admin.module.css';

type Filter = 'all' | 'overdue' | 'due' | 'paid';
const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['overdue', 'Overdue'],
  ['due', 'Upcoming'],
  ['paid', 'Paid'],
];

export function PaymentsTable({ rows, initialFilter }: { rows: InvoiceRow[]; initialFilter: Filter }) {
  const [f, setF] = useState<Filter>(initialFilter);
  const [q, setQ] = useState('');
  const n = q.trim().toLowerCase();
  const shown = rows.filter((r) => (f === 'all' || r.status.cat === f) && (!n || r.name.toLowerCase().includes(n) || r.plate.toLowerCase().includes(n)));

  return (
    <>
      <div className={s.head}>
        <div className="seg">
          {FILTERS.map(([id, label]) => (
            <button key={id} className={f === id ? 'on-accent' : undefined} aria-pressed={f === id} onClick={() => setF(id)}>
              {label} · {id === 'all' ? rows.length : rows.filter((r) => r.status.cat === id).length}
            </button>
          ))}
        </div>
        <input className={`input ${s.search}`} style={{ marginLeft: 'auto' }} placeholder="Search name or plate" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search payments" />
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Due</th>
              <th>Customer</th>
              <th>Car</th>
              <th>Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td className="empty" colSpan={6}>Nothing here.</td>
              </tr>
            )}
            {shown.map((p) => (
              <tr key={p.id}>
                <td className={s.nowrap}>{p.dueText}</td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td className={s.plate}>{p.plate}</td>
                <td>{p.amountText}</td>
                <td>
                  <div className={s.tags}>
                    <Tag tone={p.status.tone}>{p.paidOn ? `Paid ${fmtShort(p.paidOn)}` : p.status.label}</Tag>
                    {!p.paidOn && p.notified && <Tag tone="outline">Customer says sent</Tag>}
                  </div>
                </td>
                <td className={`${s.right} ${s.nowrap}`}>
                  {p.paidOn ? (
                    <ActionButton action={undoPaid.bind(null, p.id)} className="btn btn-ghost btn-sm">
                      Undo
                    </ActionButton>
                  ) : (
                    <>
                      {p.status.cat === 'overdue' && (
                        <a className="btn btn-ghost btn-sm" href={p.reminderHref} target="_blank" rel="noopener noreferrer">
                          Message
                        </a>
                      )}{' '}
                      <ActionButton action={markPaid.bind(null, p.id)} success={`${p.name} marked paid`}>
                        Mark paid
                      </ActionButton>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
