'use client';

import { useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { Tag } from '@/components/ui/Tag';
import { daysBetween, fmtShort } from '@/lib/dates';
import { money, toIntlPhone, whatsappLink } from '@/lib/format';
import type { BookingRequest, RequestStatus } from '@/lib/types';
import { deleteRequest, setRequestStatus } from '../../actions';
import s from '../../admin.module.css';

const FILTERS: [RequestStatus | 'all', string][] = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['closed', 'Closed'],
  ['all', 'All'],
];

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function RequestsList({ requests }: { requests: BookingRequest[] }) {
  const [f, setF] = useState<RequestStatus | 'all'>(requests.some((r) => r.status === 'new') ? 'new' : 'all');
  const shown = requests.filter((r) => f === 'all' || r.status === f);

  return (
    <>
      <div className={s.head}>
        <h2>
          Booking requests <span className={s.count}>{requests.length}</span>
        </h2>
      </div>
      <div className="seg" style={{ marginBottom: 16 }}>
        {FILTERS.map(([id, label]) => (
          <button key={id} className={f === id ? 'on-accent' : undefined} aria-pressed={f === id} onClick={() => setF(id)}>
            {label} · {id === 'all' ? requests.length : requests.filter((r) => r.status === id).length}
          </button>
        ))}
      </div>
      {shown.length === 0 && <div className={s.empty}>No requests here.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((r) => {
          const intl = toIntlPhone(r.phone);
          const weeks = Math.ceil(daysBetween(r.pickDate, r.returnDate) / 7);
          return (
            <article key={r.id} className={s.requestCard} data-new={r.status === 'new' || undefined}>
              <div className={s.requestTop}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{r.name}</div>
                  <div className={s.itemSub}>Sent {when(r.createdAt)}</div>
                </div>
                <div className={s.tags}>
                  {r.waitlist && <Tag tone="outline">Waitlist</Tag>}
                  <Tag tone={r.status === 'new' ? 'accent' : 'neutral'}>{r.status === 'new' ? 'New' : r.status === 'contacted' ? 'Contacted' : 'Closed'}</Tag>
                </div>
              </div>
              <div className="rows" style={{ marginTop: 10 }}>
                <div className="row"><span>Car</span><span>{r.car} · {money(r.weeklyRate)}/wk</span></div>
                <div className="row"><span>Dates</span><span>{fmtShort(r.pickDate)} → {fmtShort(r.returnDate)} ({weeks} weeks)</span></div>
                <div className="row"><span>Mobile</span><span>{r.phone}</span></div>
                {r.answers.map((a) => (
                  <div key={a.question} className="row"><span>{a.question}</span><span>{a.answer}</span></div>
                ))}
                {r.message && <div className="row"><span>Message</span><span style={{ whiteSpace: 'pre-wrap', fontWeight: 400 }}>{r.message}</span></div>}
              </div>
              {!!r.documents?.length && (
                <div className={s.docs}>
                  {r.documents.map((d) => (
                    <a key={d.file} href={`/admin/documents/${d.file}`} target="_blank" rel="noopener noreferrer" className={s.docThumb}>
                      {d.file.endsWith('.pdf') ? (
                        <span className={s.docPdf}>PDF</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/admin/documents/${d.file}`} alt={d.label} loading="lazy" />
                      )}
                      <span>{d.label}</span>
                    </a>
                  ))}
                </div>
              )}
              <div className={s.requestActions}>
                <a className="btn btn-primary btn-sm" href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>Call</a>
                <a className="btn btn-secondary btn-sm" href={`sms:${r.phone.replace(/[^\d+]/g, '')}`}>SMS</a>
                {intl && (
                  <a className="btn btn-secondary btn-sm" href={whatsappLink(intl, `Hi ${r.name.split(' ')[0]}, this is TG Car Vibes about your ${r.car} request.`)} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                )}
                <span style={{ marginLeft: 'auto' }} />
                {r.status !== 'contacted' && (
                  <ActionButton action={setRequestStatus.bind(null, r.id, 'contacted')} className="btn btn-ghost btn-sm" success="Marked as contacted">
                    Mark contacted
                  </ActionButton>
                )}
                <ActionButton
                  action={deleteRequest.bind(null, r.id)}
                  className="btn btn-ghost btn-sm"
                  success="Request and documents deleted"
                  confirmText={`Delete ${r.name}'s request and their documents? This cannot be undone.`}
                >
                  Delete
                </ActionButton>
                {r.status !== 'closed' ? (
                  <ActionButton action={setRequestStatus.bind(null, r.id, 'closed')} className="btn btn-ghost btn-sm" success="Request closed">
                    Close
                  </ActionButton>
                ) : (
                  <ActionButton action={setRequestStatus.bind(null, r.id, 'new')} className="btn btn-ghost btn-sm">
                    Reopen
                  </ActionButton>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
