'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { Dialog } from '@/components/ui/Dialog';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { money, toIntlPhone, whatsappLink } from '@/lib/format';
import type { Contract } from '@/lib/types';
import { cancelContract, createContract } from '../../actions';
import s from '../../admin.module.css';

export interface HireOption {
  customerId: string;
  label: string;
  renterName: string;
  mobile: string;
  vehicleRego: string;
  vehicleDescription: string;
  start: string;
  end: string;
  weeklyRent: number;
  bond: number;
}

type Row = Contract & { customerPhone: string | null };

const when = (iso: string) => new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function ContractsList({ contracts, hires, today, siteUrl }: { contracts: Row[]; hires: HireOption[]; today: string; siteUrl: string }) {
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<{ token: string; name: string; mobile: string; rego: string } | null>(null);

  return (
    <>
      <div className={s.head}>
        <h2>
          Contracts <span className={s.count}>{contracts.length}</span>
        </h2>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + New contract
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Renter</th>
              <th>Vehicle</th>
              <th>Term</th>
              <th>Rent</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr>
                <td className="empty" colSpan={6}>
                  No contracts yet. Click “+ New contract” to send one for online signing.
                </td>
              </tr>
            )}
            {contracts.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.renter?.fullName || c.details.renterName}</td>
                <td>
                  <span className={s.plate}>{c.details.vehicleRego}</span> <span className="muted">{c.details.vehicleDescription}</span>
                </td>
                <td className={s.nowrap}>
                  {c.details.startDateTime} → {c.details.endDateTime}
                </td>
                <td>{money(c.details.weeklyRent)}/wk</td>
                <td>
                  {c.status === 'signed' && !c.countersignedAt ? (
                    <Tag tone="accent">Signed by renter — countersign</Tag>
                  ) : c.status === 'signed' ? (
                    <Tag tone="neutral">Fully signed {c.countersignedAt ? when(c.countersignedAt) : ''}</Tag>
                  ) : c.status === 'sent' ? (
                    <Tag tone="outline">Waiting for signature</Tag>
                  ) : (
                    <Tag tone="neutral">Cancelled</Tag>
                  )}
                </td>
                <td className={`${s.right} ${s.nowrap}`}>
                  {c.status === 'signed' && (
                    <Link className={c.countersignedAt ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'} href={`/admin/contracts/${c.id}`}>
                      {c.countersignedAt ? 'View' : 'Countersign'}
                    </Link>
                  )}
                  {c.status === 'sent' && (
                    <>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSharing({ token: c.token, name: c.details.renterName, mobile: c.details.mobile, rego: c.details.vehicleRego })}
                      >
                        Send link
                      </button>{' '}
                      <ActionButton action={cancelContract.bind(null, c.id)} className="btn btn-ghost btn-sm" confirmText="Cancel this contract? The signing link will stop working.">
                        Cancel
                      </ActionButton>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && (
        <NewContractDialog
          hires={hires}
          today={today}
          onClose={() => setCreating(false)}
          onCreated={(x) => {
            setCreating(false);
            setSharing(x);
          }}
        />
      )}
      {sharing && <ShareDialog {...sharing} siteUrl={siteUrl} onClose={() => setSharing(null)} />}
    </>
  );
}

function NewContractDialog({
  hires,
  today,
  onClose,
  onCreated,
}: {
  hires: HireOption[];
  today: string;
  onClose: () => void;
  onCreated: (x: { token: string; name: string; mobile: string; rego: string }) => void;
}) {
  const blank: HireOption = { customerId: '', label: '', renterName: '', mobile: '', vehicleRego: '', vehicleDescription: '', start: today, end: '', weeklyRent: 0, bond: 0 };
  const [f, setF] = useState<HireOption>(blank);
  const [key, setKey] = useState(0);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const pick = (id: string) => {
    setF(hires.find((h) => h.customerId === id) ?? blank);
    setKey((k) => k + 1); // re-mount inputs with the new defaults
  };

  const submit = (form: FormData) =>
    start(async () => {
      const res = await createContract(form);
      if (!res.ok) return setError(res.error);
      onCreated({ token: res.token, name: String(form.get('renterName')), mobile: String(form.get('mobile')), rego: String(form.get('vehicleRego')) });
    });

  return (
    <Dialog onClose={onClose} width={560} labelledBy="nc-title">
      <div id="nc-title" className="dialog-title">
        New contract
      </div>
      <div className="field">
        <label htmlFor="nc-hire">Fill in from a current hire (optional)</label>
        <select id="nc-hire" className="input" value={f.customerId} onChange={(e) => pick(e.target.value)}>
          <option value="">— New customer / fill in manually —</option>
          {hires.map((h) => (
            <option key={h.customerId} value={h.customerId}>
              {h.label}
            </option>
          ))}
        </select>
      </div>
      <form
        key={key}
        onSubmit={(e) => {
          e.preventDefault();
          submit(new FormData(e.currentTarget));
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <input type="hidden" name="customerId" value={f.customerId} />
        <div className="form-grid">
          <div className="field">
            <label htmlFor="nc-name">Renter name</label>
            <input id="nc-name" name="renterName" className="input" defaultValue={f.renterName} required />
          </div>
          <div className="field">
            <label htmlFor="nc-mobile">Mobile</label>
            <input id="nc-mobile" name="mobile" className="input" defaultValue={f.mobile} placeholder="0412 345 678" />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="nc-rego">Registration no.</label>
            <input id="nc-rego" name="vehicleRego" className="input" defaultValue={f.vehicleRego} required style={{ textTransform: 'uppercase' }} />
          </div>
          <div className="field">
            <label htmlFor="nc-desc">Make / model / year / colour</label>
            <input id="nc-desc" name="vehicleDescription" className="input" defaultValue={f.vehicleDescription} required />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="nc-start">Start date and time</label>
            <input id="nc-start" name="startDateTime" className="input" defaultValue={f.start ? `${f.start.split('-').reverse().join('/')} 10:00am` : ''} required />
          </div>
          <div className="field">
            <label htmlFor="nc-end">Ending date and return time</label>
            <input id="nc-end" name="endDateTime" className="input" defaultValue={f.end ? `${f.end.split('-').reverse().join('/')} 10:00am` : ''} placeholder="dd/mm/yyyy 10:00am" required />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="nc-rent">Weekly rent ($)</label>
            <input id="nc-rent" name="weeklyRent" className="input" inputMode="decimal" defaultValue={f.weeklyRent || ''} required />
          </div>
          <div className="field">
            <label htmlFor="nc-bond">Bond ($)</label>
            <input id="nc-bond" name="bond" className="input" inputMode="decimal" defaultValue={f.bond || ''} required />
          </div>
          <div className="field">
            <label htmlFor="nc-day">Payment day</label>
            <select id="nc-day" name="paymentDay" className="input" defaultValue="">
              <option value="">—</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="nc-fuel">Fuel type / grade</label>
          <select id="nc-fuel" name="fuelGrade" className="input" defaultValue="Petrol — 91">
            {['Petrol — 91', 'Petrol — 95', 'Petrol — 98', 'Petrol — 95 / 98'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="muted" style={{ fontSize: 13 }}>
          The renter fills in their own personal details (date of birth, licence, address, email, emergency contact) when they sign.
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? 'Creating…' : 'Create signing link'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function ShareDialog({ token, name, mobile, rego, siteUrl, onClose }: { token: string; name: string; mobile: string; rego: string; siteUrl: string; onClose: () => void }) {
  const flash = useToast();
  const link = `${siteUrl}/sign/${token}`;
  const first = name.split(' ')[0] || 'there';
  const msg = `Hi ${first}, here is your TG Car Vibes rental agreement for ${rego}. Please read it, fill in your details and sign online (no download needed): ${link}`;
  const intl = toIntlPhone(mobile);
  const local = intl ? '0' + intl.slice(2) : '';

  return (
    <Dialog onClose={onClose} width={560} labelledBy="share-title">
      <div id="share-title" className="dialog-title">
        Send the signing link to {name}
      </div>
      <div className="field">
        <label htmlFor="share-link">Signing link</label>
        <input id="share-link" className="input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              flash('Link copied');
            } catch {
              flash('Copy failed — select the link and copy it');
            }
          }}
        >
          Copy link
        </button>
        <a className="btn btn-secondary" href={`mailto:?subject=${encodeURIComponent('Your TG Car Vibes rental agreement')}&body=${encodeURIComponent(msg)}`}>
          Email
        </a>
        {local && (
          <a className="btn btn-secondary" href={`sms:${local}?&body=${encodeURIComponent(msg)}`}>
            SMS
          </a>
        )}
        {intl && (
          <a className="btn btn-secondary" href={whatsappLink(intl, msg)} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        )}
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        Anyone with this link can view and sign this agreement — only send it to the renter. You can also open it on your own phone or tablet at pick-up and hand it to the renter to sign.
      </div>
      <div className="dialog-actions">
        <a className="btn btn-secondary" href={link} target="_blank" rel="noopener noreferrer">
          Open signing page
        </a>
        <button className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Dialog>
  );
}
