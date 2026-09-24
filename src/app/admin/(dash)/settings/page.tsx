import { getAdminData } from '@/lib/admin-data';
import { dataMode } from '@/lib/config';
import { ChangePasswordForm } from './ChangePasswordForm';

export default async function SettingsPage() {
  await getAdminData();
  const mode = dataMode();
  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Settings</h2>
      <section style={{ maxWidth: 420 }}>
        <h4 style={{ borderBottom: '2px solid var(--color-divider)', paddingBottom: 8 }}>Change admin password</h4>
        {mode === 'local' ? (
          <ChangePasswordForm />
        ) : (
          <p className="muted">
            {mode === 'demo'
              ? 'Not available in demo mode.'
              : 'Admin accounts are managed in Supabase → Authentication → Users.'}
          </p>
        )}
      </section>
    </>
  );
}
