import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { BUSINESS, dataMode } from '@/lib/config';
import { DEMO_ADMIN } from '@/lib/data/demo';
import s from '../admin.module.css';
import { AdminLoginForm } from './AdminLoginForm';

export const metadata = { title: 'Admin — TG Car Vibes' };

export default async function AdminLogin() {
  if ((await getSession())?.role === 'admin') redirect('/admin');
  return (
    <div className={s.login}>
      <div className={s.loginCard}>
        <div>
          <Link href="/" className={`logo ${s.brandLogo}`}>
            {BUSINESS.name}
          </Link>
          <div className={s.brandSub}>Admin</div>
        </div>
        <AdminLoginForm />
        {dataMode() === 'demo' && (
          <div className="muted" style={{ fontSize: 13, background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 12 }}>
            <b>Demo mode.</b> Email {DEMO_ADMIN.email}, password {DEMO_ADMIN.password}.
          </div>
        )}
      </div>
    </div>
  );
}
