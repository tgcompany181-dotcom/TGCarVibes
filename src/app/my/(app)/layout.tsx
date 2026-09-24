import { ToastProvider } from '@/components/ui/Toast';
import { getMyData } from '@/lib/my-data';
import { signOut } from '../actions';
import s from '../my.module.css';
import { Tabs } from './Tabs';

export const dynamic = 'force-dynamic';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { customer } = await getMyData();
  return (
    <ToastProvider>
      <div className={s.shell}>
        <div className={s.app}>
          <header className={s.top}>
            <div className={s.hi}>Hi {customer.firstName}</div>
            <form action={signOut.bind(null, 'customer')}>
              <button className="btn btn-ghost">Sign out</button>
            </form>
          </header>
          <main className={s.main}>{children}</main>
          <Tabs />
        </div>
      </div>
    </ToastProvider>
  );
}
