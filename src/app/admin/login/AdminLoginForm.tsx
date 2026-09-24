'use client';

import { useActionState } from 'react';
import { adminLogin } from '../actions';

export function AdminLoginForm() {
  const [error, action, pending] = useActionState(adminLogin, null);
  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input input-lg" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input input-lg" autoComplete="current-password" required />
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="btn btn-primary btn-block btn-lg" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'} <span aria-hidden>→</span>
      </button>
    </form>
  );
}
