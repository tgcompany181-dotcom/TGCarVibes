'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SignaturePad } from '@/components/contract/SignaturePad';
import { useToast } from '@/components/ui/Toast';
import { countersignContract } from '../../../actions';

export function Countersign({ id }: { id: string }) {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const flash = useToast();
  const router = useRouter();

  return (
    <form
      className="no-print"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await countersignContract(id, fd);
          if (!res.ok) return setError(res.error);
          flash('Agreement countersigned');
          router.refresh();
        });
      }}
      style={{ maxWidth: 820, margin: '0 auto 20px', background: 'var(--color-accent-100)', border: '2px solid var(--color-accent)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ fontWeight: 800, fontSize: 17 }}>The renter has signed — check the details below, then countersign for TG Car Vibes</div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="cs-name">Your name</label>
          <input id="cs-name" name="ownerName" className="input" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="cs-title">Title</label>
          <input id="cs-title" name="ownerTitle" className="input" defaultValue="Director" />
        </div>
      </div>
      <SignaturePad name="ownerSig" label="Signature — for TG Car Vibes Pty Ltd" />
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <button className="btn btn-primary btn-lg" disabled={pending} style={{ alignSelf: 'flex-start' }}>
        {pending ? 'Saving…' : 'Countersign agreement'}
      </button>
    </form>
  );
}
