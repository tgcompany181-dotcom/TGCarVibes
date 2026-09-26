import { CONTRACT_SECTIONS, FINAL_DECLARATION, INSURANCE_ACK, RENTER_FIELDS, type Run } from '@/lib/contract-terms';
import { money } from '@/lib/format';
import type { Contract } from '@/lib/types';
import s from './contract.module.css';

const OWNER: [string, string][] = [
  ['Company', 'TG CAR VIBES PTY LTD'],
  ['ACN', '685 536 798'],
  ['Phone', '0451 688 698'],
  ['Email', 'tgcompany181@gmail.com'],
  ['Postal address', 'PO Box 3040, Bankstown Square NSW 2200'],
  ['Pick-up / return location', 'Bankstown Square NSW 2200'],
  ['Bank account (CommBank)', 'TG Car Vibes Pty Ltd · BSB 062-334 · Account 12102641'],
];



const runs = (r: Run[]) => r.map((x, i) => (x.bold ? <strong key={i}>{x.text}</strong> : <span key={i}>{x.text}</span>));

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <table className={s.table}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th scope="row">{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The rental agreement as a web page. Used read-only (signed copy) and on the signing page,
 * where the renter fields and the two acknowledgement/signature spots are supplied as slots.
 */
export function ContractDocument({
  contract,
  renterSlot,
  insuranceSlot,
  finalSlot,
  signatureUrl,
}: {
  contract: Contract;
  renterSlot?: React.ReactNode;
  insuranceSlot?: React.ReactNode;
  finalSlot?: React.ReactNode;
  /** Builds the URL of a stored signature image (signed copies only). */
  signatureUrl?: (which: 'insurance' | 'final' | 'owner') => string;
}) {
  const d = contract.details;
  const r = contract.renter;
  const signed = contract.status === 'signed' && r;
  const when = contract.signedAt ? new Date(contract.signedAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }) : '';

  const signedBlock = (which: 'insurance' | 'final', text: string) => (
    <>
      <div className={s.ack}>☑ {text}</div>
      <div className={s.sigBox}>
        {signatureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.sigImg} src={signatureUrl(which)} alt={`Signature of ${r?.fullName}`} />
        )}
        <div className={s.sigMeta}>
          Signed electronically by <b>{r?.fullName}</b> on {when} (Sydney time)
        </div>
      </div>
    </>
  );

  return (
    <article className={s.doc}>
      <header className={s.head}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/tg-car-vibes-logo.png" alt="TG Car Vibes" width={280} height={42} />
        <div className={s.title}>VEHICLE RENTAL AGREEMENT</div>
        <div className={s.subtitle}>Fixed-term hire</div>
      </header>

      <div className={s.label}>THE OWNER</div>
      <Rows rows={OWNER} />

      <div className={s.label}>THE RENTER</div>
      {renterSlot ?? <Rows rows={RENTER_FIELDS.map(([k, label]) => [label, r?.[k] || '—'])} />}

      <div className={s.label}>THE VEHICLE</div>
      <Rows
        rows={[
          ['Registration no.', d.vehicleRego],
          ['Make / model / year / colour', d.vehicleDescription],
          ['Fuel type / grade', d.fuelGrade],
        ]}
      />

      <div className={s.label}>RENTAL DETAILS</div>
      <Rows
        rows={[
          ['Start date and time', d.startDateTime],
          ['Ending date and return time', d.endDateTime],
          ['Weekly rent', money(d.weeklyRent)],
          ['Payment day each week', d.paymentDay],
          ['Bond (2 weeks’ rent)', money(d.bond)],
          ['Payment method', 'Bank transfer to BSB 062-334, Account 12102641 (TG Car Vibes Pty Ltd) · Reference: ' + (d.vehicleRego || 'registration no.')],
        ]}
      />
      <p style={{ marginTop: 14 }}>
        This Agreement is between TG Car Vibes Pty Ltd (&quot;we&quot;, &quot;us&quot;, &quot;the Owner&quot;) and the Renter named above
        (&quot;you&quot;, &quot;the Renter&quot;). It is made up of the Agreement Details above, the terms and conditions below and the
        Vehicle Pick-up Report. By signing, you confirm that you have read and agree to all of them.
      </p>

      {CONTRACT_SECTIONS.map((sec) => (
        <section key={sec.title}>
          <h2 className={s.h1}>{sec.title}</h2>
          {sec.blocks.map((b, i) =>
            b.type === 'insuranceAck' ? (
              <div key={i}>{signed ? signedBlock('insurance', INSURANCE_ACK) : insuranceSlot}</div>
            ) : (
              <div key={i} className={b.type === 'clause' ? s.clause : s.sub}>
                <span className={b.type === 'clause' ? s.num : undefined}>{b.num}</span>
                <span>{runs(b.runs)}</span>
              </div>
            ),
          )}
        </section>
      ))}

      <h2 className={s.h1}>Declaration and signatures</h2>
      {signed ? signedBlock('final', FINAL_DECLARATION) : finalSlot}

      <div className={s.label}>FOR TG CAR VIBES PTY LTD</div>
      {contract.countersignedAt ? (
        <div className={s.sigBox}>
          {signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={s.sigImg} src={signatureUrl('owner')} alt={`Signature of ${contract.ownerName}`} />
          )}
          <div className={s.sigMeta}>
            Signed electronically by <b>{contract.ownerName}</b>
            {contract.ownerTitle ? `, ${contract.ownerTitle}` : ''} on{' '}
            {new Date(contract.countersignedAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} (Sydney time)
          </div>
        </div>
      ) : (
        <div className={s.sigBox} style={{ color: '#5a5f68' }}>
          {signed ? 'Awaiting countersignature by TG Car Vibes Pty Ltd.' : 'TG Car Vibes Pty Ltd will countersign after you have signed.'}
        </div>
      )}

      {signed && (
        <>
          <p style={{ marginTop: 16 }}>
            <span className={s.stamp}>✓ Signed {when}</span>
          </p>
          <p className={s.sigMeta}>
            Agreement version {contract.termsVersion} · Document fingerprint (SHA-256): <code style={{ wordBreak: 'break-all' }}>{contract.hash}</code>
          </p>
        </>
      )}

      <section className={s.pageBreak}>
        <h2 className={s.h1}>Vehicle pick-up report</h2>
        <p>To be completed together by the Renter and TG Car Vibes Pty Ltd when the Vehicle is picked up.</p>
        <table className={s.table}>
          <tbody>
            {['Date and time', 'Odometer (km)', 'Fuel level', 'Existing damage / scratches', 'Tyres / lights / windscreen', 'Interior clean', 'Photos taken (Yes / No)', 'Keys handed over', 'Renter signature', 'For TG Car Vibes'].map((k) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td style={{ height: 34 }} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className={s.footer}>TG Car Vibes Pty Ltd · ACN 685 536 798 · 0451 688 698</div>
    </article>
  );
}
