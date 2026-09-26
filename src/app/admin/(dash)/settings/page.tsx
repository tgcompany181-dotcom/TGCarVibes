import { getAdminData } from '@/lib/admin-data';
import { dataMode } from '@/lib/config';
import { getRepo } from '@/lib/data';
import { BannerManager } from './BannerManager';
import { ChangePasswordForm } from './ChangePasswordForm';

const h4 = { borderBottom: '2px solid var(--color-divider)', paddingBottom: 8 } as const;

export default async function SettingsPage() {
  await getAdminData();
  const mode = dataMode();
  const repo = getRepo();
  const banners = (await repo.getBanners?.()) ?? null;
  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Settings</h2>
      <section style={{ maxWidth: 640, marginBottom: 40 }}>
        <h4 style={h4}>Home page cover images</h4>
        {banners ? <BannerManager banners={banners} /> : <p className="muted">Not available in this setup.</p>}
      </section>
      <section style={{ maxWidth: 420 }}>
        <h4 style={h4}>Change admin password</h4>
        {mode === 'local' ? (
          <ChangePasswordForm />
        ) : (
          <p className="muted">
            {mode === 'demo' ? 'Not available in demo mode.' : 'Admin accounts are managed in Supabase → Authentication → Users.'}
          </p>
        )}
      </section>
    </>
  );
}
