'use client';

import { useTransition } from 'react';
import type { ActionResult } from '@/app/admin/actions';
import { useToast } from './Toast';

/** Button that runs a server action and shows the outcome as a toast. */
export function ActionButton({
  action,
  success,
  className = 'btn btn-primary btn-sm',
  children,
}: {
  action: () => Promise<ActionResult>;
  success?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const flash = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await action();
          if (!res.ok) flash(res.error);
          else if (success) flash(success);
        })
      }
    >
      {children}
    </button>
  );
}
