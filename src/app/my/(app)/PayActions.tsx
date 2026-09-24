'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/ui/Toast';
import { BUSINESS } from '@/lib/config';
import { notifyTransferred } from '../actions';
import s from '../my.module.css';

export function PayActions({ invoiceId, notified }: { invoiceId: string; notified: boolean }) {
  const flash = useToast();
  const [pending, start] = useTransition();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BUSINESS.payId);
      flash('PayID copied');
    } catch {
      flash('Copy failed — PayID: ' + BUSINESS.payId);
    }
  };

  const notify = () =>
    start(async () => {
      try {
        await notifyTransferred(invoiceId);
        flash(`${BUSINESS.ownerName} has been notified`);
      } catch {
        flash('Something went wrong. Please try again.');
      }
    });

  return (
    <div className={s.payButtons}>
      <button className="btn btn-secondary" onClick={copy}>
        Copy PayID
      </button>
      {notified ? (
        <div className={s.sent}>Sent — waiting for {BUSINESS.ownerName} to confirm</div>
      ) : (
        <button className="btn btn-primary" onClick={notify} disabled={pending}>
          {pending ? 'Sending…' : 'I’ve transferred'}
        </button>
      )}
    </div>
  );
}
