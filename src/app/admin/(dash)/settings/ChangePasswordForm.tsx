'use client';

import { startTransition, useActionState, useRef } from 'react';
import { changeAdminPassword, type PasswordState } from '../../actions';

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changeAdminPassword, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div className="field">
        <label htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" className="input input-lg" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="next">New password (at least 8 characters)</label>
        <input id="next" name="next" type="password" className="input input-lg" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="field">
        <label htmlFor="confirm">New password again</label>
        <input id="confirm" name="confirm" type="password" className="input input-lg" autoComplete="new-password" minLength={8} required />
      </div>
      {state && (
        <div className={state.ok ? 'tag tag-neutral' : 'form-error'} role="status" style={state.ok ? { fontSize: 13, padding: '8px 12px' } : undefined}>
          {state.message}
        </div>
      )}
      <button className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }} disabled={pending}>
        {pending ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
