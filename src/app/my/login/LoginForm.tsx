'use client';

import { startTransition, useActionState } from 'react';
import { customerLogin, type LoginState } from '../actions';

export function LoginForm({ usePin }: { usePin: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(customerLogin, { step: usePin ? 'pin' : 'phone', phone: '' });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => action(fd));
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      {state.step === 'pin' && (
        <div className="field">
          <label htmlFor="pin">PIN (from TG Car Vibes)</label>
          <input id="pin" name="pin" className="input input-lg" type="password" inputMode="numeric" autoComplete="current-password" maxLength={8} required />
        </div>
      )}
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
