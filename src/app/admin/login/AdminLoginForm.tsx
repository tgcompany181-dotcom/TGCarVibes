'use client';

import { startTransition, useActionState } from 'react';
import { adminLogin } from '../actions';

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => action(fd));
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="field">
        <label htmlFor="email">Email or username</label>
        <input id="email" name="email" type="text" autoCapitalize="none" className="input input-lg" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input input-lg" autoComplete="current-password" required />
      </div>
      {state?.error && <div className="form-error" role="alert">{state.error}</div>}
      <button className="btn btn-primary btn-block btn-lg" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'} <span aria-hidden>→</span>
      </button>
    </form>
  );
}
