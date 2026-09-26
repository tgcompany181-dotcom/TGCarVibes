import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContractDocument } from '@/components/contract/ContractDocument';
import { PrintButton } from '@/components/contract/PrintButton';
import { getAdminData } from '@/lib/admin-data';
import { getRepo } from '@/lib/data';

export default async function ContractView({ params }: { params: Promise<{ id: string }> }) {
  await getAdminData();
  const { id } = await params;
  const c = await getRepo().getContract?.(id);
  if (!c) notFound();
  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }} className="no-print">
        <Link href="/admin/contracts" className="btn btn-ghost">
          ← Contracts
        </Link>
        <span style={{ marginRight: 'auto' }} />
        <PrintButton />
      </div>
      {c.status === 'signed' && (
        <p className="muted no-print" style={{ fontSize: 13 }}>
          Signed from IP {c.signerIp} · {c.signerAgent}
        </p>
      )}
      <ContractDocument
        contract={c}
        signatureUrl={(w) => `/admin/documents/${w === 'insurance' ? c.insuranceSignature : c.finalSignature}`}
      />
    </>
  );
}
