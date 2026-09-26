'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { signContract } from './actions';

/** Wraps the contract so every input inside it (renter details, ticks, signatures) submits together. */
export function SignForm({ token, children }: { token: string; children: React.ReactNode }) {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault(); // keep everything typed if something needs fixing
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setError('');
          try {
            const res = await signContract(token, fd);
            if (res.ok) {
              window.scrollTo({ top: 0 });
              router.refresh();
            } else setError(res.error);
          } catch {
            setError('Could not send. Please check your connection and try again.');
          }
        });
      }}
    >
      {children}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 16px 40px' }}>
        {error && (
          <div className="form-error" role="alert" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-block btn-lg" disabled={pending} style={{ marginTop: 16, minHeight: 56, fontSize: 18 }}>
          {pending ? 'Submitting…' : 'Sign and submit agreement'} <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}
