import type { Metadata } from 'next';
import { ContractDocument } from '@/components/contract/ContractDocument';
import s from '@/components/contract/contract.module.css';
import { SignaturePad } from '@/components/contract/SignaturePad';
import { PrintButton } from '@/components/contract/PrintButton';
import { FINAL_DECLARATION, INSURANCE_ACK, RENTER_FIELDS } from '@/lib/contract-terms';
import { BUSINESS, telHref } from '@/lib/config';
import { getRepo } from '@/lib/data';
import { SignForm } from './SignForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Rental agreement — TG Car Vibes', robots: { index: false, follow: false } };

const wrap = { background: 'var(--color-bg)', minHeight: '100dvh', padding: '20px 0 0' } as const;

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contract = /^[a-f0-9]{48}$/.test(token) ? await getRepo().getContractByToken?.(token) : null;

  if (!contract || contract.status === 'cancelled') {
    return (
      <main style={wrap}>
        <div className={s.doc} style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 22 }}>This link is not valid</h1>
          <p>
            The agreement may have been replaced or cancelled. Please contact {BUSINESS.ownerName} on{' '}
            <a href={telHref}>{BUSINESS.ownerPhone}</a>.
          </p>
        </div>
      </main>
    );
  }

  if (contract.status === 'signed') {
    return (
      <main style={wrap}>
        <div className={s.noPrint} style={{ maxWidth: 820, margin: '0 auto 12px', padding: '0 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <b style={{ marginRight: 'auto' }}>✓ Thank you — your agreement has been signed.</b>
          <PrintButton />
        </div>
        <ContractDocument contract={contract} signatureUrl={(w) => `/sign/${token}/signature/${w}`} />
        <div style={{ height: 40 }} />
      </main>
    );
  }

  const r = contract.renter;
  const renterInputs = (
    <div>
      <p style={{ fontSize: 13, color: '#5a5f68', margin: '0 0 8px' }}>Please check and complete your details.</p>
      <table className={s.table}>
        <tbody>
          {RENTER_FIELDS.map(([key, label, required]) => (
            <tr key={key}>
              <th scope="row">
                <label htmlFor={'renter-' + key}>
                  {label}
                  {required ? ' *' : ''}
                </label>
              </th>
              <td>
                <input
                  id={'renter-' + key}
                  name={'renter-' + key}
                  className={s.input}
                  required={required}
                  maxLength={300}
                  type={key === 'email' ? 'email' : key === 'mobile' ? 'tel' : 'text'}
                  defaultValue={r?.[key] ?? (key === 'fullName' ? contract.details.renterName : key === 'mobile' ? contract.details.mobile : '')}
                  autoComplete={key === 'fullName' ? 'name' : key === 'email' ? 'email' : key === 'mobile' ? 'tel' : key === 'address' ? 'street-address' : 'off'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ack = (name: string, text: string, sig: string, label: string) => (
    <div>
      <div className={s.ack}>
        <label>
          <input type="checkbox" name={name} required />
          <span>{text}</span>
        </label>
      </div>
      <SignaturePad name={sig} label={label} />
    </div>
  );

  return (
    <main style={wrap}>
      <div style={{ maxWidth: 820, margin: '0 auto 12px', padding: '0 16px' }}>
        <b>Please read the whole agreement, fill in your details, then tick and sign in the two places marked.</b>
      </div>
      <SignForm token={token}>
        <ContractDocument
          contract={contract}
          renterSlot={renterInputs}
          insuranceSlot={ack('agreeInsurance', INSURANCE_ACK, 'sigInsurance', 'Signature — insurance acknowledgement')}
          finalSlot={ack('agreeFinal', FINAL_DECLARATION, 'sigFinal', 'Signature — Renter')}
        />
      </SignForm>
    </main>
  );
}
