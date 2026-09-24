'use client';

import { useActionState } from 'react';
import { customerLogin, type LoginState } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(customerLogin, { step: 'phone', phone: '' });

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="field">
        <label htmlFor="phone">Mobile number</label>
        <input
          id="phone"
          name="phone"
          className="input input-lg"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0412 345 678"
          defaultValue={state.phone}
          readOnly={state.step === 'code'}
          required
        />
      </div>
      {state.step === 'code' && (
        <div className="field">
          <label htmlFor="code">6-digit code sent by SMS</label>
          <input
            id="code"
            name="code"
            className="input input-lg"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={7}
            autoFocus
            required
          />
        </div>
      )}
      {state.error && <div className="form-error" role="alert">{state.error}</div>}
      <button className="btn btn-primary btn-block btn-lg" disabled={pending}>
        {pending ? 'Please wait…' : state.step === 'phone' ? 'Send me a code' : 'Sign in'} <span aria-hidden>→</span>
      </button>
      {state.step === 'code' && (
        <button className="btn btn-ghost" name="resend" value="1" formNoValidate disabled={pending} style={{ alignSelf: 'flex-start' }}>
          Send a new code
        </button>
      )}
    </form>
  );
}
