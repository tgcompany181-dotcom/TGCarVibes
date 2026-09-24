import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { BUSINESS, dataMode, telHref } from '@/lib/config';
import { DEMO_CUSTOMER_PHONE, DEMO_OTP } from '@/lib/data/demo';
import { displayPhone } from '@/lib/format';
import { signOut } from '../actions';
import s from '../my.module.css';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'My rental — TG Car Vibes' };

export default async function CustomerLogin() {
  const session = await getSession();
  if (session?.role === 'customer') redirect('/my');
  const mode = dataMode();
  const demo = mode === 'demo';

  return (
    <div className={s.shell}>
      <div className={s.app}>
        <div className={s.login}>
          <Link href="/" className={`logo ${s.loginBrand}`}>
            {BUSINESS.name}
          </Link>
          <div style={{ marginTop: 24 }}>
            <h1 style={{ margin: '0 0 8px' }}>My rental</h1>
            <p className="muted" style={{ margin: 0 }}>
              See your car, your next payment and how to reach us.
            </p>
          </div>

          {session?.role === 'unlinked' ? (
            <>
              <div className="form-error">
                We couldn’t find a rental for {displayPhone(session.phone) || 'this number'}. If you’ve just picked up a car, ask {BUSINESS.ownerName} to add
                this number.
              </div>
              <form action={signOut.bind(null, 'customer')}>
                <button className="btn btn-secondary btn-block btn-lg">Use a different number</button>
              </form>
            </>
          ) : (
            <LoginForm usePin={mode !== 'supabase'} />
          )}

          <div className="muted" style={{ fontSize: 13 }}>
            No PIN yet, or forgot it? Call {BUSINESS.ownerName} on <a href={telHref}>{BUSINESS.ownerPhone}</a>.
          </div>
          {demo && (
            <div className={s.demo}>
              <b>Demo mode.</b> Sign in with {DEMO_CUSTOMER_PHONE} and PIN {DEMO_OTP}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
