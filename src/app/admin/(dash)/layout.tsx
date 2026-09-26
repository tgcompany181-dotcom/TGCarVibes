import { BrandLogo } from '@/components/ui/BrandLogo';
import { ToastProvider } from '@/components/ui/Toast';
import { getAdminData } from '@/lib/admin-data';
import { BUSINESS } from '@/lib/config';
import { fmtFull } from '@/lib/dates';
import { activeRentals, complianceItems, paymentTotals } from '@/lib/derive';
import { signOut } from '../../my/actions';
import s from '../admin.module.css';
import { AdminNav } from './AdminNav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data, today, requests } = await getAdminData();
  const newRequests = requests?.filter((r) => r.status === 'new').length ?? 0;
  const overdue = paymentTotals(data.invoices, today).overdueCount;
  const customers = new Set(activeRentals(data.rentals, today).map((r) => r.customerId)).size;
  const tabs = [
    { href: '/admin', label: 'Overview', badge: '' },
    ...(requests ? [{ href: '/admin/requests', label: 'Requests', badge: newRequests ? `${newRequests} new` : '' }] : []),
    { href: '/admin/fleet', label: 'Fleet', badge: String(data.cars.length) },
    { href: '/admin/customers', label: 'Customers', badge: String(customers) },
    { href: '/admin/payments', label: 'Payments', badge: overdue ? `${overdue} overdue` : '' },
    { href: '/admin/compliance', label: 'Compliance', badge: String(complianceItems(data.cars, today).length) },
    { href: '/admin/settings', label: 'Settings', badge: '' },
  ];
  return (
    <ToastProvider>
      <div className={s.shell}>
        <aside className={s.side}>
          <div className={s.brand}>
            <BrandLogo height={26} />
            <div className={s.brandSub}>Admin</div>
          </div>
          <AdminNav tabs={tabs} />
          <div className={s.sideFoot}>
            <span>{fmtFull(today)}</span>
            <form action={signOut.bind(null, 'admin')}>
              <button className="btn btn-ghost btn-sm">Sign out</button>
            </form>
          </div>
        </aside>
        <main className={s.content}>{children}</main>
      </div>
    </ToastProvider>
  );
}
